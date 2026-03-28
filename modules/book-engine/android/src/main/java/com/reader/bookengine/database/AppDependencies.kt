package com.reader.bookengine.database
import com.reader.bookengine.BuildConfig

import android.content.Context
import androidx.room.Room
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

object AppDependencies {
    @Volatile
    private var databaseInstance: AppDatabase? = null

        val supabaseClient by lazy {
            if (BuildConfig.SUPABASE_URL.isBlank()) {
                throw IllegalStateException("Supabase URL is missing! Check your environment variables.")
            }

            createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Postgrest)
            install(Storage)
        }
    }

    fun getDatabase(context: Context): AppDatabase {
        return databaseInstance ?: synchronized(this) {
            val instance = Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "book_engine_database"
            )
            .build()

            databaseInstance = instance
            instance
        }
    }

    fun getFrequencyDatabase(context: Context): FrequencyDatabase {
        return FrequencyDatabase(context, supabaseClient)
    }
}
