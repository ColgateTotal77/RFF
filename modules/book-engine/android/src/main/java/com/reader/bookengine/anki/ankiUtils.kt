package com.reader.bookengine.anki

private val ANKI_SEARCH_SPECIAL = Regex("""[\\"*_]""")
fun escapeAnkiSearchTerm(term: String): String = term.replace(ANKI_SEARCH_SPECIAL) { "\\${it.value}" }
const val FIELD_SEPARATOR = "\u001F"
fun parseNoteFields(
    flds: String,
    mirroredMapping: Map<String, Any?>,
): String? {
    val fieldsArray = flds.split(FIELD_SEPARATOR)
    val frontIndex = (mirroredMapping["word"] as? Number)?.toInt() ?: return null
    if (frontIndex !in fieldsArray.indices) return null

    val front = fieldsArray[frontIndex].trim()
    if (front.isEmpty()) return null

    return front
}
