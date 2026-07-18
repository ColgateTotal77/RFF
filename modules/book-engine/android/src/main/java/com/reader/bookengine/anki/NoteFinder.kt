package com.reader.bookengine.anki

import android.content.Context
import android.net.Uri
import com.ichi2.anki.api.AddContentApi

data class NoteInfo(
    val id: Long,
    val tags: String,
)

class NoteFinder(
    private val context: Context,
) {
    fun findByModelId(
        modelId: Long,
        fieldText: String,
    ): NoteInfo? {
        try {
            val ankiApi = AddContentApi(context)
            val duplicates = ankiApi.findDuplicateNotes(modelId, fieldText)

            if (duplicates == null || duplicates.isEmpty()) {
                return null
            }

            val noteId = duplicates.first().id

            val resolver = context.contentResolver
            val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
            val cursor =
                resolver.query(
                    noteUri,
                    arrayOf("tags"),
                    null,
                    null,
                    null,
                )

            var tags = ""
            if (cursor != null) {
                if (cursor.moveToFirst()) tags = cursor.getString(0) ?: ""
                cursor.close()
            }

            return NoteInfo(noteId, tags)
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to get duplicate note info", e)
            throw Exception("Failed to get duplicate note info for \"${fieldText}\": ${e.message}")
        }
    }

    fun findMirrored(
        targetWord: String,
        deckId: Long,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): Long? {
        val resolver = context.contentResolver

        try {
            val notesUri = Uri.parse("content://com.ichi2.anki.flashcards/notes")
            val ankiSearchQuery = "did:$deckId \"${AnkiUtils.escapeAnkiSearchTerm(targetWord)}\""

            val noteCursor =
                resolver.query(
                    notesUri,
                    arrayOf("_id", "flds"),
                    ankiSearchQuery,
                    null,
                    null,
                )

            noteCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex("_id")
                val fldsIndex = cursor.getColumnIndex("flds")

                while (cursor.moveToNext()) {
                    val flds = cursor.getString(fldsIndex)

                    val parsed = AnkiUtils.parseNote(flds, mapping, mirroredMapping) ?: continue
                    val front = parsed.front
                    val back = parsed.back

                    if (front.equals(targetWord, ignoreCase = true) || back.equals(targetWord, ignoreCase = true)) {
                        return cursor.getLong(idIndex)
                    }
                }
            }
            return null
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to find mirrored note", e)
            return null
        }
    }
}
