import { DropdownMenu } from 'components/ui/DropdownMenu';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useTranslation } from 'react-i18next';
import { toggleTheme } from 'stores/actions';


interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose } = props;
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
    >
      <DropdownMenu.Item
        onPress={() => {
          toggleTheme()
          onClose()
        }}
        title={t('switchTheme')}
      />
    </DropdownMenu>
  );
};
