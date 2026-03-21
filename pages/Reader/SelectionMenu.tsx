import { Button, Surface } from 'react-native-paper';
import { View } from 'react-native';
import { Anki, BookEngine } from 'modules/book-engine';
import React from 'react';
import { useWordAction } from 'hooks/useWordAction';

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
  const { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator } = useWordAction();

  const onUpdateTagPress = () => {
    updateWordTag({
      noteId: selectionMenu.noteId!,
      colorCode: selectionMenu.colorCode!,
      onUpdateTag
    });
    closeMenu();
  };

  const onAddNewCardPress = () => {
    addNewCard({
      text: selectionMenu.text,
      onUpdateTag
    });
    closeMenu();
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
        onPress={async () => await openSystemTranslator(selectionMenu.text)}
      >
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
          copyToClipboard(selectionMenu.text);
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
          onPress={onUpdateTagPress}
        >
          +F
        </Button>
      ) : (
        <Button
          mode="text"
          textColor="white"
          compact={true}
          className="px-1"
          style={{ borderRadius: 0 }}
          onPress={onAddNewCardPress}
        >
          Anki
        </Button>
      )}
    </Surface>
  );
};
