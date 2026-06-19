import { View, Text, Linking } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from 'types';
import { useBookStore } from 'stores/useBookStore';
import { Button } from 'components/ui/Button';

export const EmptyNoBooks = () => {
  const theme = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const loadBook = useBookStore((state) => state.loadBook);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/epub+zip',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      await loadBook(result.assets[0].uri);
      navigation.navigate('Reader');
    }
  };

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
