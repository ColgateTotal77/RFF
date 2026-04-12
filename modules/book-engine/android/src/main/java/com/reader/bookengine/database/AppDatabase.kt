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

@Entity(
    tableName = "blocks",
    indices = [Index("bookBasePath")]
)
data class BlockEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookBasePath: String,
    val blockId: Int,
    val title: String,
    val content: String
)

data class FullBlockMatch(
    val blockId: Int,
    val title: String,
    val content: String
)

@Dao
interface BlockDao {
    @Insert
    suspend fun insertAll(blocks: List<BlockEntity>)

    @Query("""
        SELECT blockId, title, content
        FROM blocks
        WHERE bookBasePath = :bookBasePath AND content LIKE '%' || :query || '%'
    """)
    suspend fun searchAllMatches(query: String, bookBasePath: String): List<FullBlockMatch>

    @Query("""
        DELETE FROM blocks
        WHERE bookBasePath = :bookBasePath
    """)
    suspend fun delete(bookBasePath: String)
}

@Database(
    entities = [WordFreqEntity::class],
    version = 1
)
abstract class FreqDatabase : RoomDatabase() {
    abstract fun wordFreqDao(): WordFreqDao
}

@Database(
    entities = [
        WordFormEntity::class,
        BlockEntity::class,
        WordFreqEntity::class
    ],
    version = 3
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun wordFormDao(): WordFormDao
    abstract fun blockDao(): BlockDao
    abstract fun wordFreqDao(): WordFreqDao
}
