import { Appbar, Divider, Menu } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useTranslation } from 'react-i18next';
import { useWebViewStore } from 'stores/useWebViewStore';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBookSettingsOpen: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose, onBookSettingsOpen } = props;
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.other' });
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
        title={t('switchTheme')}
      />
      <Divider />

      <Menu.Item
        onPress={() => {
          addBookmark();
          onClose();
        }}
        title={t('addBookmark')}
      />
      <Divider />
      <Menu.Item onPress={() => onBookSettingsOpen()} title={t('settings')} />
    </Menu>
  );
};
