package com.reader.bookengine.tts

import android.content.Context
import android.speech.tts.TextToSpeech
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.coroutines.resume

object TtsVoiceHelper {
    private const val LEGACY_VOICE_FEATURE = "legacySetLanguageVoice"

    fun hasUsableVoice(
        tts: TextToSpeech,
        language: String,
    ): Boolean {
        val locale = Locale.forLanguageTag(language)
        if (tts.setLanguage(locale) < TextToSpeech.LANG_AVAILABLE) {
            android.util.Log.e("BookEngine", "TTS has no voice for language: $language")
            return false
        }

        val country = tts.voice?.locale?.country
        val voice =
            runCatching { tts.voices }
                .getOrNull()
                .orEmpty()
                .filter {
                    it.locale.language.equals(locale.language, true) &&
                        it.features.orEmpty().none { feature ->
                            feature == TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED ||
                                feature == LEGACY_VOICE_FEATURE
                        }
                }.maxWithOrNull(
                    compareBy(
                        { it.locale.country.equals(country, true) },
                        { !it.isNetworkConnectionRequired },
                        { it.quality },
                    ),
                )

        if (voice == null) {
            android.util.Log.e("BookEngine", "TTS voice not installed for language: $language")
            return false
        }

        tts.setVoice(voice)
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
