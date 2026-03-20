package com.reader.bookengine.database

import androidx.room.*
import androidx.room.OnConflictStrategy

@Entity(tableName = "word_forms", primaryKeys = ["input_word", "word_lang_code"])
data class WordFormEntity(
    @ColumnInfo(name = "input_word") val inputWord: String,
    @ColumnInfo(name = "word_lang_code") val wordLangCode: String,
    @ColumnInfo(name = "lemma") val lemma: String
)

@Dao
interface WordFormDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(wordForms: List<WordFormEntity>)

    @Query("SELECT * FROM word_forms WHERE word_lang_code = :langCode AND lemma IN (:lemmas)")
    suspend fun getFormsForLemmas(langCode: String, lemmas: List<String>): List<WordFormEntity>
}

@Database(entities = [WordFormEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun wordFormDao(): WordFormDao
}
