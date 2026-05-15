package com.reader.bookengine.anki

object AnkiUtils {
    const val FIELD_SEPARATOR = "\u001F"

    val LOOKUPS_REGEX = Regex("Lookups_([1-8])")

    fun selectActiveMapping(
            mid: String,
            mapping: Map<String, Any?>,
            mirroredMapping: Map<String, Any?>
    ): Map<String, Any?> =
            if (mid == mirroredMapping["modalId"] && mid != mapping["modalId"]) {
                mirroredMapping
            } else {
                mapping
            }

    fun extractWord(flds: String, activeMapping: Map<String, Any?>): String {
        val wordIndex = (activeMapping["word"] as? Number)?.toInt() ?: 1
        val fields = flds.split(FIELD_SEPARATOR)
        return if (fields.size > wordIndex) fields[wordIndex].trim() else ""
    }

    fun parseColorCode(tagsStr: String): Int =
            LOOKUPS_REGEX.find(tagsStr)?.groupValues?.get(1)?.toInt() ?: 0
}
