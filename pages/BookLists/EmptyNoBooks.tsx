import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/ui/Button';
import { useAppStore } from 'stores/useAppStore';

export const EmptyNoBooks = () => {
  const theme = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const pickDocument = useAppStore((state) => state.pickDocument);

  return (
    <View
      className="flex-1 items-center justify-center gap-6 px-8"
      style={{ backgroundColor: theme.colors.background }}>
      <Text
        className="text-center text-xl font-semibold"
        style={{ color: theme.colors.onBackground }}>
        {t('noBooks')}
      </Text>
      <Button mode="contained" onPress={pickDocument}>
        {t('addBook')}
      </Button>
    </View>
  );
};
