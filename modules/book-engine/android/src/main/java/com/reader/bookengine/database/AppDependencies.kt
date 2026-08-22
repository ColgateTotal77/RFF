package com.reader.bookengine.database
import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.reader.bookengine.BuildConfig
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
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
        ) {
            install(Postgrest)
            install(Storage)
        }
    }

    fun getDatabase(context: Context): AppDatabase =
        databaseInstance ?: synchronized(this) {
            val instance =
                Room
                    .databaseBuilder(
                        context.applicationContext,
                        AppDatabase::class.java,
                        "book_engine_database",
                    )
                    .addMigrations(*ALL_APP_MIGRATIONS)
                    .addCallback(
                        object : RoomDatabase.Callback() {
                            override fun onDestructiveMigration(db: SupportSQLiteDatabase) {
                                context
                                    .getSharedPreferences("DictionaryPrefs", Context.MODE_PRIVATE)
                                    .edit()
                                    .clear()
                                    .apply()
                            }
                        },
                    ).build()

            databaseInstance = instance
            instance
        }

    fun getFrequencyDatabase(context: Context): FrequencyDatabase = FrequencyDatabase(context, supabaseClient)
}
