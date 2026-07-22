import { useState, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { MiscTab } from 'pages/Settings/tabs/MiscTab';
import { AnkiTab } from 'pages/Settings/tabs/AnkiTab';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';
import { useTheme } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useFocusEffect } from '@react-navigation/native';
import { openBook } from 'stores/actions';

type TabKey = 'anki' | 'misc';

export const SettingsScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

  useFocusEffect(
    useCallback(() => {
      console.log('SettingsScreen focused');
      return () => {
        console.log('SettingsScreen blurred (navigated away)');

        const { books, closeBook, isAnkiConfigStale } = useBookStore.getState();
        const book = books?.[0];

        if (book && isAnkiConfigStale(book)) {
          const basePath = book.basePath;
          closeBook();
          setTimeout(() => {
            openBook(basePath);
          }, 0);
        }
      };
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        buttons={[
          { value: 'anki', label: 'Anki' },
          { value: 'misc', label: 'Misc' },
        ]}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />

      <ScrollView>
        {activeTab === 'anki' && <AnkiTab />}
        {activeTab === 'misc' && <MiscTab />}
      </ScrollView>
    </View>
  );
};
