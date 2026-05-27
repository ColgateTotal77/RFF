import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { deepMerge } from 'lib/utils';
import { useWebViewStore } from 'stores/useWebViewStore';

interface UpdateWordTag {
  noteIds: string;
  colorCode: string;
}

export const useWordAction = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const executeImmediateAction = useWebViewStore((state) => state.executeImmediateAction);

  const addNewCard = async (text: string) => {
    const deckId = currentBook.settings.ankiDeckId || settings.ankiDeckId;
    const targetLang = currentBook.settings.targetLang || settings.targetLang;
    const cleanedText = text.replace(/[^\w\s]|_/g, '');

    try {
      if (!deckId) {
        console.error('Missing Anki configuration');
        return;
      }

      executeImmediateAction({
        type: 'updateTag',
        word: cleanedText,
        noteIds: '',
        colorCode: '-1',
      });

      const metadata = await fetchWordMetadata(
        cleanedText,
        currentBook.settings.bookLang,
        targetLang
      );

      const isTwoSided = currentBook.settings.isTwoSided || settings.isTwoSided;
      const modelId = currentBook.settings.ankiModelId || settings.ankiModelId;
      const mirroredModelId =
        currentBook.settings.mirroredAnkiModelId || settings.mirroredAnkiModelId;
      const key = `${deckId}:${modelId}`;
      const mirroredKey = `${deckId}:${mirroredModelId}`;

      const mapping = deepMerge(
        settings.fieldMappings?.[key] || {},
        currentBook.settings.fieldMapping || {}
      );
      const mirroredMapping = deepMerge(
        settings.mirroredFieldMappings?.[mirroredKey] || {},
        currentBook.settings.mirroredFieldMapping || {}
      );

      const fields = {
        originalWord: cleanedText.toLowerCase(),
        word: metadata?.word || '',
        translation: metadata?.translation || '',
        definition: metadata?.definition || '',
        synonyms: metadata?.synonyms.join(', ') || '',
        examples: formatExamples(metadata?.examples ?? []),
      };

      const noteIdsArray = await Anki.addNote(deckId, fields, mapping, mirroredMapping, isTwoSided);

      if (noteIdsArray && noteIdsArray.length > 0) {
        const noteIdsString = JSON.stringify(noteIdsArray);
        executeImmediateAction({
          type: 'updateTag',
          word: metadata?.wordForms || cleanedText,
          noteIds: noteIdsString,
          colorCode: '1',
        });
      }
    } catch (error) {
      console.error('Anki error:', error);
      executeImmediateAction({
        type: 'updateTag',
        word: cleanedText,
        noteIds: '',
        colorCode: 'remove',
      });
    }
  };

  const updateWordTag = async ({ colorCode, noteIds }: UpdateWordTag) => {
    const deckId = currentBook.settings.ankiDeckId || settings.ankiDeckId;
    const modelId = currentBook.settings.ankiModelId || settings.ankiModelId;
    const mirroredModelId =
      currentBook.settings.mirroredAnkiModelId || settings.mirroredAnkiModelId;
    const key = `${deckId}:${modelId}`;
    const mirroredKey = `${deckId}:${mirroredModelId}`;

    const mapping = deepMerge(
      settings.fieldMappings?.[key] || {},
      currentBook.settings.fieldMapping || {}
    );
    const mirroredMapping = deepMerge(
      settings.mirroredFieldMappings?.[mirroredKey] || {},
      currentBook.settings.mirroredFieldMapping || {}
    );

    if (Number(colorCode) > 8) return;
    try {
      const idsArray = JSON.parse(noteIds);

      Anki.updateNoteTags(idsArray, [`Lookups_${colorCode}`, 'New'], mapping, mirroredMapping);
      executeImmediateAction({
        type: 'updateTag',
        word: null,
        noteIds: noteIds,
        colorCode: colorCode,
      });
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  const openSystemTranslator = async (text: string) => {
    try {
      await BookEngine.openSystemTranslator(text);
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const deleteNote = async (noteIds: string, word: string) => {
    const idsArray = JSON.parse(noteIds);
    try {
      await Anki.deleteNote(idsArray);
      executeImmediateAction({
        type: 'updateTag',
        word,
        noteIds: noteIds,
        colorCode: 'remove',
      });
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  return { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator, deleteNote };
};

const formatExamples = (examples: string[]) => {
  return examples.map((example, index) => `${index + 1}) ${example}`).join('<br>');
};
