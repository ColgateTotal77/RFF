import { List, Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'components/ui/Dropdown';
import i18n, { changeLanguage } from 'i18n';
import { APP_LANGUAGE_OPTIONS, BOOK_LANGUAGE_OPTIONS } from 'lib/langHelper';
import { View } from 'react-native';
import { useAppStore } from 'stores/useAppStore';

export const MiscTab = () => {
  const autoCardOnDoubleTap = useAppStore((state) => state.settings.autoCardOnDoubleTap);
  const targetLang = useAppStore((state) => state.settings.targetLang);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  const { t } = useTranslation('translation', { keyPrefix: 'miscTab' });

  return (
    <View className="gap-4 p-4">
      <Text variant="titleMedium" className="font-bold">
        {t('title')}
      </Text>

      <Dropdown
        label={t('defaultTargetLanguageLabel')}
        value={targetLang}
        options={BOOK_LANGUAGE_OPTIONS}
        onSelect={(value) => updateSettings({ targetLang: value })}
      />

      <Dropdown
        label={t('appLanguageLabel')}
        value={i18n.language}
        options={APP_LANGUAGE_OPTIONS}
        onSelect={(value) => changeLanguage(value)}
      />

      <List.Item
        title={t('autoCardTitle')}
        description={t('autoCardDescription')}
        right={() => (
          <Switch
            value={autoCardOnDoubleTap}
            onValueChange={(value) => updateSettings({ autoCardOnDoubleTap: value })}
          />
        )}
      />

      <List.Item
        title={t('themeTitle')}
        description={t('themeDescription')}
        right={() => <Switch value={theme === 'dark'} onValueChange={() => toggleTheme()} />}
      />
    </View>
  );
};
