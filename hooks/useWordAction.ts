import { fetchWordMetadata } from 'lib/supabaseRequests';
import { Anki, BookEngine } from 'modules/book-engine';
import Clipboard from '@react-native-clipboard/clipboard';
import { useBookStore } from 'stores/useBookStore';

interface UpdateWordTag {
  noteId: string;
  colorCode: string;
}

export const useWordAction = () => {
  const { currentBook, settings, updateTagAction } = useBookStore();

  const addNewCard = async (text: string) => {
    const deckId = currentBook?.settings?.ankiDeckId || settings.defaultBookSettings.ankiDeckId;
    const modelId = currentBook?.settings?.ankiModelId || settings.defaultBookSettings.ankiModelId;

    const cleanedText = text.replace(/[^\w\s]|_/g, '');

    try {
      if (!modelId || !deckId) {
        console.error('Missing Anki configuration');
        return;
      }

      const metadata = await fetchWordMetadata(cleanedText, 'en', 'ru');

      const ankiFields = [
        '',
        metadata?.name || '',
        '',
        '',
        metadata?.translation || '',
        '',
        formatExamples(metadata?.examples ?? []),
      ];
      const tier = await BookEngine.getWordFrequencyTier(metadata?.name);

      const noteId = await Anki.addNote(modelId, deckId, ankiFields, ['Lookups_1', tier]);

      if (noteId) {
        console.log('Note created successfully:', noteId, typeof noteId);
        console.log('Tier:', tier);

        updateTagAction(metadata?.wordForms || cleanedText, noteId, '1');

        const mirroredCard = [
          '',
          metadata?.translation || '',
          '',
          '',
          metadata?.name || '',
          '',
          formatExamples(metadata?.examples ?? []),
        ];

        Anki.addNote(modelId, deckId, mirroredCard, ['Lookups_1', tier]);
      } else {
        console.error('Failed to create Anki note');
      }
    } catch (error) {
      console.error('Anki error:', error);
    }
  };

  const updateWordTag = async ({colorCode, noteId}: UpdateWordTag) => {
    const newTagIdNum = Number(colorCode) + 1;
    if (newTagIdNum > 8) return;
    const newTagId = String(newTagIdNum);
    try {
      Anki.updateNoteTags(noteId, [`Lookups_${newTagId}`]);
      updateTagAction(null, noteId, newTagId);
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
