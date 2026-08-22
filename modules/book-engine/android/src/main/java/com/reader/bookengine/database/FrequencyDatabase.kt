package com.reader.bookengine.database

import android.content.Context
import androidx.room.Room
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class FrequencyDatabase(
    private val context: Context,
    private val supabase: SupabaseClient,
) {
    private var database: FreqDatabase? = null

    private fun getDbFile(langCode: String): File = File(context.filesDir, "freq_$langCode.db")

    suspend fun ensureDownloaded(langCode: String): Boolean {
        val dbFile = getDbFile(langCode)
        if (dbFile.exists()) return true

        return withContext(Dispatchers.IO) {
            try {
                val bucket = supabase.storage.from("word_frequency_packs")

                val url = bucket.publicUrl("freq_$langCode.db")
                java.net.URL(url).openStream().use { input ->
                    dbFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                true
            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to download freq_$langCode.db", e)
                false
            }
        }
    }

    fun open(langCode: String): Boolean {
        val dbFile = getDbFile(langCode)
        if (!dbFile.exists()) return false

        database?.close()
        database =
            Room
                .databaseBuilder(context, FreqDatabase::class.java, "freq_$langCode")
                .createFromFile(dbFile)
                .fallbackToDestructiveMigration(dropAllTables = true)
                .build()

        return true
    }

    fun close() {
        database?.close()
        database = null
    }

    suspend fun getFrequencyTier(word: String): String {
        val percentile =
            database?.wordFreqDao()?.getPercentile(word.lowercase()) ?: return "Unknown"

        return when {
            percentile >= 0.75 -> "VeryCommon"
            percentile >= 0.50 -> "Common"
            percentile >= 0.25 -> "Uncommon"
            percentile >= 0.10 -> "Rare"
            else -> "VeryRare"
        }
    }
}
