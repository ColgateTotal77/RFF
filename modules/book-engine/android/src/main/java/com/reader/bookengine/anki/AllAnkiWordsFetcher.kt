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
                val colorCode: Int,
            )

            val count = noteCursor?.count ?: 0
            val parsedNotes = ArrayList<ParsedNote>(count)

            noteCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex("_id")
                val fldsIndex = cursor.getColumnIndex("flds")
                val tagsIndex = cursor.getColumnIndex("tags")

                while (cursor.moveToNext()) {
                    val flds = cursor.getString(fldsIndex)

                    val parsed = AnkiUtils.parseNote(flds, mapping, mirroredMapping) ?: continue

                    val frontLower = parsed.front.lowercase()

                    val noteId = cursor.getLong(idIndex)
                    val tagsStr = cursor.getString(tagsIndex) ?: ""

                    val colorCode = if (tagsStr.contains("Lookups_")) AnkiUtils.parseColorCode(tagsStr) else 0

                    parsedNotes.add(ParsedNote(noteId, frontLower, colorCode))
                }
            }

            val groupedByWord = LinkedHashMap<String, MutableList<ParsedNote>>(parsedNotes.size)
            for (note in parsedNotes) {
                groupedByWord.getOrPut(note.frontLower) { mutableListOf() }.add(note)
            }

            val tempWords = ArrayList<String>(groupedByWord.size)
            val tempNoteIds = ArrayList<LongArray>(groupedByWord.size)
            val tempColorCodes = ArrayList<Int>(groupedByWord.size)

            for ((word, notes) in groupedByWord) {
                val noteIds = notes.map { it.id }.toLongArray()
                val colorCode = notes.map { it.colorCode }.firstOrNull { it != 0 } ?: 0

                tempWords.add(word)
                tempNoteIds.add(noteIds)
                tempColorCodes.add(colorCode)
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
