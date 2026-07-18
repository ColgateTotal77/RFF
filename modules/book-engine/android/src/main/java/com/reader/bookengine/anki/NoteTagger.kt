package com.reader.bookengine.anki

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import com.reader.bookengine.database.FrequencyDatabase
import kotlinx.coroutines.runBlocking

class NoteTagger(
    private val context: Context,
    private val freqDatabase: FrequencyDatabase? = null,
) {
    fun updateNoteTags(
        noteId: Long,
        newTags: Array<String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        bestTier: String,
    ): Pair<String, Int> {
        val resolver = context.contentResolver

        val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
        val cursor = resolver.query(noteUri, arrayOf("tags", "flds"), null, null, null)

        var currentTagsStr = ""
        var word = ""
        var colorCode = 0

        if (cursor != null) {
            if (cursor.moveToFirst()) {
                currentTagsStr = cursor.getString(0) ?: ""
                val flds = cursor.getString(1) ?: ""

                word = AnkiUtils.extractWord(flds, mapping, mirroredMapping)
            }
            cursor.close()
        }

        val existingTags =
            currentTagsStr
                .trim()
                .split("\\s+".toRegex())
                .filter { it.isNotEmpty() }
                .toMutableSet()

        for (newTag in newTags) {
            if (newTag.startsWith("Lookups_")) {
                existingTags.removeAll { it.startsWith("Lookups_") }
                existingTags.add(newTag)
            } else {
                existingTags.add(newTag)
            }
        }

        existingTags.removeAll { it.startsWith("Top_") }
        existingTags.add(bestTier)

        val tagsWithTierStr =
            if (existingTags.isEmpty()) {
                ""
            } else {
                " ${existingTags.joinToString(" ")} "
            }

        val values = ContentValues()
        values.put("tags", tagsWithTierStr)

        val rowsUpdated = resolver.update(noteUri, values, null, null)

        if (rowsUpdated == 0) throw Exception("Failed to update tags for Note ID $noteId in database.")

        colorCode = AnkiUtils.parseColorCode(tagsWithTierStr)

        return Pair(word, colorCode)
    }

    // TODO(27): batch Anki note reads + single Room IN query instead of N IPC + runBlocking per note
    fun getBestFrequencyTier(
        noteIds: LongArray,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
    ): String {
        val resolver = context.contentResolver

        var bestZipf = -1.0
        var bestTier = "Top_20000+"

        for (noteId in noteIds) {
            val noteUri = Uri.parse("content://com.ichi2.anki.flashcards/notes/$noteId")
            val cursor = resolver.query(noteUri, arrayOf("flds"), null, null, null)

            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    val flds = cursor.getString(0) ?: ""

                    val word = AnkiUtils.extractWord(flds, mapping, mirroredMapping)

                    if (word.isNotEmpty()) {
                        val (tier, zipf) =
                            runBlocking {
                                freqDatabase?.getFrequencyTier(word) ?: Pair("Top_20000+", 0.0)
                            }

                        if (zipf > bestZipf) {
                            bestZipf = zipf
                            bestTier = tier
                        }
                    }
                }
                cursor.close()
            }
        }
        return bestTier
    }
}
