package com.reader.bookengine.anki

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import com.ichi2.anki.FlashCardsContract

class CardSuspender(
    private val context: Context,
) {
    fun suspendCardsOfNotes(noteIds: List<Long>) {
        for (noteId in noteIds) {
            try {
                for (ord in cardOrds(noteId)) suspendCard(noteId, ord)
            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to suspend cards of note $noteId", e)
            }
        }
    }

    private fun cardOrds(noteId: Long): List<Int> {
        val cardsUri =
            Uri
                .withAppendedPath(FlashCardsContract.Note.CONTENT_URI, noteId.toString())
                .buildUpon()
                .appendPath("cards")
                .build()

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

    private fun suspendCard(
        noteId: Long,
        ord: Int,
    ) {
        val values =
            ContentValues().apply {
                put(FlashCardsContract.ReviewInfo.NOTE_ID, noteId)
                put(FlashCardsContract.ReviewInfo.CARD_ORD, ord)
                put(FlashCardsContract.ReviewInfo.SUSPEND, 1)
            }

        context.contentResolver.update(FlashCardsContract.ReviewInfo.CONTENT_URI, values, null, null)
    }
}
