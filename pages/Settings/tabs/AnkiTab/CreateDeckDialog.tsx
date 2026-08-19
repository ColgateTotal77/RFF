import { useState } from 'react';
import { Dialog, Portal, TextInput, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui/Button';
import { useAnkiStore } from 'stores/useAnkiStore';

const defaultDeckName = (decks: { id: string; name: string }[]) => {
  if (decks.length > 0) return '';
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `My first deck - ${date}`;
};

const isDuplicate = (decks: { id: string; name: string }[], name: string) => {
  const trimmed = name.trim();
  return decks.some((deck) => deck.name === trimmed);
};

type Props = {
  isOpen: boolean;
  onConfirm: (deckName: string) => Promise<void>;
  onClose: () => void;
};

export const CreateDeckDialog = ({ isOpen, onConfirm, onClose }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'ankiTab.createDeck' });
  const decks = useAnkiStore((state) => state.decks);
  const [name, setName] = useState(defaultDeckName(decks));
  const [creating, setCreating] = useState(false);
  const trimmed = name.trim();

  const error =
    trimmed.length === 0 ? t('errorEmpty') : isDuplicate(decks, name) ? t('errorDuplicate') : null;

  const handleConfirm = async () => {
    if (error) return;
    setCreating(true);
    try {
      await onConfirm(trimmed);
      setName(defaultDeckName(decks));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose}>
        <Dialog.Title>{t('title')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label={t('label')}
            value={name}
            onChangeText={setName}
            autoFocus
            error={trimmed.length > 0 && Boolean(error)}
          />
          {trimmed.length > 0 && Boolean(error) && <HelperText type="error">{error}</HelperText>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>{t('cancel', { keyPrefix: 'common' })}</Button>
          <Button onPress={handleConfirm} disabled={!!error || creating} loading={creating}>
            {t('create', { keyPrefix: 'common' })}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
