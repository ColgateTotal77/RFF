import { Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui/Button';

type Props = {
  isOpen: boolean;
  bookTitle: string;
  onConfirm: () => void;
  onClose: () => void;
};

export const DeleteBookDialog = ({ isOpen, bookTitle, onConfirm, onClose }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists.deleteDialog' });
  const theme = useTheme();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{t('message', { title: bookTitle })}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>{t('cancel', { keyPrefix: 'common' })}</Button>
          <Button onPress={handleConfirm} textColor={theme.colors.error}>
            {t('delete', { keyPrefix: 'common' })}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
