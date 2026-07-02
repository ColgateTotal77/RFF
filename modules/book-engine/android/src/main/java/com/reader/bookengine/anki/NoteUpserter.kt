package com.reader.bookengine.anki

import android.content.Context
import com.ichi2.anki.api.AddContentApi
import com.reader.bookengine.database.FrequencyDatabase

class NoteUpserter(
    context: Context,
    private val freqDatabase: FrequencyDatabase?,
    private val upsertToDictionary: (word: String, noteIds: LongArray, colorCode: Int) -> Unit,
) {
    private val ankiApi = AddContentApi(context)
    private val noteFinder = NoteFinder(context)
    private val noteTagger = NoteTagger(context, freqDatabase)
    private val fieldMapper = FieldArrayMapper(context, AnkiAudioHelper(context))

    suspend fun addOrUpdate(
        deckId: Long,
        fields: Map<String, String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
    ): List<Long> {
        val word = fields["word"] ?: throw Exception("Word field is missing")
        val modelId = (mapping["modalId"] as? String)?.toLong() ?: throw Exception("modalId is missing")

        val (tier, zipf) = freqDatabase?.getFrequencyTier(word) ?: Pair("Top_20000+", 0.0)

        val existing = noteFinder.findByModelId(modelId, word)
        return if (existing != null) {
            retagPair(existing.id, word, deckId, tier, mapping, mirroredMapping, isTwoSided)
        } else {
            createPair(word, zipf, tier, deckId, modelId, fields, mapping, mirroredMapping, isTwoSided)
        }
    }

    private fun retagPair(
        noteId: Long,
        word: String,
        deckId: Long,
        tier: String,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
    ): List<Long> {
        val tags = arrayOf("Lookups_1", tier)
        val updatedIds = mutableListOf<Long>()

        retag(noteId, tags, mapping, mirroredMapping, tier, updatedIds)

        if (isTwoSided) {
            val mirroredId = noteFinder.findMirrored(word, deckId, mapping, mirroredMapping)
            if (mirroredId != null && mirroredId != noteId) {
                retag(mirroredId, tags, mapping, mirroredMapping, tier, updatedIds)
            }
        }
        return updatedIds
    }

    private fun retag(
        noteId: Long,
        tags: Array<String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        tier: String,
        updatedIds: MutableList<Long>,
    ) {
        val (word, colorCode) = noteTagger.updateNoteTags(noteId, tags, mapping, mirroredMapping, tier)
        updatedIds.add(noteId)
        if (word.isNotEmpty()) upsertToDictionary(word, longArrayOf(noteId), colorCode)
    }

    private suspend fun createPair(
        word: String,
        zipf: Double,
        tier: String,
        deckId: Long,
        modelId: Long,
        fields: Map<String, String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
    ): List<Long> {
        val noteFields = buildNoteFields(fields, word, zipf)
        val tags = setOf("Lookups_1", tier)

        val mainId =
            ankiApi.addNote(modelId, deckId, fieldMapper.convertFieldsToArray(noteFields, mapping), tags)
                ?: throw Exception("Failed to create main note for $word")

        val createdIds = mutableListOf(mainId)

        if (isTwoSided) {
            val mirroredModelId =
                (mirroredMapping["modalId"] as? String)?.toLong() ?: throw Exception("mirrored modalId is missing")
            val mirroredId =
                ankiApi.addNote(mirroredModelId, deckId, fieldMapper.convertFieldsToArray(noteFields, mirroredMapping), tags)
                    ?: throw Exception("Failed to create mirrored note for $word")
            createdIds.add(mirroredId)
        }

        upsertToDictionary(word, createdIds.toLongArray(), 1)
        return createdIds
    }

    private fun buildNoteFields(
        fields: Map<String, String>,
        word: String,
        zipf: Double,
    ): Map<String, String> {
        val definition = fields["definition"] ?: ""
        val examples = fields["examples"] ?: ""
        val combinedExamples = if (definition.isNotEmpty()) "$definition<br><br>$examples" else examples

        return fields.toMutableMap().apply {
            this["word"] = word
            this["zipf"] = zipf.toString()
            this["examples"] = combinedExamples
        }
    }
}
