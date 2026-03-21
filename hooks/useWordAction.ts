import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore } from 'stores/useBookStore';

interface UpdateWordTag {
  noteId: string;
  colorCode: string;
  onUpdateTag: (word: string | null, noteId: string, colorCode: string) => void;
}

interface AddNewCardProps {
  text: string;
  onUpdateTag: (word: string | null, noteId: string, colorCode: string) => void;
}

export const useWordAction = () => {
  const { currentBook, settings } = useBookStore();

  const addNewCard = async ({ text, onUpdateTag }: AddNewCardProps) => {
    const deckId = currentBook?.settings?.ankiDeckId || settings.defaultBookSettings.ankiDeckId;
    const modelId = currentBook?.settings?.ankiModelId || settings.defaultBookSettings.ankiModelId;

    try {
      if (!modelId || !deckId) {
        console.error('Missing Anki configuration');
        return;
      }

      const metadata = await fetchWordMetadata(text, 'en', 'ru');

      const ankiFields = [
        '',
        metadata?.name || '',
        '',
        '',
        metadata?.translation || '',
        '',
        formatExamples(metadata.examples),
      ];

      const noteId = await Anki.addNote(modelId, deckId, ankiFields, ['Lookups_1']);

      if (noteId) {
        console.log('Note created successfully:', noteId, typeof noteId);
        onUpdateTag(text, noteId, '1');
      } else {
        console.error('Failed to create Anki note');
      }
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  const updateWordTag = async ({colorCode, noteId, onUpdateTag}: UpdateWordTag) => {
    const newTagIdNum = Number(colorCode) + 1;
    if (newTagIdNum > 8) return;
    const newTagId = String(newTagIdNum);
    try {
      Anki.updateNoteTags(noteId, [`Lookups_${newTagId}`]);
      onUpdateTag(null, noteId, newTagId);
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
