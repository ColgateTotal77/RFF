import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore } from 'stores/useBookStore';
import { useWebViewStore } from 'stores/useWebViewStore';
import { DASH_REGEX_STRING } from './constants';

interface UpdateWordTag {
  noteIds: string;
  colorCode: string;
}

export const useWordAction = () => {
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const getBookSettings = useBookStore((state) => state.getBookSettings);

  const addNewCard = async (text: string, sentence: string) => {
    const bookSettings = getBookSettings();

    if (!bookSettings.ankiDeckId || !bookSettings.ankiModelId) {
      console.error('Missing Anki configuration');
      return;
    }

    const cleanedText = text.replace(new RegExp(`[^\\p{L}\\d\\s${DASH_REGEX_STRING}]+`, 'gu'), '');

    try {
      executeImmediateActions([
        {
          type: 'updateTag',
          word: cleanedText,
          noteIds: '',
          colorCode: '-1',
        },
      ]);

      const metadata = await fetchWordMetadata(
        cleanedText,
        sentence === text ? '' : sentence,
        bookSettings.bookLang,
        bookSettings.targetLang
      );

      const isTwoSided = bookSettings.isTwoSided;

      const fields = {
        originalWord: cleanedText.toLowerCase(),
        word: metadata?.word || '',
        translation: metadata?.translation || '',
        definition: metadata?.definition || '',
        synonyms: metadata?.synonyms.join(', ') || '',
        examples: formatExamples(metadata?.examples ?? []),
      };

      const noteIdsArray = await Anki.addNote(
        bookSettings.ankiDeckId,
        fields,
        bookSettings.fieldMapping,
        bookSettings.mirroredFieldMapping,
        isTwoSided
      );

      if (noteIdsArray && noteIdsArray.length > 0) {
        const noteIdsString = JSON.stringify(noteIdsArray);
        executeImmediateActions([
          {
            type: 'updateTag',
            word: metadata?.wordForms || cleanedText,
            noteIds: noteIdsString,
            colorCode: '1',
          },
        ]);
      }
    } catch (error) {
      console.error('Anki error:', error);
      executeImmediateActions([
        {
          type: 'updateTag',
          word: cleanedText,
          noteIds: '',
          colorCode: 'remove',
        },
      ]);
    }
  };

  const updateWordTag = async ({ colorCode, noteIds }: UpdateWordTag) => {
    const bookSettings = getBookSettings();

    if (!bookSettings.ankiDeckId || !bookSettings.ankiModelId) {
      console.error('Missing Anki configuration');
      return;
    }

    if (Number(colorCode) > 8) return;
    try {
      const idsArray = JSON.parse(noteIds);

      Anki.updateNoteTags(
        idsArray,
        [`Lookups_${colorCode}`, 'New'],
        bookSettings.fieldMapping,
        bookSettings.mirroredFieldMapping
      );
      executeImmediateActions([
        {
          type: 'updateTag',
          word: null,
          noteIds: noteIds,
          colorCode: colorCode,
        },
      ]);
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
    try {
      const idsArray = JSON.parse(noteIds);

      await Anki.deleteNote(idsArray);
      executeImmediateActions([
        {
          type: 'updateTag',
          word,
          noteIds: noteIds,
          colorCode: 'remove',
        },
      ]);
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  return { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator, deleteNote };
};

const formatExamples = (examples: string[]) => {
  return examples.map((example, index) => `${index + 1}) ${example}`).join('<br>');
};
