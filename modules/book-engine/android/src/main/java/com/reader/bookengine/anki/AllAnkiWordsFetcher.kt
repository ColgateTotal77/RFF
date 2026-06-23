package com.reader.bookengine.anki

import android.content.Context
import android.net.Uri
import com.reader.bookengine.AnkiWordsData

class AllAnkiWordsFetcher(
    private val context: Context,
) {
    fun getAllAnkiWords(
        deckIdString: String,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): AnkiWordsData {
        val resolver = context.contentResolver

        val t1 = System.currentTimeMillis()
        try {
            val notesUri = Uri.parse("content://com.ichi2.anki.flashcards/notes")

            val ankiSearchQuery = "did:$deckIdString"

            val noteCursor =
                resolver.query(
                    notesUri,
                    arrayOf("_id", "flds", "tags"),
                    ankiSearchQuery,
                    null,
                    null,
                )

            data class ParsedNote(
                val id: Long,
                val frontLower: String,
                val backLower: String,
                val colorCode: Int,
            )

            val count = noteCursor?.count ?: 0
            val parsedNotes = ArrayList<ParsedNote>(count)
            val frontLookup = HashMap<String, Long>(count * 2)
            val backLookup = HashMap<String, Long>(count * 2)

            noteCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex("_id")
                val fldsIndex = cursor.getColumnIndex("flds")
                val tagsIndex = cursor.getColumnIndex("tags")

                while (cursor.moveToNext()) {
                    val flds = cursor.getString(fldsIndex)

                    val parsed = AnkiUtils.parseNoteFields(flds, mapping, mapping, mirroredMapping) ?: continue
                    if (parsed.front.isEmpty() || parsed.back.isEmpty()) continue

                    val frontLower = parsed.front.lowercase()
                    val backLower = parsed.back.lowercase()

                    val noteId = cursor.getLong(idIndex)
                    val tagsStr = cursor.getString(tagsIndex) ?: ""

                    val colorCode = if (tagsStr.contains("Lookups_")) AnkiUtils.parseColorCode(tagsStr) else 0

                    parsedNotes.add(ParsedNote(noteId, frontLower, backLower, colorCode))

                    frontLookup[frontLower] = noteId
                    backLookup[backLower] = noteId
                }
            }

            val tempWords = ArrayList<String>(parsedNotes.size)
            val tempNoteIds = ArrayList<LongArray>(parsedNotes.size)
            val tempColorCodes = ArrayList<Int>(parsedNotes.size)

            for (note in parsedNotes) {
                var mirroredId = frontLookup[note.backLower] ?: -1L
                if (mirroredId == -1L) {
                    mirroredId = backLookup[note.frontLower] ?: -1L
                }

                val noteIds =
                    if (mirroredId != -1L && note.id != mirroredId) {
                        longArrayOf(note.id, mirroredId)
                    } else {
                        longArrayOf(note.id)
                    }

                tempWords.add(note.frontLower)
                tempNoteIds.add(noteIds)
                tempColorCodes.add(note.colorCode)
            }
            val t2 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Note cursor processing took: ${t2 - t1} ms")

            return AnkiWordsData(
                tempWords.toTypedArray(),
                tempNoteIds.toTypedArray(),
                tempColorCodes.toIntArray(),
            )
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to fetch Anki words", e)
            throw Exception("Failed to fetch Anki words: ${e.message}")
        }
    }
}
