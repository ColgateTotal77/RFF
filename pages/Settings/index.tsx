import { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { MiscTab } from 'pages/Settings/tabs/MiscTab';
import { AnkiTab } from 'pages/Settings/tabs/AnkiTab';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';
import { useTheme } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { useFocusEffect } from '@react-navigation/native';

type TabKey = 'anki' | 'misc';

export const SettingsScreen = () => {
  const theme = useTheme();
  const currentCTree = useBookStore((state) => state.currentCTree);
  const lastOpenedBook = useBookStore((state) => state.books?.[0]);
  const settings = useBookStore((state) => state.settings);
  const closeBook = useBookStore((state) => state.closeBook);
  const openBook = useBookStore((state) => state.openBook);
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

  const latestStateRef = useRef({ book: lastOpenedBook, currentCTree, settings });
  useEffect(() => {
    latestStateRef.current = { book: lastOpenedBook, currentCTree, settings };
  }, [lastOpenedBook, currentCTree, settings]);
  useFocusEffect(
    useCallback(() => {
      console.log('SettingsScreen focused');
      return () => {
        console.log('SettingsScreen blurred (navigated away)');

        const {
          book,
          currentCTree: latestCTree,
          settings: latestSettings,
        } = latestStateRef.current;

        if (book && latestCTree?.deckId !== latestSettings.ankiDeckId) {
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
