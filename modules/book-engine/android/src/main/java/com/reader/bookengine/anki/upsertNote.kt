package com.reader.bookengine.anki

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.core.content.FileProvider
import com.ichi2.anki.FlashCardsContract
import com.ichi2.anki.api.AddContentApi
import com.ichi2.anki.api.NoteInfo
import com.reader.bookengine.database.AppDependencies
import com.reader.bookengine.tts.TtsVoiceHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.collections.first
import kotlin.coroutines.resume
import androidx.core.net.toUri

private const val NEW_FLAG = 1

suspend fun Context.addOrUpdate(
    upsertWordsToAnkiDictionary: (words: Array<String>, noteIds: LongArray, colorCode: Int) -> Unit,
    deckId: Long,
    fields: Map<String, String>,
    mapping: Map<String, Any?>,
    mirroredMapping: Map<String, Any?>,
    isTwoSided: Boolean,
    language: Map<String, String>,
    autoSuspend: Boolean,
    wordForms: List<String>
): List<Long> {
    val word = fields["word"] ?: throw Exception("Word field is missing")
    val modelId = (mapping["modalId"] as? String)?.toLong() ?: throw Exception("modalId is missing")

    val existingId = findDuplicateNote(word, deckId, mapping)
    val noteIds = if (existingId != null) {
        flagPair(existingId, word, deckId, mirroredMapping, isTwoSided)
    } else {
        createPair(
            word,
            deckId,
            modelId,
            fields,
            mapping,
            mirroredMapping,
            isTwoSided,
            language,
            autoSuspend,
        )
    }

    upsertWordsToAnkiDictionary(wordForms.toTypedArray(), noteIds.toLongArray(), NEW_FLAG)

    return noteIds
}

fun Context.findDuplicateNote(
    targetWord: String,
    deckId: Long,
    mapping: Map<String, Any?>,
): Long? {
    val resolver = applicationContext.contentResolver

    try {
        val expectedModelId = (mapping["modalId"] as? String)?.toLong() ?: throw Exception("modalId is missing")
        val notesUri = "content://com.ichi2.anki.flashcards/notes".toUri()
        val ankiSearchQuery = "did:$deckId \"${escapeAnkiSearchTerm(targetWord)}\""

        val noteCursor =
            resolver.query(
                notesUri,
                arrayOf("_id", "mid", "flds"),
                ankiSearchQuery,
                null,
                null,
            )

        noteCursor?.use { cursor ->
            val idIndex = cursor.getColumnIndex("_id")
            val fldsIndex = cursor.getColumnIndex("flds")
            val midIndex =  cursor.getColumnIndex("mid")

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idIndex)
                val modelId = cursor.getLong(midIndex)
                if (modelId != expectedModelId) continue

                val flds = cursor.getString(fldsIndex)

                val noteWord = parseNoteFields(flds, mapping) ?: continue
                if (noteWord.equals(targetWord, ignoreCase = true)) return id
            }
        }
        return null
    } catch (e: Exception) {
        Log.e("BookEngine", "Failed to find duplicate note", e)
        throw e
    }
}

private fun Context.flagPair(
    noteId: Long,
    word: String,
    deckId: Long,
    mirroredMapping: Map<String, Any?>,
    isTwoSided: Boolean,
): List<Long> {
    val flaggedIds = mutableListOf<Long>()

    AddContentApi(applicationContext).setFlagRaw(noteId, NEW_FLAG)
    flaggedIds.add(noteId)

    if (!isTwoSided) return flaggedIds

    val mirroredId = findMirrored(word, noteId, deckId, mirroredMapping) ?: return flaggedIds

    AddContentApi(applicationContext).setFlagRaw(mirroredId, NEW_FLAG)
    flaggedIds.add(mirroredId)

    return flaggedIds
}

