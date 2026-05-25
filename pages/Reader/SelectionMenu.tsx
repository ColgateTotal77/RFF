import { Button, Surface } from 'react-native-paper';
import { View, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWordAction } from 'lib/useWordAction';
import { useTempStore } from 'stores/useTempStore';
import { type SelectionMenu as SelectedMenu } from 'types';
import { useState } from 'react';

interface Props {
  selectionMenu: SelectedMenu;
}

export const SelectionMenu = ({ selectionMenu }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'reader.selectionMenu' });
  const { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator } = useWordAction();
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const { width: screenWidth } = Dimensions.get('window');
  const [menuWidth, setMenuWidth] = useState(0);
  const [menuHeight, setMenuHeight] = useState(0);

  const onUpdateTagPress = () => {
    updateWordTag({
      noteIds: selectionMenu.noteIds!,
      colorCode: selectionMenu.colorCode!,
    });
    closeMenu();
  };

  const onAddNewCardPress = () => {
    addNewCard(selectionMenu.text);
    closeMenu();
  };

  const onCopy = () => {
    copyToClipboard(selectionMenu.text);
    closeMenu();
  };

  return (
    <Surface
      elevation={1}
      className="absolute z-50 flex-row items-center rounded-lg border border-gray-500 bg-gray-800 px-2 py-2"
      style={{
        opacity: menuWidth === 0 ? 0 : 1,
        top:
          selectionMenu.top - menuHeight < 0
            ? selectionMenu.top - menuHeight + 110
            : selectionMenu.top - menuHeight - 5,
        left: Math.max(
          10,
          Math.min(selectionMenu.left - menuWidth / 2, screenWidth - menuWidth - 10)
        ),
      }}
      onLayout={(e) => {
        const newWidth = Math.round(e.nativeEvent.layout.width);
        const newHeight = Math.round(e.nativeEvent.layout.height);

        if (Math.abs(menuWidth - newWidth) > 1) setMenuWidth(newWidth);
        if (Math.abs(menuHeight - newHeight) > 1) setMenuHeight(newHeight);
      }}>
      <Button
        mode="text"
        textColor="white"
        icon="translate"
        compact={true}
        className="px-1"
        style={{ borderRadius: 0 }}
        onPress={async () => await openSystemTranslator(selectionMenu.text)}>
        {t('translate')}
      </Button>

      <View className="mx-1 h-6 w-[1px] bg-gray-500" />

      <Button
        mode="text"
        textColor="white"
        icon="content-copy"
        compact={true}
        className="px-1"
        style={{ borderRadius: 0 }}
        onPress={onCopy}>
        {t('copy')}
      </Button>

      <View className="mx-1 h-6 w-[1px] bg-gray-500" />
      {selectionMenu.noteIds ? (
        <Button
          mode="text"
          textColor="white"
          icon="tag-plus"
          compact={true}
          className="px-1"
          style={{ borderRadius: 0 }}
          onPress={onUpdateTagPress}>
        {t('updateTag')}
        </Button>
      ) : (
        <Button
          mode="text"
          textColor="white"
          icon="plus-circle"
          compact={true}
          className="px-1"
          style={{ borderRadius: 0 }}
          onPress={onAddNewCardPress}>
        {t('anki')}
        </Button>
      )}
    </Surface>
  );
};
