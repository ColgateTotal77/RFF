package com.reader.bookengine.database

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import android.content.Context
import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@Serializable
data class RemoteWordForm(
    val input_word: String,
    val word_lang_code: String,
    val lemma: String,
    val created_at: String
)

suspend fun syncWordFormsFromSupabase(supabase: SupabaseClient, database: AppDatabase, context: Context) {
    val prefs = context.getSharedPreferences("DictionaryPrefs", Context.MODE_PRIVATE)
    val lastSyncedAt = prefs.getLong("last_synced_at", 0L)
    val batchSize = 1000L

    android.util.Log.d("BookEngine", "Starting sync from timestamp: $lastSyncedAt")

    try {
        var hasMore = true

        var currentCursorString = Instant.ofEpochMilli(lastSyncedAt)
            .atOffset(ZoneOffset.UTC)
            .format(DateTimeFormatter.ISO_INSTANT)

        while (hasMore) {
            val response = supabase.from("word_forms").select {
                if (lastSyncedAt > 0 || currentCursorString != "1970-01-01T00:00:00Z") {
                    filter { gt("created_at", currentCursorString) }
                }
                order(column = "created_at", order = io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                limit(count = batchSize)
            }

            val remoteData = response.decodeList<RemoteWordForm>()

            if (remoteData.isNotEmpty()) {
                val entities = remoteData.map {
                    WordFormEntity(it.input_word, it.word_lang_code, it.lemma)
                }

                database.wordFormDao().insertAll(entities)

                currentCursorString = remoteData.last().created_at

                val cleanTimeStr = if (!currentCursorString.endsWith("Z") && !currentCursorString.contains("+")) {
                    currentCursorString + "Z"
                } else {
                    currentCursorString
                }

                val highestTimestamp = Instant.parse(cleanTimeStr).toEpochMilli()

                prefs.edit().putLong("last_synced_at", highestTimestamp).apply()

                android.util.Log.d("BookEngine", "Synced batch of ${entities.size}. Saved timestamp: $highestTimestamp")

                hasMore = remoteData.size.toLong() == batchSize
            } else {
                hasMore = false
            }
        }

        android.util.Log.d("BookEngine", "Full sync finished.")

    } catch (e: Exception) {
        android.util.Log.e("BookEngine", "Sync error", e)
    }
}
