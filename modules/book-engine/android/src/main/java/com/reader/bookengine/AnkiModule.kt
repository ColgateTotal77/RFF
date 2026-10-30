package com.reader.bookengine

import android.net.Uri
import com.ichi2.anki.api.AddContentApi
import com.reader.bookengine.anki.addOrUpdate
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.core.net.toUri

data class AnkiWordsData(
    val words: Array<String>,
    val noteIds: Array<LongArray>,
    val colorCodes: IntArray,
)

class AnkiModule : Module() {
    private val moduleContext get() = appContext.reactContext ?: throw Exception("React context is null")

    external fun upsertWordsToAnkiDictionary(
        words: Array<String>,
        noteIds: LongArray,
        colorCode: Int,
    )

    external fun updateDictionaryFlags(
        noteIds: LongArray,
        colorCode: Int,
    )

    private external fun removeNotesFromAnkiDictionary(noteIds: LongArray)

    override fun definition() =
        ModuleDefinition {
            Name("Anki")

            AsyncFunction("isInstalled") { ->
                try {
                    moduleContext.packageManager?.getPackageInfo("com.ichi2.anki", 0) != null
                } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
                    false
                }
            }

            AsyncFunction("getDecks") Coroutine { ->
                withContext(Dispatchers.IO) {
                    try {
                        val ankiApi = AddContentApi(moduleContext)
                        val deckList = ankiApi.deckList ?: return@withContext emptyList()

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
                        val modelList = ankiApi.modelList ?: return@withContext emptyList()

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
                    language: Map<String, String>,
                    autoSuspend: Boolean,
                    wordForms: List<String>
                    ->
                    withContext(Dispatchers.IO) {
                        try {
                            moduleContext.addOrUpdate(
                                upsertWordsToAnkiDictionary = ::upsertWordsToAnkiDictionary,
                                deckId = deckIdString.toLong(),
                                fields = fields,
                                mapping = mapping,
                                mirroredMapping = mirroredMapping,
                                isTwoSided = isTwoSided,
                                language = language,
                                autoSuspend = autoSuspend,
                                wordForms = wordForms,
                            )
                        } catch (e: Exception) {
                            throw Exception("Failed to add/update Anki note: ${e.message}", e)
                        }
                    }
                }

            AsyncFunction("updateFlag") Coroutine
                { noteIds: LongArray, flag: Int ->
                    withContext(Dispatchers.IO) {
                        val ankiApi = AddContentApi(moduleContext.applicationContext)
                        val colorCode = flag.coerceIn(0, 7)

                        for (noteId in noteIds) {
                            ankiApi.setFlagRaw(noteId, colorCode)
                        }

                        updateDictionaryFlags(noteIds, colorCode)
                    }
                }

            AsyncFunction("deleteNote") Coroutine { noteIds: LongArray ->
                withContext(Dispatchers.IO) {
                    try {
                        val baseUri = "content://com.ichi2.anki.flashcards/notes".toUri()

                        for (noteId in noteIds) {
                            val noteUri = Uri.withAppendedPath(baseUri, noteId.toString())
                            moduleContext.contentResolver.delete(noteUri, null, null)
                        }

                        removeNotesFromAnkiDictionary(noteIds)
                    } catch (e: Exception) {
                        android.util.Log.e("BookEngine", "Failed to delete Anki notes", e)
                        throw Exception("Failed to delete Anki notes: ${e.message}")
                    }
                }
            }
        }
}
