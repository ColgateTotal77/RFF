import { List, Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useBookStore } from 'stores/useBookStore';
import { Dropdown } from 'components/Dropdown';
import i18n, { changeLanguage } from 'i18n';
import { APP_LANGUAGE_OPTIONS, BOOK_LANGUAGE_OPTIONS } from 'lib/langHelper';

export const MiscTab = () => {
  const {
    settings: { autoCardOnDoubleTap, targetLang },
    updateSettings,
  } = useBookStore();
  const { t } = useTranslation('translation', { keyPrefix: 'miscTab' });

  return (
    <>
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
    </>
  );
};
