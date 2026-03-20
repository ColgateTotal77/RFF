package com.reader.bookengine.database

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import android.content.Context
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.*

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
        var currentOffset = 0L
        var highestTimestamp = lastSyncedAt

        val sdfQuery = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val lastSyncedString = sdfQuery.format(Date(lastSyncedAt))

        while (hasMore) {
            val response = supabase.from("word_forms").select {
                if (lastSyncedAt > 0) {
                    filter { gt("created_at", lastSyncedString) }
                }
                order(column = "created_at", order = io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                range(from = currentOffset, to = currentOffset + batchSize - 1)
            }

            val remoteData = response.decodeList<RemoteWordForm>()

            if (remoteData.isNotEmpty()) {
                val entities = remoteData.map {
                    WordFormEntity(it.input_word, it.word_lang_code, it.lemma)
                }

                database.wordFormDao().insertAll(entities)

                val latestRecordTimeStr = remoteData.last().created_at
                val cleanTimeStr = latestRecordTimeStr.substringBefore("Z").substringBefore("+").take(23)
                val latestRecordTimeMs = sdfQuery.parse(cleanTimeStr)?.time ?: highestTimestamp
                highestTimestamp = latestRecordTimeMs + 1

                currentOffset += batchSize
                android.util.Log.d("BookEngine", "Synced batch of ${entities.size}. Next offset: $currentOffset")

                hasMore = remoteData.size.toLong() == batchSize
            } else {
                hasMore = false
            }
        }

        prefs.edit().putLong("last_synced_at", highestTimestamp).apply()
        android.util.Log.d("BookEngine", "Full sync finished. New last_synced_at: $highestTimestamp")

    } catch (e: Exception) {
        android.util.Log.e("BookEngine", "Sync error", e)
    }
}
