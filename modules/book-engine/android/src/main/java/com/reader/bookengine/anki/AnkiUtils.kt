package com.reader.bookengine.anki

data class ParsedNoteFields(
    val front: String,
    val back: String,
)

object AnkiUtils {
    const val FIELD_SEPARATOR = "\u001F"

    private val LOOKUPS_REGEX = Regex("Lookups_([1-8])")

    private val ANKI_SEARCH_SPECIAL = Regex("""[\\"*_]""")

    fun escapeAnkiSearchTerm(term: String): String = term.replace(ANKI_SEARCH_SPECIAL) { "\\${it.value}" }

    fun parseNote(
        flds: String,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): ParsedNoteFields? = parseNoteFields(flds, mapping) ?: parseNoteFields(flds, mirroredMapping)

    fun extractWord(
        flds: String,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): String = parseNote(flds, mapping, mirroredMapping)?.front ?: ""

    fun parseColorCode(tagsStr: String): Int =
        LOOKUPS_REGEX
            .find(tagsStr)
            ?.groupValues
            ?.get(1)
            ?.toInt() ?: 0

    private fun parseNoteFields(
        flds: String,
        activeMapping: Map<String, Any?>,
    ): ParsedNoteFields? {
        val fieldsArray = flds.split(FIELD_SEPARATOR)
        val frontIndex = (activeMapping["word"] as? Number)?.toInt() ?: return null
        val backIndex = (activeMapping["translation"] as? Number)?.toInt() ?: return null

        if (frontIndex !in fieldsArray.indices || backIndex !in fieldsArray.indices) return null

        val front = fieldsArray[frontIndex].trim()
        val back = fieldsArray[backIndex].trim()

        if (front.isEmpty() || back.isEmpty()) return null

        return ParsedNoteFields(front, back)
    }
}
