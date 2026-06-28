import { Text, Switch, List } from 'react-native-paper';
import { Dropdown } from 'components/ui/Dropdown';
import { useTranslation } from 'react-i18next';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { View } from 'react-native';
import { BOOK_LANGUAGE_OPTIONS } from 'lib/langHelper';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useTempStore } from 'stores/useTempStore';
import { useRef, useState } from 'react';
import { Slider } from 'components/ui/Slider';
import { FONT_FAMILY_OPTIONS } from 'lib/constants';

export const MiscTab = () => {
  const {
    settings: { bookLang, targetLang },
  } = useCurrentBook();
  const getBookSettings = useBookStore((state) => state.getBookSettings);
  const { updateBookSettings } = useBookStore();
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const setIsBookSettingsTransparent = useTempStore((state) => state.setIsBookSettingsTransparent);
  const settings = getBookSettings();
  const { t } = useTranslation('translation', { keyPrefix: 'miscTab' });
  const [localFontSize, setLocalFontSize] = useState(settings.font.fontSize);

  const lastUpdateRef = useRef(0);

  return (
    <View className="gap-4 p-4">
      <Text variant="titleMedium" className="font-bold">
        {t('title')}
      </Text>

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

      <List.Item
        title={t('autoCardTitle')}
        description={t('autoCardDescription')}
        right={() => (
          <Switch
            value={settings.autoCardOnDoubleTap}
            onValueChange={(value) => updateBookSettings({ autoCardOnDoubleTap: value })}
          />
        )}
      />

      <Slider
        label={t('fontSizeLabel', { fontSize: localFontSize })}
        minimumValue={10}
        maximumValue={48}
        step={1}
        value={localFontSize}
        onValueChange={(value) => {
          const now = Date.now();
          if (now - lastUpdateRef.current >= 100) {
            executeImmediateActions([{ type: 'updateFont', fontSize: value }]);
            setLocalFontSize(value);
            lastUpdateRef.current = now;
          }
        }}
        onSlidingStart={() => setIsBookSettingsTransparent(true)}
        onSlidingComplete={(value) => {
          updateBookSettings({
            font: { ...settings.font, fontSize: value },
          });
          setLocalFontSize(value);
          executeImmediateActions([{ type: 'updateFont', fontSize: value }]);
          setIsBookSettingsTransparent(false);
        }}
      />

      <Dropdown
        label={t('fontFamilyLabel')}
        value={settings.font.fontFamily}
        options={FONT_FAMILY_OPTIONS}
        onSelect={(value) => {
          updateBookSettings({ font: { ...settings.font, fontFamily: value } });
          executeImmediateActions([{ type: 'updateFont', fontFamily: value }]);
        }}
        onOpen={() => setIsBookSettingsTransparent(true)}
        onClose={() => setIsBookSettingsTransparent(false)}
        closeOnSelect={false}
      />
    </View>
  );
};
