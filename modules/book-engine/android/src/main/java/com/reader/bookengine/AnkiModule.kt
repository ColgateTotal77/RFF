package com.reader.bookengine

import android.content.ContentValues
import android.net.Uri
import com.ichi2.anki.api.AddContentApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

data class AnkiWordsData(
    val words: Array<String>,
    val noteIds: LongArray,
    val colorCodes: IntArray
)

data class NoteInfo(
    val id: Long,
    val tags: String
)

class AnkiModule : Module() {

    private external fun addWordToAnkiDictionary(word: String, noteId: Long, colorCode: Int)
    private fun getNoteInfoByModelId(modelId: Long, fieldText: String): NoteInfo? {
        val context = appContext.reactContext ?: throw Exception("React context is null")

        try {
            val ankiApi = AddContentApi(context)
            val duplicates = ankiApi.findDuplicateNotes(modelId, fieldText)

            if (duplicates == null || duplicates.isEmpty()) {
                return null
            }

            val noteId = duplicates.first().id

            val resolver = context.contentResolver
            val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
            val cursor = resolver.query(
                noteUri,
                arrayOf("tags"),
                null,
                null,
                null
            )

            var tags = ""
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    tags = cursor.getString(0) ?: ""
                }
                cursor.close()
            }

            return NoteInfo(noteId, tags)
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to get duplicate note info", e)
            throw Exception("Failed to get duplicate note info for \"${fieldText}\": ${e.message}")
        }
    }
    private fun getNoteInfoByNoteId(noteId: Long): NoteInfo? {
        val context = appContext.reactContext ?: throw Exception("React context is null")

        try {
            val resolver = context.contentResolver
            val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
            val cursor = resolver.query(
                noteUri,
                arrayOf("tags"),
                null,
                null,
                null
            )

            var tags = ""
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    tags = cursor.getString(0) ?: ""
                }
                cursor.close()
            }

            return NoteInfo(noteId, tags)
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to get duplicate note info", e)
            throw Exception("Failed to get note info for note ID $noteId: ${e.message}")
        }
    }

    private fun updateNoteTags(noteId: Long, newTags: Array<String>) {
        val context = appContext.reactContext ?: throw Exception("React context is null")
        val resolver = context.contentResolver

        val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
        val cursor = resolver.query(noteUri, arrayOf("tags"), null, null, null)

        var currentTagsStr = ""
        if (cursor != null) {
            if (cursor.moveToFirst()) {
                currentTagsStr = cursor.getString(0) ?: ""
            }
            cursor.close()
        }

        val existingTags = currentTagsStr.trim()
            .split("\\s+".toRegex())
            .filter { it.isNotEmpty() }
            .toMutableSet()

        for (newTag in newTags) {
            if (newTag.startsWith("Lookups_")) {
                existingTags.removeAll { it.startsWith("Lookups_") }
                existingTags.add(newTag)
            } else if (newTag.startsWith("Top_")) {
                existingTags.removeAll { it.startsWith("Top_") }
                existingTags.add(newTag)
            } else {
                existingTags.add(newTag)
            }
        }

        val updatedTagsStr = if (existingTags.isEmpty()) ""
        else " ${existingTags.joinToString(" ")} "

        val values = ContentValues()
        values.put("tags", updatedTagsStr)

        val rowsUpdated = resolver.update(noteUri, values, null, null)

        if (rowsUpdated == 0) {
            throw Exception("Failed to update tags for Note ID $noteId in database.")
        }
    }

    fun getAllAnkiWords(context: android.content.Context): AnkiWordsData {
        val resolver = context.contentResolver

        val tempWords = mutableListOf<String>()
        val tempNoteIds = mutableListOf<Long>()
        val tempColorCodes = mutableListOf<Int>()

        try {
            val notesUri = Uri.parse("content://com.ichi2.anki.flashcards/notes")
            val noteCursor = resolver.query(
                notesUri,
                arrayOf("_id", "flds", "tags"),
                null,
                null,
                null
            )

            val t1 = System.currentTimeMillis()

            if (noteCursor != null) {
                val idIndex = noteCursor.getColumnIndex("_id")
                val fldsIndex = noteCursor.getColumnIndex("flds")
                val tagsIndex = noteCursor.getColumnIndex("tags")

                while (noteCursor.moveToNext()) {
                    val flds = noteCursor.getString(fldsIndex)
                    val fieldsArray = flds.split("\u001F")
                    if (fieldsArray.isEmpty()) continue;

                    val word = fieldsArray[1].trim()
                    if (word.isEmpty()) continue;

                    val noteId = noteCursor.getLong(idIndex)
                    val tagsStr = noteCursor.getString(tagsIndex) ?: ""
                    var colorCode = 0
                    val lookupIdx = tagsStr.indexOf("Lookups_")

                    if (lookupIdx != -1 && lookupIdx + 8 < tagsStr.length) {
                        val numChar = tagsStr[lookupIdx + 8]
                        if (numChar in '1'..'8') {
                            colorCode = numChar - '0'
                        }
                    }

                    tempWords.add(word.replaceFirstChar { char -> char.lowercaseChar() })
                    tempNoteIds.add(noteId)
                    tempColorCodes.add(colorCode)
                    tempWords.add(word.replaceFirstChar { char -> char.uppercaseChar() })
                    tempNoteIds.add(noteId)
                    tempColorCodes.add(colorCode)
                }
                noteCursor.close()
            }
            val t2 = System.currentTimeMillis()
            android.util.Log.d("BookEngine", "Note cursor processing took: ${t2 - t1} ms")
            return AnkiWordsData(
                tempWords.toTypedArray(),
                tempNoteIds.toLongArray(),
                tempColorCodes.toIntArray()
            )
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to fetch Anki words", e)
            throw Exception("Failed to fetch Anki words: ${e.message}")
        }
    }

    override fun definition() = ModuleDefinition {
        Name("Anki")

        AsyncFunction("getDecks") { ->
            val context = appContext.reactContext ?: throw Exception("React context is null")

            try {
                val ankiApi = AddContentApi(context)
                val deckList = ankiApi.deckList ?: return@AsyncFunction emptyList<Map<String, String>>()

                val formattedDecks = deckList.map {
                    mapOf("id" to it.key.toString(), "name" to it.value)
                }

                return@AsyncFunction formattedDecks
            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to get Anki Decks", e)
                throw Exception("Failed to get Anki Decks: ${e.message}")
            }
        }

        AsyncFunction("getModels") { ->
            val context = appContext.reactContext ?: throw Exception("React context is null")

            try {
                val ankiApi = AddContentApi(context)
                val modelList = ankiApi.modelList ?: return@AsyncFunction emptyList<Map<String, String>>()

                val formattedModels = modelList.map {
                    mapOf("id" to it.key.toString(), "name" to it.value)
                }

                return@AsyncFunction formattedModels
            } catch (e: Exception) {
                android.util.Log.e("BookEngine", "Failed to get Anki Models", e)
                throw Exception("Failed to get Anki Models: ${e.message}")
            }
        }

        AsyncFunction("getFields") { modelIdString: String ->
            val context = appContext.reactContext ?: throw Exception("React context is null")
            val modelId = modelIdString.toLong()

            try {
                val ankiApi = AddContentApi(context)
                val fields = ankiApi.getFieldList(modelId) ?: emptyArray<String>()

                return@AsyncFunction fields
            } catch (e: Exception) {
                android.util.Log.e(
                    "BookEngine",
                    "Failed to get fields for model with id: $modelId",
                    e
                )
                throw Exception("Failed to get fields for model with id: $modelId: ${e.message}")
            }
        }

        AsyncFunction("addNote") { modelIdString: String, deckIdString: String, fields: Array<String>, tags: Set<String> ->
            val context = appContext.reactContext ?: throw Exception("React context is null")
            val modelId = modelIdString.toLong()
            val deckId = deckIdString.toLong()

            try {
                val note = getNoteInfoByModelId(modelId, fields[1])
                if (note != null) {
                    val currentTags = note.tags.split(" ").filter { it.isNotEmpty() }
                    val currentLookupTag = currentTags.find { it.startsWith("Lookups_") }
                    val newLookupNumber = if (currentLookupTag != null) {
                        val currentNumber = currentLookupTag.substring(8).toIntOrNull() ?: 0
                        currentNumber + 1
                    } else 1

                    val newTags = currentTags.filter { !it.startsWith("Lookups_") } + "Lookups_$newLookupNumber"
                    updateNoteTags(note.id, newTags.toTypedArray())
                    return@AsyncFunction note.id
                }

                val ankiApi = AddContentApi(context)
                val noteId = ankiApi.addNote(modelId, deckId, fields, tags)

                val isSuccessCreating = noteId != null
                if (isSuccessCreating) addWordToAnkiDictionary(fields[1], noteId, 1)

                return@AsyncFunction noteId
            } catch (e: Exception) {
                val fieldsString = fields.joinToString(prefix = "[", postfix = "]")
                val tagsString = tags?.joinToString(prefix = "[", postfix = "]") ?: "none"
                val errorDetails = "Model: $modelId, Deck: $deckId, Fields: $fieldsString, Tags: $tagsString"

                android.util.Log.e("BookEngine", "Failed to add note. $errorDetails", e)
                throw Exception("Failed to add Anki note. $errorDetails. Error: ${e.message}")
            }
        }

        AsyncFunction("updateNoteTags") { noteIdString: String, newTags: Array<String> ->
            val noteId = noteIdString.toLong()
            updateNoteTags(noteId, newTags);
        }
    }
}
