import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export const EmptyNoSearchResults = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });

  return (
    <View className="flex-1 items-center justify-center">
      <Text variant="titleLarge">{t('noSearchResults')}</Text>
    </View>
  );
};
