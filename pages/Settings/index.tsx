import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { MiscTab } from 'pages/Settings/tabs/MiscTab';
import { AnkiTab } from 'pages/Settings/tabs/AnkiTab';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';
import { useTheme } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useFocusEffect } from '@react-navigation/native';
import { openBook } from 'stores/actions';
import { ScrollViewWithScrollControl } from 'components/ui/ScrollViewWithScrollControl';
import { useTranslation } from 'react-i18next';

type TabKey = 'anki' | 'misc';

export const SettingsScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'settings' });
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

  useFocusEffect(
    useCallback(() => {
      console.log('SettingsScreen focused');
      return () => {
        console.log('SettingsScreen blurred (navigated away)');
        const { currentBook, isAnkiConfigStale } = useBookStore.getState();

        if (!currentBook) return;
        if (!isAnkiConfigStale(currentBook)) return;

        const basePath = currentBook.basePath;
        openBook(basePath);
      };
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        buttons={[
          { value: 'anki', label: t('tabAnki') },
          { value: 'misc', label: t('tabMisc') },
        ]}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />

      <ScrollViewWithScrollControl>
        {activeTab === 'anki' && <AnkiTab />}
        {activeTab === 'misc' && <MiscTab />}
      </ScrollViewWithScrollControl>
    </View>
  );
};
