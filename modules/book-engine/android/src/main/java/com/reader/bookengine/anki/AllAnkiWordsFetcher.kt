package com.reader.bookengine.anki

import android.content.Context
import android.net.Uri
import com.reader.bookengine.AnkiWordsData

class AllAnkiWordsFetcher(private val context: Context) {
    fun getAllAnkiWords(deckIdString: String, mapping: Map<String, Any?>, mirroredMapping: Map<String, Any?>): AnkiWordsData {
        val resolver = context.contentResolver

        val tempWords = mutableListOf<String>()
        val tempNoteIds = mutableListOf<LongArray>()
        val tempColorCodes = mutableListOf<Int>()

        val t1 = System.currentTimeMillis()
        try {
            val notesUri = Uri.parse("content://com.ichi2.anki.flashcards/notes")

            val ankiSearchQuery = "did:$deckIdString"

            val noteCursor = resolver.query(
                notesUri,
                arrayOf("_id", "flds", "tags"),
                ankiSearchQuery,
                null,
                null
            )

            data class ParsedNote(val id: Long, val front: String, val back: String, val colorCode: Int)
            val parsedNotes = mutableListOf<ParsedNote>()
            val frontLookup = mutableMapOf<String, Long>()
            val backLookup = mutableMapOf<String, Long>()

            noteCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex("_id")
                val fldsIndex = cursor.getColumnIndex("flds")
                val tagsIndex = cursor.getColumnIndex("tags")

                val configuredFrontIndex = (mapping["word"] as? Number)?.toInt() ?: 0
                val configuredBackIndex = (mapping["translation"] as? Number)?.toInt() ?: 0
                val fallbackBackIndex = (mirroredMapping["translation"] as? Number)?.toInt() ?: 0

                while (cursor.moveToNext()) {
                    val flds = cursor.getString(fldsIndex)
                    val fieldsArray = flds.split(AnkiUtils.FIELD_SEPARATOR)

                    val maxRequiredIndex = maxOf(configuredFrontIndex, configuredBackIndex, fallbackBackIndex)
                    if (fieldsArray.size <= maxRequiredIndex) continue

                    val front = fieldsArray[configuredFrontIndex].trim()
                    var back = fieldsArray[configuredBackIndex].trim()

                    if (back.isEmpty()) {
                        back = fieldsArray[fallbackBackIndex].trim()
                    }

                    if (front.isEmpty()) continue

                    val noteId = cursor.getLong(idIndex)
                    val tagsStr = cursor.getString(tagsIndex) ?: ""

                    var colorCode = AnkiUtils.parseColorCode(tagsStr)

                    parsedNotes.add(ParsedNote(noteId, front, back, colorCode))

                    frontLookup[front.lowercase()] = noteId
                    backLookup[back.lowercase()] = noteId
                }
            }

            for (note in parsedNotes) {
                var mirroredId = frontLookup[note.back.lowercase()] ?: -1L
                if(mirroredId == -1L) {
                    mirroredId = backLookup[note.front.lowercase()] ?: -1L
                }

                val noteIds = if (mirroredId != -1L) {
                    if (note.id != mirroredId) {
                        longArrayOf(note.id, mirroredId)
                    } else {
                        longArrayOf(note.id)
                    }
                } else {
                    longArrayOf(note.id)
                }

                tempWords.add(note.front.lowercase())
                tempNoteIds.add(noteIds)
                tempColorCodes.add(note.colorCode)
            }
            val t2 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Note cursor processing took: ${t2 - t1} ms")

            return AnkiWordsData(
                tempWords.toTypedArray(),
                tempNoteIds.toTypedArray(),
                tempColorCodes.toIntArray()
            )
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to fetch Anki words", e)
            throw Exception("Failed to fetch Anki words: ${e.message}")
        }
    }
}
