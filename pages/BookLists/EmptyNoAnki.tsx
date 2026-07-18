import { View, Linking } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from 'types';
import { Button } from 'components/ui/Button';
import { useTranslation } from 'react-i18next';

export const EmptyNoAnki = () => {
  const theme = useTheme();
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });

  return (
    <View
      className="flex-1 items-center justify-center gap-6 px-8"
      style={{ backgroundColor: theme.colors.background }}>
      <View className="items-center justify-center gap-3">
        <Text variant="titleLarge">{t('setupAnkiTitle')}</Text>
        <Text variant="bodyMedium">{t('setupAnkiBody')}</Text>
      </View>
      <View className="w-full gap-3">
        <Button
          mode="contained"
          onPress={() => Linking.openURL('market://details?id=com.ichi2.anki')}>
          {t('installAnki')}
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Settings')}>
          {t('goToSettings')}
        </Button>
      </View>
    </View>
  );
};
