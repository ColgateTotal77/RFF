package com.reader.bookengine.database

import android.content.Context
import androidx.room.Room
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class FrequencyDatabase(private val context: Context, private val supabase: SupabaseClient) {

    private var database: FreqDatabase? = null

    private fun getDbFile(langCode: String): File {
        return File(context.filesDir, "freq_$langCode.db")
    }

    suspend fun ensureDownloaded(langCode: String): Boolean {
        val dbFile = getDbFile(langCode)
        if (dbFile.exists()) return true

        return withContext(Dispatchers.IO) {
            try {
                val bucket = supabase.storage.from("word_frequency_packs")

                val url = bucket.publicUrl("freq_$langCode.db")
                val bytes = java.net.URL(url).readBytes()

                dbFile.writeBytes(bytes)
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
        database = Room.databaseBuilder(context, FreqDatabase::class.java, "freq_$langCode")
            .createFromFile(dbFile)
            .fallbackToDestructiveMigration()
            .build()

        return true
    }

    fun close() {
        database?.close()
        database = null
    }

    suspend fun getFrequencyTier(word: String): Pair<String, Double> {
        android.util.Log.d("BookEngine", "DB is null: ${database == null}, word: $word")
        val zipf = database?.wordFreqDao()?.getZipf(word.lowercase()) ?: return Pair("Top_20000+", 0.0)

        val tier = when {
            zipf >= 4.5 -> "Top_1000"
            zipf >= 3.5 -> "Top_5000"
            zipf >= 3.0 -> "Top_10000"
            zipf >= 2.5 -> "Top_15000"
            else -> "Top_20000+"
        }

        return Pair(tier, zipf)
    }
}
