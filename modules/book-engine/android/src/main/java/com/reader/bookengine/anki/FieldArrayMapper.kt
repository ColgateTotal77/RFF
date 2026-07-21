package com.reader.bookengine.anki

import android.content.Context
import java.io.File

class FieldArrayMapper(
    private val context: Context,
    private val audio: AnkiAudioHelper,
) {
    suspend fun convertFieldsToArray(
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
            val localAudioPath = audio.generateAudio(word, audioLang)
            if (localAudioPath != null) finalAnkiAudioName = audio.importToAnkiMedia(File(localAudioPath))
        }

        for ((key, value) in mapping) {
            if (value !is Number || key == "fieldCount" || key == "modalId") continue
            val index = value.toInt()

            if (key == "audio" && finalAnkiAudioName != null) {
                result[index] = "[sound:$finalAnkiAudioName]"
            } else {
                result[index] = fields[key] ?: ""
            }
        }

        return result
    }
}
