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
  const { t } = useTranslation('translation', {keyPrefix: 'common'});

  return (
    <DropdownMenu
      visible={isOpen}
      onDismiss={onClose}
      anchor={
        <AppbarAction
          icon="dots-vertical"
          onPress={onOpen}
          accessibilityLabel={t('moreOptions')}
        />
      }
      elevation={1}>
      <DropdownMenu.Item
        onPress={() => {
          onClose()
          toggleTheme()
        }}
        title={t('switchTheme')}
      />
      <DropdownMenu.Item
        onPress={() => {
          onClose()
          onBookSettingsOpen();
        }}
        title={t('settings', { keyPrefix: 'bookHeader.other' })}
      />
    </DropdownMenu>
  );
};
