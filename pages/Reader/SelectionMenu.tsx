import { Menu, Surface, useTheme, Text, Icon } from 'react-native-paper';
import { View, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWordAction } from 'lib/useWordAction';
import { useTempStore } from 'stores/useTempStore';
import { type SelectionMenu as SelectedMenu } from 'types';
import { useState } from 'react';
import { Button } from 'components/ui/Button';
import { AppbarAction } from 'components/ui/AppbarAction';
import { IconButton } from 'components/ui/IconButton';
interface Props {
  selectionMenu: SelectedMenu;
}

export const SelectionMenu = ({ selectionMenu }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'reader.selectionMenu' });
  const { addNewCard, updateWordTag, copyToClipboard, openSystemTranslator, deleteNote } =
    useWordAction();
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const { width: screenWidth } = Dimensions.get('window');
  const [menuWidth, setMenuWidth] = useState(0);
  const [menuHeight, setMenuHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const onUpdateTagPress = () => {
    if (selectionMenu.colorCode && selectionMenu.colorCode !== '-1') {
      updateWordTag({
        noteIds: selectionMenu.noteIds!,
        colorCode: String(Number(selectionMenu.colorCode) + 1),
      });
    }
    closeMenu();
  };

  const onDecreaseTagPress = () => {
    if (selectionMenu.colorCode && selectionMenu.colorCode !== '-1') {
      updateWordTag({
        noteIds: selectionMenu.noteIds!,
        colorCode: String(Number(selectionMenu.colorCode) - 1),
      });
    }
    closeMenu();
  };

  const theme = useTheme();

  const onAddNewCardPress = () => {
    addNewCard(selectionMenu.text, selectionMenu.sentence);
    closeMenu();
  };

  const onCopy = () => {
    copyToClipboard(selectionMenu.text);
    closeMenu();
  };

  const onDeleteNotePress = () => {
    deleteNote(selectionMenu.noteIds!, selectionMenu.text);
    closeMenu();
  };

  return (
    <Surface
      elevation={1}
      className="absolute z-50 flex-row items-center rounded-lg border"
      style={[
        {
          opacity: menuWidth === 0 ? 0 : 1,
          top:
            selectionMenu.top - menuHeight < 0
              ? selectionMenu.top - menuHeight + 110
              : selectionMenu.top - menuHeight - 5,
          left: Math.max(
            10,
            Math.min(selectionMenu.left - menuWidth / 2, screenWidth - menuWidth - 10)
          ),
        },
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
      onLayout={(e) => {
        const newWidth = Math.round(e.nativeEvent.layout.width);
        const newHeight = Math.round(e.nativeEvent.layout.height);

        if (Math.abs(menuWidth - newWidth) > 1) setMenuWidth(newWidth);
        if (Math.abs(menuHeight - newHeight) > 1) setMenuHeight(newHeight);
      }}>
      <IconButton
        icon="translate"
        onPress={async () => await openSystemTranslator(selectionMenu.text)}
        accessibilityLabel="Translate"
      />

      <View
        style={{
          marginHorizontal: 4,
          height: 24,
          width: 1,
          backgroundColor: theme.colors.outline,
        }}
      />

      <IconButton icon="content-copy" onPress={onCopy} accessibilityLabel="Copy" />

      <View
        style={{
          marginHorizontal: 4,
          height: 24,
          width: 1,
          backgroundColor: theme.colors.outline,
        }}
      />
      {selectionMenu.noteIds ? (
        <Button
          mode="text"
          compact={true}
          contentStyle={{ paddingHorizontal: 4, paddingVertical: 0 }}
          onPress={onUpdateTagPress}>
          <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
            +F
          </Text>
        </Button>
      ) : (
        <IconButton icon="plus-circle" onPress={onAddNewCardPress} accessibilityLabel="Add Anki card" />
      )}

      <View
        style={{
          marginHorizontal: 4,
          height: 24,
          width: 1,
          backgroundColor: theme.colors.outline,
        }}
      />

      <Menu
        visible={isOpen}
        onDismiss={() => setIsOpen(false)}
        anchor={
          <AppbarAction
            icon="dots-vertical"
            iconColor={theme.colors.primary}
            onPress={() => setIsOpen(true)}
            accessibilityLabel="More options"
          />
        }
        anchorPosition={'bottom'}
        contentStyle={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        }}>
        {selectionMenu.noteIds && (
          <>
            <Menu.Item
              onPress={() => onDeleteNotePress()}
              title={t('deleteNote')}
              leadingIcon={({ size }) => (
                <Icon source="delete-outline" size={size} color={theme.colors.primary} />
              )}
            />
            {selectionMenu.colorCode && Number(selectionMenu.colorCode) > 0 && (
              <>
                <View
                  style={{ marginHorizontal: 4, height: 1, backgroundColor: theme.colors.outline }}
                />
                <Menu.Item
                  onPress={() => onDecreaseTagPress()}
                  title={t('decreaseTag')}
                  leadingIcon={() => (
                    <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                      -F
                    </Text>
                  )}
                />
              </>
            )}
          </>
        )}
      </Menu>
    </Surface>
  );
};
