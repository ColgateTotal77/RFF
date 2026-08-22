package com.reader.bookengine.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase


val MIGRATION_4_5 =
    object : Migration(4, 5) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                "CREATE TABLE IF NOT EXISTS `words_new` " +
                    "(`word` TEXT NOT NULL, `freq_count` INTEGER, `percentile` REAL, " +
                    "PRIMARY KEY(`word`))"
            )
            db.execSQL(
                "INSERT INTO words_new (`word`, `freq_count`, `percentile`) " +
                    "SELECT `word`, `freq_count`, NULL FROM words"
            )
            db.execSQL("DROP TABLE words")
            db.execSQL("ALTER TABLE words_new RENAME TO words")
        }
    }

val MIGRATION_5_6 =
    object : Migration(5, 6) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                "CREATE TABLE IF NOT EXISTS `words_new` (" +
                    "`lemma` TEXT NOT NULL, `forms` TEXT NOT NULL, " +
                    "`freq_count` INTEGER, `percentile` REAL, " +
                    "PRIMARY KEY(`lemma`))"
            )

            val cursor = db.query("SELECT `word`, `freq_count`, `percentile` FROM words")
            val insertSql =
                "INSERT OR IGNORE INTO words_new (`lemma`, `forms`, `freq_count`, `percentile`) " +
                    "VALUES (?, ?, ?, ?)"
            var rows = 0
            try {
                while (cursor.moveToNext()) {
                    val word = cursor.getString(0)
                    val freqCount = cursor.getInt(1)
                    val percentile =
                        if (cursor.isNull(2)) null else cursor.getDouble(2)
                    val jsonWord = word
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                    val formsJson = "[\"$jsonWord\"]"
                    db.execSQL(
                        insertSql,
                        arrayOf(word, formsJson, freqCount, percentile),
                    )
                    rows++
                }
            } finally {
                cursor.close()
            }

            db.execSQL("DROP TABLE words")
            db.execSQL("ALTER TABLE words_new RENAME TO words")
        }
    }

val ALL_APP_MIGRATIONS = arrayOf(
    MIGRATION_4_5,
    MIGRATION_5_6,
)
