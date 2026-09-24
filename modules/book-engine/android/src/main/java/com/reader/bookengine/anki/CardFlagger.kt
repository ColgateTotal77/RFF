package com.reader.bookengine.anki

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import com.ichi2.anki.FlashCardsContract

private const val COLUMN_FLAGS = "flags"

private val CARDS_URI = Uri.parse("content://com.ichi2.anki.flashcards/cards")

class CardFlagger(
    private val context: Context,
) {
    fun setFlag(
        noteId: Long,
        flag: Int,
    ): Boolean {
        if (flag !in 0..7) return false

        val cardsUri =
            Uri
                .withAppendedPath(FlashCardsContract.Note.CONTENT_URI, noteId.toString())
                .buildUpon()
                .appendPath("cards")
                .build()

        val values =
            ContentValues().apply {
                put(COLUMN_FLAGS, flag)
            }

        return try {
            var updated = 0
            queryCardOrds(cardsUri).forEach { ord ->
                val cardUri =
                    cardsUri
                        .buildUpon()
                        .appendPath(ord.toString())
                        .build()
                updated += context.contentResolver.update(cardUri, values, null, null)
            }
            updated > 0
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to set flag $flag on note $noteId", e)
            false
        }
    }

    fun getFlag(noteId: Long): Int =
        try {
            val cardsUri =
                Uri
                    .withAppendedPath(FlashCardsContract.Note.CONTENT_URI, noteId.toString())
                    .buildUpon()
                    .appendPath("cards")
                    .build()

            var flag = 0
            context.contentResolver
                .query(cardsUri, arrayOf(COLUMN_FLAGS), null, null, null)
                ?.use { cursor ->
                    val flagsIndex = cursor.getColumnIndex(COLUMN_FLAGS)
                    if (flagsIndex != -1 && cursor.moveToFirst()) {
                        flag = cursor.getInt(flagsIndex) and 0b111
                    }
                }
            flag
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to get flag of note $noteId", e)
            0
        }

    fun getFlagsByNoteId(deckIdString: String): Map<Long, Int> =
        try {
            val result = mutableMapOf<Long, Int>()
            context.contentResolver
                .query(
                    CARDS_URI,
                    arrayOf(FlashCardsContract.Card.NOTE_ID, COLUMN_FLAGS),
                    "did:$deckIdString",
                    null,
                    null,
                )?.use { cursor ->
                    val noteIdIndex = cursor.getColumnIndex(FlashCardsContract.Card.NOTE_ID)
                    val flagsIndex = cursor.getColumnIndex(COLUMN_FLAGS)
                    if (noteIdIndex == -1 || flagsIndex == -1) return@use

                    while (cursor.moveToNext()) {
                        result[cursor.getLong(noteIdIndex)] = cursor.getInt(flagsIndex) and 0b111
                    }
                }
            result
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to bulk-read flags for deck $deckIdString", e)
            emptyMap()
        }

    fun updateFlag(
        noteId: Long,
        flag: Int,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): Pair<String, Int> {
        val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
        val cursor = context.contentResolver.query(noteUri, arrayOf("flds"), null, null, null)

        var word = ""
        if (cursor != null) {
            if (cursor.moveToFirst()) {
                word = AnkiUtils.extractWord(cursor.getString(0) ?: "", mapping, mirroredMapping)
            }
            cursor.close()
        }

        setFlag(noteId, flag)

        return Pair(word, flag)
    }

    private fun queryCardOrds(cardsUri: Uri): List<Int> {
        val ords = mutableListOf<Int>()
        context.contentResolver
            .query(cardsUri, arrayOf(FlashCardsContract.Card.CARD_ORD), null, null, null)
            ?.use { cursor ->
                val ordIndex = cursor.getColumnIndex(FlashCardsContract.Card.CARD_ORD)
                if (ordIndex == -1) return emptyList()
                while (cursor.moveToNext()) ords.add(cursor.getInt(ordIndex))
            }
        return ords
    }
}