fun Context.findMirrored(
    targetWord: String,
    mainId : Long,
    deckId: Long,
    mirroredMapping: Map<String, Any?>,
): Long? {
    val resolver = applicationContext.contentResolver

    try {
        val mirroredModelId = (mirroredMapping["modalId"] as? String)?.toLong() ?: return null
        val notesUri = "content://com.ichi2.anki.flashcards/notes".toUri()
        val ankiSearchQuery = "did:$deckId \"${escapeAnkiSearchTerm(targetWord)}\""

        val noteCursor =
            resolver.query(
                notesUri,
                arrayOf("_id", "mid", "flds"),
                ankiSearchQuery,
                null,
                null,
            )

        noteCursor?.use { cursor ->
            val idIndex = cursor.getColumnIndex("_id")
            val fldsIndex = cursor.getColumnIndex("flds")
            val midIndex =  cursor.getColumnIndex("mid")

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idIndex)
                val modelId = cursor.getLong(midIndex)
                if (modelId != mirroredModelId || id == mainId) continue

                val flds = cursor.getString(fldsIndex)

                val noteWord = parseNoteFields(flds, mirroredMapping) ?: continue
                if (noteWord.equals(targetWord, ignoreCase = true)) return id
            }
        }
        return null
    } catch (e: Exception) {
        Log.e("BookEngine", "Failed to find mirrored note", e)
        return null
    }
}

private suspend fun Context.createPair(
    word: String,
    deckId: Long,
    modelId: Long,
    fields: Map<String, String>,
    mapping: Map<String, Any?>,
    mirroredMapping: Map<String, Any?>,
    isTwoSided: Boolean,
    language: Map<String, String>,
    autoSuspend: Boolean,
): List<Long> {
    val definition = fields["definition"].orEmpty()
    val examples = fields["examples"].orEmpty()
    val noteFields = fields + ("examples" to if (definition.isNotEmpty()) "$definition<br><br>$examples" else examples)

    val langCode = language.getValue("iso639_3")
    val audioLang = language.getValue("iso639_1")
    val ankiApi = AddContentApi(applicationContext)

    val tier = AppDependencies.getFrequencyDatabase(applicationContext, langCode)?.getFrequencyTier(word) ?: "Unknown"
    val tags = setOf(tier)

    val mainId =
        ankiApi.addNote(modelId, deckId, convertFieldsToArray(noteFields, mapping, audioLang), tags)
            ?: throw Exception("Failed to create main note for $word")

    val createdIds = mutableListOf(mainId)

    if (isTwoSided) {
        val mirroredModelId = (mirroredMapping["modalId"] as? String)?.toLong() ?: throw Exception("mirrored modalId is missing")
        val mirroredId =
            ankiApi.addNote(mirroredModelId, deckId, convertFieldsToArray(noteFields, mirroredMapping, audioLang), tags)
                ?: throw Exception("Failed to create mirrored note for $word")
        createdIds.add(mirroredId)
    }

    for (noteId in createdIds) AddContentApi(applicationContext).setFlagRaw(noteId, NEW_FLAG)

    if (autoSuspend) suspendCardsOfNotes(createdIds)

    return createdIds
}

suspend fun Context.convertFieldsToArray(
    fields: Map<String, String>,
    mapping: Map<String, Any?>,
    audioLang: String,
): Array<String> {
    val fieldCount = (mapping["fieldCount"] as? Number)?.toInt() ?: 0
    val result = Array(fieldCount) { "" }

    var finalAnkiAudioName: String? = null
    val audioIndex = (mapping["audio"] as? Number)?.toInt()
    val word = fields["word"]

    if (audioIndex != null && word != null) {
        val localAudioPath = generateAudio(word, audioLang)
        if (localAudioPath != null) finalAnkiAudioName = importToAnkiMedia(File(localAudioPath))
    }

    for ((key, value) in mapping) {
        if (value !is Number || key == "fieldCount" || key == "modalId") continue
        val index = value.toInt()

        if (key == "audio" && finalAnkiAudioName != null) result[index] = "[sound:$finalAnkiAudioName]"
        else result[index] = fields[key] ?: ""
    }

    return result
}

