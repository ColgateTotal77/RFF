package com.reader.bookengine

import android.content.ContentValues
import android.net.Uri
import com.ichi2.anki.api.AddContentApi
import com.reader.bookengine.database.AppDependencies
import com.reader.bookengine.database.FrequencyDatabase
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.runBlocking

data class AnkiWordsData(
    val words: Array<String>,
    val noteIds: Array<LongArray>,
    val colorCodes: IntArray
)

data class NoteInfo(
    val id: Long,
    val tags: String
)

class AnkiModule : Module() {

    companion object {
        private var freqDatabase: FrequencyDatabase? = null
    }

    fun setFrequencyDatabase(database: FrequencyDatabase?) {
        freqDatabase = database
    }

    private external fun upsertWordToAnkiDictionary(word: String, noteIds: LongArray, colorCode: Int)

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

    private fun updateNoteTags(noteId: Long, newTags: Array<String>): Pair<String, Int> {
        val context = appContext.reactContext ?: throw Exception("React context is null")
        val resolver = context.contentResolver

        val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
        val cursor = resolver.query(noteUri, arrayOf("tags", "flds"), null, null, null)

        var currentTagsStr = ""
        var word = ""
        var colorCode = 0
        if (cursor != null) {
            if (cursor.moveToFirst()) {
                currentTagsStr = cursor.getString(0) ?: ""
                val flds = cursor.getString(1) ?: ""
                val fieldsArray = flds.split("\u001F")
                if (fieldsArray.size > 1) {
                    word = fieldsArray[1].trim()
                }
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
            } else {
                existingTags.add(newTag)
            }
        }

        if (!existingTags.any { it.startsWith("Top_") }) {
            val wordTier = runBlocking {
                freqDatabase?.getFrequencyTier(word) ?: "Top_20000+"
            }
            existingTags.add(wordTier)
        }

        val tagsWithTierStr = if (existingTags.isEmpty()) ""
        else " ${existingTags.joinToString(" ")} "

        val values = ContentValues()
        values.put("tags", tagsWithTierStr)

        val rowsUpdated = resolver.update(noteUri, values, null, null)

        if (rowsUpdated == 0) {
            throw Exception("Failed to update tags for Note ID $noteId in database.")
        }

        val match = Regex("Lookups_([1-8])").find(tagsWithTierStr)
        colorCode = match?.groupValues?.get(1)?.toInt() ?: 0

        return Pair(word, colorCode)
    }

    fun getAllAnkiWords(deckIdString: String, context: android.content.Context): AnkiWordsData {
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

            val lookupsRegex = Regex("Lookups_([1-8])")
            val fieldSeparator = "\u001F"

            noteCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex("_id")
                val fldsIndex = cursor.getColumnIndex("flds")
                val tagsIndex = cursor.getColumnIndex("tags")

                val configuredFrontIndex = 1
                val configuredBackIndex = 4
                val fallbackBackIndex = 3

                while (cursor.moveToNext()) {
                    val flds = cursor.getString(fldsIndex)
                    val fieldsArray = flds.split(fieldSeparator)

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

                    val match = lookupsRegex.find(tagsStr)
                    var colorCode = match?.groupValues?.get(1)?.toInt() ?: 0

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
                val word = fields[1]

                val note = getNoteInfoByModelId(modelId, word)
                if (note != null) throw Exception("Card already exists!")

                val ankiApi = AddContentApi(context)

                val tier = runBlocking {
                    freqDatabase?.getFrequencyTier(word) ?: "Top_20000+"
                }
                val tagsWithTier = tags + tier

                val mainNoteId = ankiApi.addNote(modelId, deckId, fields, tagsWithTier)
                    ?: throw Exception("Failed to create main note")

                val mirroredFields = fields.clone()
                val temp = mirroredFields[1]
                mirroredFields[1] = mirroredFields[4]
                mirroredFields[3] = temp
                mirroredFields[4] = ""

                val mirroredNoteId = ankiApi.addNote(modelId, deckId, mirroredFields, tagsWithTier)
                    ?: throw Exception("Failed to create mirrored note")

                val combinedIds = longArrayOf(mainNoteId, mirroredNoteId)
                upsertWordToAnkiDictionary(fields[1], combinedIds, 1)

                return@AsyncFunction combinedIds
            } catch (e: Exception) {
                throw Exception("Failed to add Anki note: ${e.message}")
            }
        }

        AsyncFunction("updateNoteTags") { noteIds: LongArray, newTags: Array<String> ->
            for (noteId in noteIds) {
                val (word, colorCode) = updateNoteTags(noteId, newTags)
                upsertWordToAnkiDictionary(word, noteIds, colorCode)
            }
        }
    }
}
