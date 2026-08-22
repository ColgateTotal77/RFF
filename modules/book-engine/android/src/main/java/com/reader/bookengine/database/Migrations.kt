package com.reader.bookengine.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

val MIGRATION_4_5 = object : Migration(4, 5) {
    override fun migrate(db: SupportSQLiteDatabase) {}
}

val ALL_APP_MIGRATIONS = arrayOf(
    MIGRATION_4_5,
)
