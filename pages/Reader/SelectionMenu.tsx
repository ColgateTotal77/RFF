import { Button, Surface } from 'react-native-paper';
import { View } from 'react-native';
import { Anki, BookEngine } from 'modules/book-engine';
import { fetchWordMetadata } from 'lib/supabaseRequests';
import React from 'react';
import { useBookStore } from 'stores/useBookStore';

export type SelectedMenu = {
  visible: boolean;
  text: string;
  top: number;
  left: number;
  noteId?: string;
  colorCode?: string;
};
interface Props {
  selectionMenu: SelectedMenu;
  closeMenu: () => void;
  onUpdateTag: (word: string | null, noteId: string, colorCode: string) => void;
}

export const SelectionMenu = ({ selectionMenu, closeMenu, onUpdateTag }: Props) => {
  const { currentBook, settings } = useBookStore();
  const deckId = currentBook?.settings?.ankiDeckId || settings.defaultBookSettings.ankiDeckId;
  const modelId = currentBook?.settings?.ankiModelId || settings.defaultBookSettings.ankiModelId;

  const onUpdateTagPress = async () => {
    const newTagIdNum = Number(selectionMenu.colorCode) + 1;
    if (newTagIdNum > 8) return;
    const newTagId = String(newTagIdNum);
    try {
      Anki.updateNoteTags(selectionMenu.noteId, [`Lookups_${newTagId}`]);
      onUpdateTag(null, selectionMenu.noteId!, newTagId);
    } catch (error) {
      console.error('Anki error:', error);
    } finally {
      closeMenu();
    }
  };

  const onAddNewCardPress = async () => {
    try {
      if (!modelId || !deckId) {
        console.error('Missing Anki configuration');
        return;
      }

      const metadata = await fetchWordMetadata(selectionMenu.text, 'en', 'ru');

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
        onUpdateTag(selectionMenu.text, noteId, "1");
      } else {
        console.error('Failed to create Anki note');
      }
    } catch (error) {
      console.error('Anki error:', error);
    } finally {
      closeMenu();
    }
  };

  return (
    <Surface
      elevation={1}
      className="absolute z-50 flex-row items-center rounded-lg bg-gray-800 px-2 py-2 shadow-md"
      style={{
        top: Math.max(10, selectionMenu.top - 60),
        left: Math.max(10, Math.min(selectionMenu.left - 75, 200)),
      }}>
      <Button
        mode="text"
        textColor="white"
        compact={true}
        className="px-1"
        style={{ borderRadius: 0 }}
        onPress={async () => {
          console.log('Translating:', selectionMenu.text);
          try {
            await BookEngine.openSystemTranslator(selectionMenu.text);
          } catch (error) {
            console.error('Translation error:', error);
          } finally {
            closeMenu();
          }
        }}>
        Translate
      </Button>

      <View className="mx-1 h-6 w-[1px] bg-gray-500" />

      <Button
        mode="text"
        textColor="white"
        compact={true}
        className="px-1"
        style={{ borderRadius: 0 }}
        onPress={() => {
          console.log('Copy:', selectionMenu.text);
          closeMenu();
        }}>
        Copy
      </Button>

      <View className="mx-1 h-6 w-[1px] bg-gray-500" />
      {selectionMenu.noteId ? (
        <Button
          mode="text"
          textColor="white"
          compact={true}
          className="px-1"
          style={{ borderRadius: 0 }}
          onPress={onUpdateTagPress}>
          +F
        </Button>
      ) : (
        <Button
          mode="text"
          textColor="white"
          compact={true}
          className="px-1"
          style={{ borderRadius: 0 }}
          onPress={onAddNewCardPress}>
          Anki
        </Button>
      )}
    </Surface>
  );
};

const formatExamples = (examples: string[]) => {
  return examples.map((example, index) => `${index + 1}) ${example}`).join('<br>');
};
