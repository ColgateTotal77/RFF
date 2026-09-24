import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore } from 'stores/useBookStore';
import { useWebViewStore } from 'stores/useWebViewStore';
import { Toast } from 'components/ui/Toast';
import { useTranslation } from 'react-i18next';
import { bookLanguageToLocaleTag } from 'lib/langHelper';

interface UpdateWordFlag {
  noteIds: string;
  colorCode: string;
}

export const useWordAction = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'toast' });
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const getBookSettings = useBookStore((state) => state.getBookSettings);

  const addNewCard = async (text: string, sentence: string) => {
    const bookSettings = getBookSettings();

    if (!bookSettings.ankiDeckId || !bookSettings.ankiModelId) {
      Toast.show(t('configureAnkiDeck'), 'error');
      return;
    }

    try {
      executeImmediateActions([
        {
          type: 'updateFlag',
          word: text,
          noteIds: '',
          colorCode: '-1',
        },
      ]);

      const metadata = await fetchWordMetadata(
        text,
        sentence === text ? '' : sentence,
        bookSettings.bookLang,
        bookSettings.targetLang
      );

      const isTwoSided = bookSettings.isTwoSided;

      const fields = {
        originalWord: text.toLowerCase(),
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
        isTwoSided,
        bookLanguageToLocaleTag(bookSettings.bookLang),
        bookSettings.autoSuspendNewCards
      );

      if (noteIdsArray && noteIdsArray.length > 0) {
        const noteIdsString = JSON.stringify(noteIdsArray);
        executeImmediateActions([
          {
            type: 'updateFlag',
            word: metadata?.wordForms || text,
            noteIds: noteIdsString,
            colorCode: '1',
          },
        ]);
      }
    } catch (error) {
      console.error('Anki error:', error);
      Toast.show(t('failedToAddCard'), 'error');
      executeImmediateActions([
        {
          type: 'updateFlag',
          word: text,
          noteIds: '',
          colorCode: 'remove',
        },
      ]);
    }
  };

  const updateWordFlag = async ({ colorCode, noteIds }: UpdateWordFlag) => {
    const bookSettings = getBookSettings();

    if (!bookSettings.ankiDeckId || !bookSettings.ankiModelId) {
      Toast.show(t('configureAnkiDeck'), 'error');
      return;
    }

    const flag = Number(colorCode);
    if (flag < 0 || flag > 7) return;
    try {
      const idsArray = JSON.parse(noteIds);

      Anki.updateFlag(idsArray, flag, bookSettings.fieldMapping, bookSettings.mirroredFieldMapping);
      executeImmediateActions([
        {
          type: 'updateFlag',
          word: null,
          noteIds: noteIds,
          colorCode: colorCode,
        },
      ]);
    } catch (error) {
      console.error('Anki error:', error);
      Toast.show(t('failedToUpdateCard'), 'error');
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
      Toast.show(t('failedToOpenTranslator'), 'error');
    }
  };

  const deleteNote = async (noteIds: string, word: string) => {
    try {
      const idsArray = JSON.parse(noteIds);

      await Anki.deleteNote(idsArray);
      executeImmediateActions([
        {
          type: 'updateFlag',
          word,
          noteIds: noteIds,
          colorCode: 'remove',
        },
      ]);
    } catch (error) {
      console.error('Anki error:', error);
      Toast.show(t('failedToDeleteNote'), 'error');
    }
  };

  return { addNewCard, updateWordFlag, copyToClipboard, openSystemTranslator, deleteNote };
};

const formatExamples = (examples: string[]) => {
  return examples.map((example, index) => `${index + 1}) ${example}`).join('<br>');
};
