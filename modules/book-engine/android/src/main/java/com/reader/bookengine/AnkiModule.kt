package com.reader.bookengine

import android.net.Uri
import com.ichi2.anki.api.AddContentApi
import com.reader.bookengine.anki.NoteTagger
import com.reader.bookengine.anki.NoteUpserter
import com.reader.bookengine.database.FrequencyDatabase
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class AnkiWordsData(
    val words: Array<String>,
    val noteIds: Array<LongArray>,
    val colorCodes: IntArray,
)

class AnkiModule : Module() {
    companion object {
        private var freqDatabase: FrequencyDatabase? = null
    }

    fun setFrequencyDatabase(database: FrequencyDatabase?) {
        freqDatabase = database
    }

    private val moduleContext get() = appContext.reactContext ?: throw Exception("React context is null")

    private external fun upsertWordToAnkiDictionary(
        word: String,
        noteIds: LongArray,
        colorCode: Int,
    )

    override fun definition() =
        ModuleDefinition {
            Name("Anki")

            AsyncFunction("getDecks") Coroutine { ->
                withContext(Dispatchers.IO) {
                    try {
                        val ankiApi = AddContentApi(moduleContext)
                        val deckList = ankiApi.deckList ?: return@withContext emptyList<Map<String, String>>()

                        deckList.map { mapOf("id" to it.key.toString(), "name" to it.value) }
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to get Anki Decks", e)
                        throw Exception("Failed to get Anki Decks: ${e.message}")
                    }
                }
            }

            AsyncFunction("createDeck") Coroutine { deckName: String ->
                withContext(Dispatchers.IO) {
                    try {
                        val ankiApi = AddContentApi(moduleContext)
                        ankiApi.addNewDeck(deckName) ?: throw Exception("Failed to create deck: $deckName")
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to create Anki deck", e)
                        throw Exception("Failed to create Anki deck: ${e.message}")
                    }
                }
            }

            AsyncFunction("getModels") Coroutine { ->
                withContext(Dispatchers.IO) {
                    try {
                        val ankiApi = AddContentApi(moduleContext)
                        val modelList = ankiApi.modelList ?: return@withContext emptyList<Map<String, String>>()

                        modelList.map { mapOf("id" to it.key.toString(), "name" to it.value) }
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to get Anki Models", e)
                        throw Exception("Failed to get Anki Models: ${e.message}")
                    }
                }
            }

            AsyncFunction("getFields") Coroutine { modelIdString: String ->
                withContext(Dispatchers.IO) {
                    val modelId = modelIdString.toLong()
                    try {
                        val ankiApi = AddContentApi(moduleContext)
                        ankiApi.getFieldList(modelId) ?: emptyArray<String>()
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to get fields for model with id: $modelId", e)
                        throw Exception("Failed to get fields for model with id: $modelId: ${e.message}")
                    }
                }
            }

            AsyncFunction("addNote") Coroutine
                {
                    deckIdString: String,
                    fields: Map<String, String>,
                    mapping: Map<String, Any?>,
                    mirroredMapping: Map<String, Any?>,
                    isTwoSided: Boolean,
                    ->
                    withContext(Dispatchers.IO) {
                        try {
                            NoteUpserter(moduleContext, freqDatabase, ::upsertWordToAnkiDictionary)
                                .addOrUpdate(deckIdString.toLong(), fields, mapping, mirroredMapping, isTwoSided)
                        } catch (e: Exception) {
                            throw Exception("Failed to add/update Anki note: ${e.message}", e)
                        }
                    }
                }

            AsyncFunction("updateNoteTags") Coroutine
                { noteIds: LongArray, newTags: Array<String>, mapping: Map<String, Any?>, mirroredMapping: Map<String, Any?> ->
                    withContext(Dispatchers.IO) {
                        if (noteIds.isEmpty()) return@withContext

                        val noteTagger = NoteTagger(moduleContext, freqDatabase)
                        val bestTier = noteTagger.getBestFrequencyTier(noteIds, mapping, mirroredMapping)

                        for (noteId in noteIds) {
                            val (word, colorCode) = noteTagger.updateNoteTags(noteId, newTags, mapping, mirroredMapping, bestTier)

                            if (word.isNotEmpty()) upsertWordToAnkiDictionary(word, noteIds, colorCode)
                        }
                    }
                }

            AsyncFunction("deleteNote") Coroutine { noteIds: LongArray ->
                withContext(Dispatchers.IO) {
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
