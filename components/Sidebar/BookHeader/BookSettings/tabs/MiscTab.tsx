import { Text, Switch, List } from 'react-native-paper';
import { Dropdown } from 'components/ui/Dropdown';
import { useTranslation } from 'react-i18next';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { View } from 'react-native';
import { BOOK_LANGUAGE_OPTIONS } from 'lib/langHelper';

export const MiscTab = () => {
  const {
    settings: { autoCardOnDoubleTap, bookLang, targetLang },
  } = useCurrentBook();
  const { t } = useTranslation('translation', { keyPrefix: 'miscTab' });
  const { updateBookSettings } = useBookStore();

  return (
    <View className="gap-4 p-4">
      <Text variant="titleMedium" className="font-bold">
        {t('title')}
      </Text>

      <View className="flex gap-4">
        <Dropdown
          label={t('bookLanguageLabel')}
          value={bookLang}
          options={BOOK_LANGUAGE_OPTIONS}
          onSelect={(value) => updateBookSettings({ bookLang: value })}
        />
        <Dropdown
          label={t('targetLanguageLabel')}
          value={targetLang}
          options={BOOK_LANGUAGE_OPTIONS}
          onSelect={(value) => updateBookSettings({ targetLang: value })}
        />
      </View>

      <List.Item
        title={t('autoCardTitle')}
        description={t('autoCardDescription')}
        right={() => (
          <Switch
            value={autoCardOnDoubleTap}
            onValueChange={(value) => updateBookSettings({ autoCardOnDoubleTap: value })}
          />
        )}
      />
    </View>
  );
};
