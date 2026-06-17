package com.reader.bookengine.anki

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale
import kotlin.coroutines.resume

class AnkiAudioHelper(
    private val context: Context,
) {
    suspend fun generateAudio(
        text: String,
        language: String = "en",
    ): String? {
        val audioDir = File(context.filesDir, "anki_audio")
        if (!audioDir.exists()) audioDir.mkdirs()

        val fileName = "audio_gen_${text.hashCode()}.wav"
        val audioFile = File(audioDir, fileName)

        if (audioFile.exists() && audioFile.length() > 0) return audioFile.absolutePath

        return withContext(Dispatchers.Main) { suspendCancellableCoroutine { continuation ->
            var tts: TextToSpeech? = null
            val utteranceId = "audio_gen_${System.currentTimeMillis()}"

            tts =
                TextToSpeech(context) { status ->
                    if (status == TextToSpeech.SUCCESS) {
                        tts?.language = Locale(language)
                        tts?.setSpeechRate(1.0f)

                        tts?.setOnUtteranceProgressListener(
                            object : UtteranceProgressListener() {
                                override fun onStart(utteranceId: String?) { }

                                override fun onDone(utteranceId: String?) {
                                    tts?.shutdown()
                                    continuation.resume(audioFile.absolutePath)
                                }

                                @Deprecated("Deprecated in Java")
                                override fun onError(utteranceId: String?) {
                                    android.util.Log.e("BookEngine", "TTS synthesis failed")
                                    tts?.shutdown()
                                    continuation.resume(null)
                                }
                            },
                        )

                        val params = android.os.Bundle()
                        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)

                        val result = tts?.synthesizeToFile(text, params, audioFile, utteranceId)
                        if (result == TextToSpeech.ERROR) {
                            android.util.Log.e("BookEngine", "TTS synthesizeToFile failed")
                            tts?.shutdown()
                            continuation.resume(null)
                        }
                    } else {
                        android.util.Log.e("BookEngine", "TTS initialization failed")
                        continuation.resume(null)
                    }
                }
        } }
    }

    suspend fun importToAnkiMedia(audioFile: File): String? =
        try {
            val contentUri =
                FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.provider",
                    audioFile,
                )

            context.grantUriPermission(
                "com.ichi2.anki",
                contentUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION,
            )

            val cr = context.contentResolver
            val mediaUri = Uri.parse("content://com.ichi2.anki.flashcards/media")

            val cv =
                ContentValues().apply {
                    put("preferred_name", audioFile.name)
                    put("file_uri", contentUri.toString())
                }

            val resultUri = cr.insert(mediaUri, cv)
            context.revokeUriPermission(contentUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)

            resultUri?.lastPathSegment
        } catch (e: Exception) {
            android.util.Log.e("BookEngine", "Failed to add media to Anki", e)
            null
        }
}
