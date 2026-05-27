import { Divider, Menu } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useTranslation } from 'react-i18next';
import { useWebViewStore } from 'stores/useWebViewStore';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useAppStore } from 'stores/useAppStore';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBookSettingsOpen: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose, onBookSettingsOpen } = props;
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.other' });
  const addBookmark = useBookStore((state) => state.addBookmark);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <Menu
      visible={isOpen}
      onDismiss={onClose}
      anchor={<AppbarAction icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item onPress={() => toggleTheme()} title={t('switchTheme')} />
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
