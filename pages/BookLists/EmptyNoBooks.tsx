import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui/Button';
import { useAppStore } from 'stores/useAppStore';

export const EmptyNoBooks = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const pickDocument = useAppStore((state) => state.pickDocument);

  return (
    <View className="flex-1 items-center justify-center gap-6">
      <Text variant="titleLarge">{t('noBooks')}</Text>
      <Button mode="contained" onPress={pickDocument}>
        {t('addBook')}
      </Button>
    </View>
  );
};
