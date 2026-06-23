package com.reader.bookengine.anki

data class ParsedNoteFields(
    val front: String,
    val back: String,
)

object AnkiUtils {
    const val FIELD_SEPARATOR = "\u001F"

    val LOOKUPS_REGEX = Regex("Lookups_([1-8])")

    private val ANKI_SEARCH_SPECIAL = Regex("""[\\"*_]""")

    fun escapeAnkiSearchTerm(term: String): String = term.replace(ANKI_SEARCH_SPECIAL) { "\\${it.value}" }

    fun selectActiveMapping(
        mid: String,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): Map<String, Any?> =
        if (mid == mirroredMapping["modalId"] && mid != mapping["modalId"]) {
            mirroredMapping
        } else {
            mapping
        }

    fun extractWord(
        flds: String,
        activeMapping: Map<String, Any?>,
    ): String {
        val wordIndex = (activeMapping["word"] as? Number)?.toInt() ?: 1
        val fields = flds.split(FIELD_SEPARATOR)
        return if (fields.size > wordIndex) fields[wordIndex].trim() else ""
    }

    fun parseColorCode(tagsStr: String): Int =
        LOOKUPS_REGEX
            .find(tagsStr)
            ?.groupValues
            ?.get(1)
            ?.toInt() ?: 0

    fun parseNoteFields(
        flds: String,
        frontMapping: Map<String, Any?>,
        backMapping: Map<String, Any?>,
        fallbackMapping: Map<String, Any?>? = null,
    ): ParsedNoteFields? {
        val fieldsArray = flds.split(FIELD_SEPARATOR)
        val frontIndex = (frontMapping["word"] as? Number)?.toInt() ?: 0
        val backIndex = (backMapping["translation"] as? Number)?.toInt() ?: 0
        val fallbackBackIndex = (fallbackMapping?.get("translation") as? Number)?.toInt()
        val fallbackFrontIndex = (fallbackMapping?.get("word") as? Number)?.toInt() ?: 0

        val maxRequiredIndex = listOfNotNull(frontIndex, backIndex, fallbackBackIndex).maxOrNull() ?: 0

        if (fieldsArray.size <= maxRequiredIndex) return null

        var front = fieldsArray[frontIndex].trim()
        var back = fieldsArray[backIndex].trim()

        if (back.isEmpty() && fallbackBackIndex != null) back = fieldsArray[fallbackBackIndex].trim()
        if (front.isEmpty() && fallbackMapping != null) front = fieldsArray[fallbackFrontIndex].trim()

        return ParsedNoteFields(front, back)
    }
}
