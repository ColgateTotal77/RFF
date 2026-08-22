package com.reader.bookengine.database

import androidx.room.*
import androidx.room.OnConflictStrategy

@Entity(tableName = "word_forms", primaryKeys = ["lemma", "word_lang_code", "input_word"])
data class WordFormEntity(
    @ColumnInfo(name = "input_word") val inputWord: String,
    @ColumnInfo(name = "word_lang_code") val wordLangCode: String,
    @ColumnInfo(name = "lemma") val lemma: String,
)

@Dao
interface WordFormDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(wordForms: List<WordFormEntity>)

    @Query("SELECT * FROM word_forms WHERE word_lang_code = :langCode AND lemma IN (:lemmas)")
    suspend fun getFormsForLemmas(
        langCode: String,
        lemmas: List<String>,
    ): List<WordFormEntity>
}

@Entity(tableName = "words")
data class WordFreqEntity(
    @PrimaryKey val lemma: String,
    val forms: List<String>,
    val freq_count: Int?,
    val percentile: Double?,
)

object WordsConverters {
    @androidx.room.TypeConverter
    fun fromList(list: List<String>): String =
        org.json.JSONArray(list).toString()

    @androidx.room.TypeConverter
    fun toList(value: String): List<String> {
        if (value.isBlank()) return emptyList()
        val arr = org.json.JSONArray(value)
        return buildList { for (i in 0 until arr.length()) add(arr.getString(i)) }
    }
}

@Dao
interface WordFreqDao {
    @Query(
        "SELECT percentile FROM words " +
            "WHERE instr(forms, '\"' || :surfaceForm || '\"') > 0 LIMIT 1"
    )
    suspend fun getPercentile(surfaceForm: String): Double?
}

@Entity(
    tableName = "blocks",
    indices = [Index("bookBasePath")],
)
data class BlockEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val bookBasePath: String,
    val blockId: Int,
    val title: String,
    val content: String,
)

data class FullBlockMatch(
    val blockId: Int,
    val title: String,
    val content: String,
)

@Dao
interface BlockDao {
    @Insert
    suspend fun insertAll(blocks: List<BlockEntity>)

    @Query(
        """
        SELECT blockId, title, content
        FROM blocks
        -- TODO(26): LIKE full scan is slow — use FTS5 or async search off main thread
        WHERE bookBasePath = :bookBasePath AND content LIKE '%' || :query || '%'
    """,
    )
    suspend fun searchAllMatches(
        query: String,
        bookBasePath: String,
    ): List<FullBlockMatch>

    @Query(
        """
        DELETE FROM blocks
        WHERE bookBasePath = :bookBasePath
    """,
    )
    suspend fun delete(bookBasePath: String)
}

@TypeConverters(WordsConverters::class)
@Database(
    entities = [WordFreqEntity::class],
    version = 3,
)
abstract class FreqDatabase : RoomDatabase() {
    abstract fun wordFreqDao(): WordFreqDao
}

@TypeConverters(WordsConverters::class)
@Database(
    entities = [
        WordFormEntity::class,
        BlockEntity::class,
        WordFreqEntity::class,
    ],
    version = 6,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun wordFormDao(): WordFormDao

    abstract fun blockDao(): BlockDao

    abstract fun wordFreqDao(): WordFreqDao
}
