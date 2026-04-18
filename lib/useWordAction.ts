import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';

interface UpdateWordTag {
  noteIds: string;
  colorCode: string;
}

export const useWordAction = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const updateTagAction = useBookStore((state) => state.updateTagAction)!;

  const addNewCard = async (text: string) => {
    const deckId = currentBook.settings.ankiDeckId || settings.ankiDeckId;
    const cleanedText = text.replace(/[^\w\s]|_/g, '');

    try {
      if (!deckId) {
        console.error('Missing Anki configuration');
        return;
      }

      const metadata = await fetchWordMetadata(cleanedText, 'en', 'ru');

      const isTwoSided = currentBook.settings.isTwoSided || settings.isTwoSided;
      const mapping = currentBook.settings.fieldMapping || settings.fieldMapping || {};
      const mirroredMapping =
        currentBook.settings.mirroredFieldMapping || settings.mirroredFieldMapping || {};

      const fields = {
        word: metadata?.name || '',
        translation: metadata?.translation || '',
        examples: formatExamples(metadata?.examples ?? []),
      }

      const noteIdsArray = await Anki.addNote(deckId, fields, mapping, mirroredMapping, isTwoSided);

      if (noteIdsArray && noteIdsArray.length > 0) {
        const noteIdsString = JSON.stringify(noteIdsArray);
        updateTagAction(metadata?.wordForms || cleanedText, noteIdsString, '1');
      }
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  const updateWordTag = async ({ colorCode, noteIds }: UpdateWordTag) => {
    const mapping = currentBook.settings.fieldMapping || settings.fieldMapping || {};
    const mirroredMapping =
      currentBook.settings.mirroredFieldMapping || settings.mirroredFieldMapping || {};

    const newTagIdNum = Number(colorCode) + 1;
    if (newTagIdNum > 8) return;
    const newTagId = String(newTagIdNum);
    try {
      const idsArray = JSON.parse(noteIds);

      Anki.updateNoteTags(idsArray, [`Lookups_${newTagId}`, 'New'], mapping, mirroredMapping);
      updateTagAction(null, noteIds, newTagId);
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

  return { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator };
};

const formatExamples = (examples: string[]) => {
  return examples.map((example, index) => `${index + 1}) ${example}`).join('<br>');
};
