package com.reader.bookengine

import android.content.ContentValues
import android.net.Uri
import com.ichi2.anki.api.AddContentApi
import com.reader.bookengine.database.FrequencyDatabase
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import com.reader.bookengine.anki.AnkiAudioHelper
import com.reader.bookengine.anki.AnkiUtils
import com.reader.bookengine.anki.FieldArrayMapper
import com.reader.bookengine.anki.NoteFinder
import com.reader.bookengine.anki.NoteTagger

data class AnkiWordsData(
    val words: Array<String>,
    val noteIds: Array<LongArray>,
    val colorCodes: IntArray
)

class AnkiModule : Module() {

    companion object {
        private var freqDatabase: FrequencyDatabase? = null
    }

    fun setFrequencyDatabase(database: FrequencyDatabase?) {
        freqDatabase = database
    }

    private val moduleContext get() = appContext.reactContext ?: throw Exception("React context is null")

    private external fun upsertWordToAnkiDictionary(word: String, noteIds: LongArray, colorCode: Int)

    override fun definition() = ModuleDefinition {
        Name("Anki")

        AsyncFunction("getDecks") { ->
            runBlocking(Dispatchers.IO) {
                try {
                    val ankiApi = AddContentApi(moduleContext)
                    val deckList = ankiApi.deckList ?: return@runBlocking emptyList<Map<String, String>>()

                    val formattedDecks = deckList.map {
                        mapOf("id" to it.key.toString(), "name" to it.value)
                    }

                    formattedDecks
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Failed to get Anki Decks", e)
                    throw Exception("Failed to get Anki Decks: ${e.message}")
                }
            }
        }

        AsyncFunction("createDeck") { deckName: String ->
            runBlocking(Dispatchers.IO) {
                try {
                    val ankiApi = AddContentApi(moduleContext)
                    val deckId = ankiApi.addNewDeck(deckName)
                        ?: throw Exception("Failed to create deck: $deckName")

                    deckId
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Failed to create Anki deck", e)
                    throw Exception("Failed to create Anki deck: ${e.message}")
                }
            }
        }

        AsyncFunction("getModels") { ->
            runBlocking(Dispatchers.IO) {
                try {
                    val ankiApi = AddContentApi(moduleContext)
                    val modelList = ankiApi.modelList ?: return@runBlocking emptyList<Map<String, String>>()

                    val formattedModels = modelList.map {
                        mapOf("id" to it.key.toString(), "name" to it.value)
                    }

                    formattedModels
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Failed to get Anki Models", e)
                    throw Exception("Failed to get Anki Models: ${e.message}")
                }
            }
        }

        AsyncFunction("getFields") { modelIdString: String ->
            runBlocking(Dispatchers.IO) {
                val modelId = modelIdString.toLong()

                try {
                    val ankiApi = AddContentApi(moduleContext)
                    ankiApi.getFieldList(modelId) ?: emptyArray<String>()
                } catch (e: Exception) {
                    android.util.Log.e(
                        "BookEngine",
                        "Failed to get fields for model with id: $modelId",
                        e
                    )
                    throw Exception("Failed to get fields for model with id: $modelId: ${e.message}")
                }
            }
        }

AsyncFunction("addNote") { deckIdString: String, fields: Map<String, String>, mapping: Map<String, Any?>, mirroredMapping: Map<String, Any?>, isTwoSided: Boolean ->
            runBlocking(Dispatchers.IO) {
                val deckId = deckIdString.toLong()

                try {
                    val originalWord = fields["originalWord"] ?: throw Exception("originalWord field is missing")
                    val definition = fields["definition"] ?: ""
                    val baseExamples = fields["examples"] ?: ""
                    val word = fields["word"] ?: throw Exception("Word field is missing")

                    val modelId = mapping["modalId"] as String ?: throw Exception("modalId is missing")
                    val ankiApi = AddContentApi(moduleContext)

                    val (wordTier, wordZipf) = freqDatabase?.getFrequencyTier(word) ?: Pair("Top_20000+", 0.0)

                    val needsDescription = wordZipf < 4.0
                    val finalExamples = if (needsDescription && definition.isNotEmpty()) {
                        "$definition<br><br>$baseExamples"
                    } else {
                        baseExamples
                    }

                    val mutableFields = fields.toMutableMap()
                    mutableFields["examples"] = finalExamples

                    val updatedNoteIds = mutableListOf<Long>()
                    val noteTagger = NoteTagger(moduleContext, freqDatabase)

                    suspend fun updateOrCreateCardPair(targetWord: String, zipf: Double, tier: String) {
                        val noteFinder = NoteFinder(moduleContext)
                        val note = noteFinder.findByModelId(modelId.toLong(), targetWord)

                        if (note != null) {
                            val newTags = arrayOf("Lookups_1", tier)
                            val (updatedWord, colorCode) = noteTagger.updateNoteTags(note.id, newTags, mapping, mirroredMapping, tier)

                            updatedNoteIds.add(note.id)

                            if (updatedWord.isNotEmpty()) {
                                upsertWordToAnkiDictionary(updatedWord, longArrayOf(note.id), colorCode)
                            }

                            if (isTwoSided) {
                                val mirroredNoteId = noteFinder.findMirrored(targetWord, deckId, mapping, mirroredMapping)

                                if (mirroredNoteId != null && mirroredNoteId != note.id) {
                                    val (mirroredWord, mirroredColorCode) = noteTagger.updateNoteTags(mirroredNoteId, newTags, mapping, mirroredMapping, tier)
                                    updatedNoteIds.add(mirroredNoteId)

                                    if (mirroredWord.isNotEmpty()) {
                                        upsertWordToAnkiDictionary(mirroredWord, longArrayOf(mirroredNoteId), mirroredColorCode)
                                    }
                                }
                            }
                        } else {
                            mutableFields["word"] = targetWord
                            mutableFields["zipf"] = zipf.toString()

                            val tags = setOf("Lookups_1", "New", "Generated_(temporary_tag)", tier)
                            val mapper = FieldArrayMapper(moduleContext, AnkiAudioHelper(moduleContext))

                            // ✅ Now perfectly legal because the parent function is marked suspend
                            val mainFieldsArray = mapper.convertFieldsToArray(mutableFields, mapping)
                            val mainNoteId = ankiApi.addNote(modelId.toLong(), deckId, mainFieldsArray, tags)
                                ?: throw Exception("Failed to create main note for $targetWord")

                            val combinedIds = mutableListOf<Long>()
                            combinedIds.add(mainNoteId)
                            updatedNoteIds.add(mainNoteId)

                            if (isTwoSided) {
                                val mirroredModelId = mirroredMapping["modalId"] as String ?: throw Exception("mirrored modalId is missing")
                                val mirroredFieldsArray = mapper.convertFieldsToArray(mutableFields, mirroredMapping)
                                val mirroredNoteId = ankiApi.addNote(mirroredModelId.toLong(), deckId, mirroredFieldsArray, tags)
                                    ?: throw Exception("Failed to create mirrored note for $targetWord")

                                combinedIds.add(mirroredNoteId)
                                updatedNoteIds.add(mirroredNoteId)
                            }

                            upsertWordToAnkiDictionary(targetWord, combinedIds.toLongArray(), 1)
                        }
                    }

                    updateOrCreateCardPair(word, wordZipf, wordTier)

                    updatedNoteIds
                } catch (e: Exception) {
                    throw Exception("Failed to add/update Anki note: ${e.message}")
                }
            }
        }

        AsyncFunction("updateNoteTags") { noteIds: LongArray, newTags: Array<String>, mapping: Map<String, Any?>, mirroredMapping: Map<String, Any?> ->
            runBlocking(Dispatchers.IO) {
                if (noteIds.isEmpty()) return@runBlocking

                val noteTagger = NoteTagger(moduleContext, freqDatabase)
                val bestTier = noteTagger.getBestFrequencyTier(noteIds, mapping, mirroredMapping)

                for (noteId in noteIds) {
                    val (word, colorCode) = noteTagger.updateNoteTags(noteId, newTags, mapping, mirroredMapping, bestTier)

                    if (word.isNotEmpty()) upsertWordToAnkiDictionary(word, noteIds, colorCode)
                }
            }
        }

        AsyncFunction("deleteNote") { noteIds: LongArray ->
            runBlocking(Dispatchers.IO) {
                try {
                    val baseUri = Uri.parse("content://com.ichi2.anki.flashcards/notes")

                    for (noteId in noteIds) {
                        val noteUri = Uri.withAppendedPath(baseUri, noteId.toString())
                        moduleContext.contentResolver.delete(noteUri, null, null)
                    }
                } catch (e: Exception) {
                    android.util.Log.e("BookEngine", "Failed to delete Anki notes", e)
                    throw Exception("Failed to delete Anki notes: ${e.message}")
                }
            }
        }
    }
}
