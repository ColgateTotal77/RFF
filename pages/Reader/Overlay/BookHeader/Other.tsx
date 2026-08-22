import { DropdownMenu } from 'components/ui/DropdownMenu';
import { useTranslation } from 'react-i18next';
import { AppbarAction } from 'components/ui/AppbarAction';
import { toggleTheme } from 'stores/actions';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBookSettingsOpen: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose, onBookSettingsOpen } = props;
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.other' });

  return (
    <DropdownMenu
      visible={isOpen}
      onDismiss={onClose}
      anchor={
        <AppbarAction
          icon="dots-vertical"
          onPress={onOpen}
          accessibilityLabel={t('moreOptions', { keyPrefix: 'common' })}
        />
      }
      elevation={1}>
      <DropdownMenu.Item onPress={() => toggleTheme()} title={t('switchTheme')} />
      <DropdownMenu.Item
        onPress={() => {
          onBookSettingsOpen();
          onClose();
        }}
        title={t('settings')}
      />
    </DropdownMenu>
  );
};
