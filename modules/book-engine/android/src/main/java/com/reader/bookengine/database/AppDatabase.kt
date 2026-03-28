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

@Entity(tableName = "words")
data class WordFreqEntity(
    @PrimaryKey val word: String,
    val freq_count: Int?,
    val zipf: Double?
)

@Dao
interface WordFreqDao {
    @Query("SELECT zipf FROM words WHERE word = :word")
    suspend fun getZipf(word: String): Double?
}

@Database(entities = [WordFreqEntity::class], version = 1)
abstract class FreqDatabase : RoomDatabase() {
    abstract fun wordFreqDao(): WordFreqDao
}
