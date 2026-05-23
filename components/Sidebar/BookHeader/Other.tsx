import { Appbar, Divider, Menu } from 'react-native-paper';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { useMemo } from 'react';
import { useWebViewStore } from 'stores/useWebViewStore';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBookSettingsOpen: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose, onBookSettingsOpen } = props;
  const settings = useBookStore((state) => state.settings);
  const addBookmark = useBookStore((state) => state.addBookmark);
  const executeImmediateAction = useWebViewStore((state) => state.executeImmediateAction);
  const updateSettings = useBookStore((state) => state.updateSettings);

  return (
    <Menu
      visible={isOpen}
      onDismiss={onClose}
      anchor={<Appbar.Action icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item
        onPress={() => {
          updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
          executeImmediateAction({
            type: 'setTheme',
            theme: settings.theme === 'dark' ? 'light' : 'dark',
          });
        }}
        title="Switch Theme"
      />
      <Divider />

      <Menu.Item
        onPress={() => {
          addBookmark();
          onClose();
        }}
        title="Add Bookmark"
      />
      <Divider />
      <Menu.Item onPress={() => onBookSettingsOpen()} title="Settings" />
    </Menu>
  );
};
