package com.reader.bookengine.tts

import android.content.Context
import android.speech.tts.TextToSpeech
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.coroutines.resume

object TtsVoiceHelper {
    fun hasUsableVoice(
        tts: TextToSpeech,
        language: String,
    ): Boolean {
        val langResult = tts.setLanguage(Locale.forLanguageTag(language))
        if (langResult == TextToSpeech.LANG_MISSING_DATA ||
            langResult == TextToSpeech.LANG_NOT_SUPPORTED
        ) {
            android.util.Log.e("BookEngine", "TTS has no voice for language: $language")
            return false
        }

        val voice = tts.voice
        if (voice == null ||
            voice.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) == true
        ) {
            android.util.Log.e("BookEngine", "TTS voice not installed for language: $language")
            return false
        }

        return true
    }

    suspend fun isVoiceAvailable(
        context: Context,
        language: String,
    ): Boolean =
        withContext(Dispatchers.Main) {
            suspendCancellableCoroutine { continuation ->
                var tts: TextToSpeech? = null

                tts =
                    TextToSpeech(context) { status ->
                        val available =
                            status == TextToSpeech.SUCCESS &&
                                tts?.let { hasUsableVoice(it, language) } == true

                        tts?.shutdown()
                        continuation.resume(available)
                    }
            }
        }
}
