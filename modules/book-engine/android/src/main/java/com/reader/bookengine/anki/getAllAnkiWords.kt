package com.reader.bookengine.anki

import android.content.Context
import android.os.SystemClock
import android.util.Log
import com.reader.bookengine.AnkiWordsData
import androidx.core.net.toUri
import com.ichi2.anki.FlashCardsContract
import kotlin.collections.set

data class WordToNote(
    val word: String,
    val noteIds: MutableSet<Long>,
    var colorCode: Int,
)

fun Context.getAllAnkiWords(
    deckIdString: String,
    mapping: Map<String, Any?>,
    mirroredMapping: Map<String, Any?>,
): AnkiWordsData {
    val resolver = applicationContext.contentResolver
    val mainModelId = (mapping["modalId"] as? String)?.toLong() ?: throw Exception("modalId is missing")
    val mirroredModelId = (mirroredMapping["modalId"] as? String)?.toLong()
    val isModelIdsEquals = mainModelId == mirroredModelId
    val mainWordIndex = (mapping["word"] as? Number)?.toInt() ?: -1
    val mainTranslationIndex = (mapping["translation"] as? Number)?.toInt() ?: -1
    val mirroredWordIndex = (mirroredMapping["word"] as? Number)?.toInt() ?: -1
    val mirroredTranslationIndex = (mirroredMapping["translation"] as? Number)?.toInt() ?: -1
    val sameFieldPair =
        (mainWordIndex == mirroredWordIndex && mainTranslationIndex == mirroredTranslationIndex) ||
            (mainWordIndex == mirroredTranslationIndex && mainTranslationIndex == mirroredWordIndex)
    Log.d("BookEngine", "sameModel=$isModelIdsEquals, sameFields=$sameFieldPair")

    val startedAt = SystemClock.elapsedRealtime()
    try {
        val flagsByNoteId = getFlagsByNoteId(deckIdString)
        val flagsReadAt = SystemClock.elapsedRealtime()

        val notesUri = "content://com.ichi2.anki.flashcards/notes".toUri()
        val ankiSearchQuery = "did:$deckIdString"
        val noteCursor =
            resolver.query(
                notesUri,
                arrayOf("_id", "mid", "flds"),
                ankiSearchQuery,
                null,
                null,
            )
        val queriedAt = SystemClock.elapsedRealtime()


        val count = noteCursor?.count ?: 0
        val capacity = ((count / 0.75F) + 1).toInt()
        val wordToNote = HashMap<String, WordToNote>(capacity)

        noteCursor?.use { cursor ->
            val idIndex = cursor.getColumnIndex("_id")
            val fldsIndex = cursor.getColumnIndex("flds")
            val midIndex =  cursor.getColumnIndex("mid")

            while (cursor.moveToNext()) {
                val flds = cursor.getString(fldsIndex)
                val modelId = cursor.getLong(midIndex)
                if (modelId != mainModelId && modelId != mirroredModelId) continue
                val fieldsArray = flds.split(FIELD_SEPARATOR)

                var pair: Array<String>?
                if (isModelIdsEquals && !sameFieldPair) {
                    val main = parseFields(fieldsArray, mainWordIndex, mainTranslationIndex)
                    val mirrored = parseFields(fieldsArray, mirroredWordIndex, mirroredTranslationIndex)

                    pair = when {
                        main == null -> mirrored ?: continue
                        mirrored == null -> main
                        else -> main + mirrored
                    }
                }
                else if (mainModelId == modelId) pair = parseFields(fieldsArray, mainWordIndex, mainTranslationIndex) ?: continue
                else pair = parseFields(fieldsArray, mirroredWordIndex, mirroredTranslationIndex) ?: continue

                val noteId = cursor.getLong(idIndex)

                val colorCode = flagsByNoteId[noteId] ?: 0
                for (word in pair) {
                    if (word in wordToNote) {
                        val note = wordToNote[word]!!
                        note.noteIds.add(noteId)
                        note.colorCode = maxOf(note.colorCode, colorCode)
                    } else {
                        wordToNote[word] = WordToNote(
                            word = word,
                            noteIds = mutableSetOf(noteId),
                            colorCode = colorCode
                        )
                    }
                }
            }
        }

        val parsedAt = SystemClock.elapsedRealtime()

        val tempWords = ArrayList<String>(wordToNote.size)
        val tempNoteIds = ArrayList<LongArray>(wordToNote.size)
        val tempColorCodes = ArrayList<Int>(wordToNote.size)

        for ((word, noteIds, colorCode) in wordToNote.values) {
                tempWords.add(word)
                tempNoteIds.add(noteIds.toLongArray())
                tempColorCodes.add(colorCode)
        }
        val result = AnkiWordsData(
            tempWords.toTypedArray(),
            tempNoteIds.toTypedArray(),
            tempColorCodes.toIntArray(),
        )
        val finishedAt = SystemClock.elapsedRealtime()
        Log.d(
            "BookEngine",
            "Anki bulk load deck=$deckIdString: notes=$count, parsed=${wordToNote.size}, words=${result.words.size}, " +
                "flags=${flagsReadAt - startedAt}ms, notesQuery=${queriedAt - flagsReadAt}ms, " +
                "readParse=${parsedAt - queriedAt}ms, groupPack=${finishedAt - parsedAt}ms, " +
                "total=${finishedAt - startedAt}ms",
        )
        return result
    } catch (e: Exception) {
        Log.e("BookEngine", "Failed to fetch Anki words", e)
        throw Exception("Failed to fetch Anki words: ${e.message}", e)
    }
}

fun Context.getFlagsByNoteId(deckIdString: String): Map<Long, Int> {
    try {
        val result = mutableMapOf<Long, Int>()
        val resolver = applicationContext.contentResolver
        for (flag in 1..7) {
            val startedAt = SystemClock.elapsedRealtime()
            val matched = resolver.query(
                FlashCardsContract.Note.CONTENT_URI_V2,
                arrayOf(FlashCardsContract.Note._ID),
                "id IN (SELECT nid FROM cards WHERE (did = ? OR odid = ?) AND flags = ?)",
                arrayOf(deckIdString, deckIdString, flag.toString()),
                null,
            )?.use { cursor ->
                val noteIdIndex = cursor.getColumnIndexOrThrow(FlashCardsContract.Note._ID)
                while (cursor.moveToNext()) {
                    result[cursor.getLong(noteIdIndex)] = flag
                }
                cursor.count
            }
            Log.d(
                "BookEngine",
                "Anki flag SQL search deck=$deckIdString flag=$flag: notes=$matched, " +
                    "time=${SystemClock.elapsedRealtime() - startedAt}ms",
            )
        }
        return result
    } catch (e: Exception) {
        Log.e("BookEngine", "Failed to bulk-read flags for deck $deckIdString", e)
        throw e
    }
}

private fun parseFields(
    fieldsArray: List<String>,
    wordIndex: Int,
    translationIndex: Int,
): Array<String>? {
    if (wordIndex < 0 || translationIndex < 0) return null
    if (wordIndex !in fieldsArray.indices || translationIndex !in fieldsArray.indices) return null

    val word = fieldsArray[wordIndex].trim().lowercase()
    val translation = fieldsArray[translationIndex].trim().lowercase()
    if (word.isEmpty() || translation.isEmpty()) return null
    return arrayOf(word, translation)
}
