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
    private val cardFlagger = CardFlagger(context)
    private val fieldMapper = FieldArrayMapper(context, AnkiAudioHelper(context))
    private val cardSuspender = CardSuspender(context)

    suspend fun addOrUpdate(
        deckId: Long,
        fields: Map<String, String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
        audioLang: String,
        autoSuspend: Boolean,
    ): List<Long> {
        val word = fields["word"] ?: throw Exception("Word field is missing")
        val modelId = (mapping["modalId"] as? String)?.toLong() ?: throw Exception("modalId is missing")

        val existing = noteFinder.findByModelId(modelId, word)
        return if (existing != null) {
            flagPair(existing.id, word, deckId, mapping, mirroredMapping, isTwoSided)
        } else {
            createPair(
                word,
                deckId,
                modelId,
                fields,
                mapping,
                mirroredMapping,
                isTwoSided,
                audioLang,
                autoSuspend,
            )
        }
    }

    private fun flagPair(
        noteId: Long,
        word: String,
        deckId: Long,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
    ): List<Long> {
        val flaggedIds = mutableListOf<Long>()

        flagNote(noteId, mapping, mirroredMapping, flaggedIds)

        if (isTwoSided) {
            val mirroredId = noteFinder.findMirrored(word, deckId, mapping, mirroredMapping)
            if (mirroredId != null && mirroredId != noteId) {
                flagNote(mirroredId, mapping, mirroredMapping, flaggedIds)
            }
        }
        return flaggedIds
    }

    private fun flagNote(
        noteId: Long,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        flaggedIds: MutableList<Long>,
    ) {
        val (word, colorCode) = cardFlagger.updateFlag(noteId, NEW_FLAG, mapping, mirroredMapping)
        flaggedIds.add(noteId)
        if (word.isNotEmpty()) upsertToDictionary(word, longArrayOf(noteId), colorCode)
    }

    private suspend fun createPair(
        word: String,
        deckId: Long,
        modelId: Long,
        fields: Map<String, String>,
        mapping: Map<String, Any?>,
        mirroredMapping: Map<String, Any?>,
        isTwoSided: Boolean,
        audioLang: String,
        autoSuspend: Boolean,
    ): List<Long> {
        val noteFields = buildNoteFields(fields, word)
        val tier = freqDatabase?.getFrequencyTier(word) ?: "VeryRare"
        val tags = setOf(tier)

        val mainId =
            ankiApi.addNote(modelId, deckId, fieldMapper.convertFieldsToArray(noteFields, mapping, audioLang), tags)
                ?: throw Exception("Failed to create main note for $word")

        val createdIds = mutableListOf(mainId)

        if (isTwoSided) {
            val mirroredModelId =
                (mirroredMapping["modalId"] as? String)?.toLong() ?: throw Exception("mirrored modalId is missing")
            val mirroredId =
                ankiApi.addNote(mirroredModelId, deckId, fieldMapper.convertFieldsToArray(noteFields, mirroredMapping, audioLang), tags)
                    ?: throw Exception("Failed to create mirrored note for $word")
            createdIds.add(mirroredId)
        }

        for (noteId in createdIds) cardFlagger.setFlag(noteId, NEW_FLAG)

        if (autoSuspend) cardSuspender.suspendCardsOfNotes(createdIds)

        upsertToDictionary(word, createdIds.toLongArray(), NEW_FLAG)
        return createdIds
    }

    private fun buildNoteFields(
        fields: Map<String, String>,
        word: String,
    ): Map<String, String> {
        val definition = fields["definition"] ?: ""
        val examples = fields["examples"] ?: ""
        val combinedExamples = if (definition.isNotEmpty()) "$definition<br><br>$examples" else examples

        return fields.toMutableMap().apply {
            this["word"] = word
            this["examples"] = combinedExamples
        }
    }

    companion object {
        private const val NEW_FLAG = 1
    }
}
