package com.reader.bookengine.database

import android.content.Context
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.serialization.Serializable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Serializable
data class RemoteWordForm(
    val input_word: String,
    val word_lang_code: String,
    val lemma: String,
    val created_at: String,
)

fun addNewLangForSync(langCode: String, context: Context, scope: CoroutineScope) {
    val prefs = context.getSharedPreferences("DictionaryPrefs", Context.MODE_PRIVATE)

    val existingLangs = prefs.getStringSet("sync_langs", emptySet()) ?: emptySet()

    if (existingLangs.contains(langCode)) return

    val updatedLangs = existingLangs.toMutableSet()
    updatedLangs.add(langCode)

    prefs.edit()
        .putStringSet("sync_langs", updatedLangs)
        .remove("sync_cursor_created_at")
        .remove("sync_cursor_input_word")
        .apply()

    val myAppDatabase = AppDependencies.getDatabase(context)
    val mySupabaseClient = AppDependencies.supabaseClient

    scope.launch(Dispatchers.IO) {
        syncWordFormsFromSupabase(
            mySupabaseClient,
            myAppDatabase,
            context
        )
    }
}

suspend fun syncWordFormsFromSupabase(
    supabase: SupabaseClient,
    database: AppDatabase,
    context: Context,
) {
    val prefs = context.getSharedPreferences("DictionaryPrefs", Context.MODE_PRIVATE)
    val batchSize = 1000L

    var cursorCreatedAt: String? = prefs.getString("sync_cursor_created_at", null)
    var cursorInputWord: String? = prefs.getString("sync_cursor_input_word", null)
    val langs = prefs.getStringSet("sync_langs", emptySet()) ?: emptySet()

    var hasMore = true
    var totalSynced = 0

    android.util.Log.d("BookEngine", "Starting full word_forms sync")

    try {
        while (hasMore) {
            val response =
                supabase.from("word_forms").select {
                    order(column = "created_at", order = Order.ASCENDING)
                    order(column = "input_word", order = Order.ASCENDING)
                    order(column = "word_lang_code", order = Order.ASCENDING)
                    limit(count = batchSize)
                    filter {
                        isIn("word_lang_code", langs.toList())

                        if (cursorCreatedAt != null && cursorInputWord != null) {
                            and {
                                or {
                                    gt("created_at", cursorCreatedAt!!)
                                    and {
                                        eq("created_at", cursorCreatedAt!!)
                                        gt("input_word", cursorInputWord!!)
                                    }
                                }
                            }
                        }
                    }
                }

            val remoteData = response.decodeList<RemoteWordForm>()
            if (remoteData.isEmpty()) {
                hasMore = false
                continue
            }

            database.wordFormDao().insertAll(
                remoteData.map { WordFormEntity(it.input_word, it.word_lang_code, it.lemma) },
            )

            val last = remoteData.last()
            cursorCreatedAt = last.created_at
            cursorInputWord = last.input_word
            totalSynced += remoteData.size

            android.util.Log.d(
                "BookEngine",
                "Synced batch of ${remoteData.size}, total=$totalSynced, cursor=$cursorCreatedAt|$cursorInputWord",
            )

            hasMore = remoteData.size.toLong() == batchSize
        }

        if (cursorCreatedAt != null && cursorInputWord != null) {
            prefs
                .edit()
                .putString("sync_cursor_created_at", cursorCreatedAt)
                .putString("sync_cursor_input_word", cursorInputWord)
                .apply()
        }

        android.util.Log.d("BookEngine", "Full sync finished. total=$totalSynced")
    } catch (e: Exception) {
        android.util.Log.e("BookEngine", "Sync error", e)
    }
}
