import { AppFieldKey, Book, FieldMapping } from 'types';
import { findBestMapping } from 'lib/utils';
import { RESET_FIELD_MAPPING } from 'lib/constants';

export const resetMappingKey = (
  appKey: AppFieldKey,
  mapping: FieldMapping | undefined,
  setBookFieldMapping: (
    mappingName: 'fieldMapping' | 'mirroredFieldMapping',
    mapping: FieldMapping | undefined
  ) => void
) => {
  if (!mapping) return;
  const { [appKey]: _, ...rest } = mapping;
  setBookFieldMapping('mirroredFieldMapping', rest);
};

const findMappingFromOtherBooks = (
  modelId: string,
  mappingKey: 'fieldMapping' | 'mirroredFieldMapping',
  books: Book[]
): FieldMapping | undefined => {
  for (const book of books) {
    const mapping = book.settings[mappingKey];
    if (mapping && mapping.modalId === modelId) return mapping;
  }
  return undefined;
};

export const resolveMapping = (
  deckId: string,
  modelId: string,
  fieldCount: number,
  mappingKey: 'fieldMapping' | 'mirroredFieldMapping',
  globalMappings: Record<string, FieldMapping>,
  books: Book[]
): FieldMapping => {
  const bestGlobalMapping = findBestMapping(globalMappings, deckId, modelId);
  const mappingFromAnotherBook = findMappingFromOtherBooks(modelId, mappingKey, books);
  return {
    ...RESET_FIELD_MAPPING,
    ...(bestGlobalMapping ?? mappingFromAnotherBook),
    modalId: modelId,
    fieldCount,
  };
};