suspend fun Context.generateAudio(
    text: String,
    language: String,
): String? {
    val audioDir = File(applicationContext.filesDir, "anki_audio").apply { mkdirs() }
    val audioFile = File(audioDir, "audio_gen_${language}_${text.hashCode()}.wav")
    if (audioFile.length() > 0) return audioFile.absolutePath

    return withContext(Dispatchers.Main) {
        var tts: TextToSpeech? = null
        try {
            suspendCancellableCoroutine { continuation ->
                val completed = AtomicBoolean(false)
                fun finish(path: String? = null) {
                    if (!completed.compareAndSet(false, true)) return
                    if (path == null) Log.e("BookEngine", "TTS audio generation failed for language: $language")
                    continuation.resume(path)
                }

                tts = TextToSpeech(applicationContext) init@{ status ->
                    if (!continuation.isActive) return@init
                    val engine = tts
                    if (status != TextToSpeech.SUCCESS || engine == null) return@init finish()
                    if (!TtsVoiceHelper.hasUsableVoice(engine, language)) return@init finish()

                    engine.setSpeechRate(1.0f)
                    engine.setOnUtteranceProgressListener(
                        object : UtteranceProgressListener() {
                            override fun onStart(utteranceId: String?) { }
                            override fun onDone(utteranceId: String?) = finish(audioFile.absolutePath)

                            @Deprecated("Deprecated in Java", ReplaceWith("finish()"))
                            override fun onError(utteranceId: String?) = finish()
                        },
                    )

                    val utteranceId = "audio_gen_${System.currentTimeMillis()}"
                    if (engine.synthesizeToFile(text, null, audioFile, utteranceId) == TextToSpeech.ERROR) finish()
                }
            }
        } finally {
            tts?.shutdown()
        }
    }
}

private fun Context.importToAnkiMedia(audioFile: File): String? =
    try {
        val contentUri =
            FileProvider.getUriForFile(
                applicationContext,
                "${applicationContext.packageName}.provider",
                audioFile,
            )

        applicationContext.grantUriPermission(
            "com.ichi2.anki",
            contentUri,
            Intent.FLAG_GRANT_READ_URI_PERMISSION,
        )

        val cr = applicationContext.contentResolver
        val mediaUri = "content://com.ichi2.anki.flashcards/media".toUri()

        val cv =
            ContentValues().apply {
                put("preferred_name", audioFile.name)
                put("file_uri", contentUri.toString())
            }

        val resultUri = cr.insert(mediaUri, cv)
        applicationContext.revokeUriPermission(contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)

        resultUri?.lastPathSegment
    } catch (e: Exception) {
        Log.e("BookEngine", "Failed to add media to Anki", e)
        null
    }

private fun Context.suspendCardsOfNotes(noteIds: List<Long>) {
    val resolver = applicationContext.contentResolver

    for (noteId in noteIds) {
        try {
            val cardsUri =
                Uri
                    .withAppendedPath(FlashCardsContract.Note.CONTENT_URI, noteId.toString())
                    .buildUpon()
                    .appendPath("cards")
                    .build()

            resolver
                .query(cardsUri, arrayOf(FlashCardsContract.Card.CARD_ORD), null, null, null)
                ?.use { cursor ->
                    val ordIndex = cursor.getColumnIndex(FlashCardsContract.Card.CARD_ORD)
                    if (ordIndex == -1) return@use

                    while (cursor.moveToNext()) {
                        val values = ContentValues().apply {
                            put(FlashCardsContract.ReviewInfo.NOTE_ID, noteId)
                            put(FlashCardsContract.ReviewInfo.CARD_ORD, cursor.getInt(ordIndex))
                            put(FlashCardsContract.ReviewInfo.SUSPEND, 1)
                        }
                        resolver.update(
                            FlashCardsContract.ReviewInfo.CONTENT_URI,
                            values,
                            null,
                            null,
                        )
                    }
                }
        } catch (e: Exception) {
            Log.e("BookEngine", "Failed to suspend cards of note $noteId", e)
        }
    }
}
