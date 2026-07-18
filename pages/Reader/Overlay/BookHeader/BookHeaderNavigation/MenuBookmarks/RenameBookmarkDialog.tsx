import { useEffect, useState } from 'react';
import { Dialog, Portal, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui/Button';

type Props = {
  isOpen: boolean;
  initialTitle: string;
  onConfirm: (title: string) => void;
  onClose: () => void;
};

export const RenameBookmarkDialog = ({ isOpen, initialTitle, onConfirm, onClose }: Props) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'bookHeader.navigation.renameBookmark',
  });
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (isOpen) setTitle(initialTitle);
  }, [isOpen, initialTitle]);

  const trimmed = title.trim();

  const handleConfirm = () => {
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Content>
          <TextInput label={t('label')} value={title} onChangeText={setTitle} autoFocus />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>{t('cancel', { keyPrefix: 'common' })}</Button>
          <Button onPress={handleConfirm} disabled={!trimmed}>
            {t('save', { keyPrefix: 'common' })}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
