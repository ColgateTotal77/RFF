import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';
import { BookEngine } from 'modules/book-engine';
import { useEffect } from 'react';
import { useBookStore } from 'stores/useBookStore';

import './global.css';

function AppContent() {
  return <Sidebar />;
}

export default function App() {
  const books = useBookStore((state) => state.books);
  const settings = useBookStore((state) => state.settings);
  const setCurrentCTree = useBookStore((state) => state.setCurrentCTree);

  const deckId = books[0]?.settings?.ankiDeckId || settings.ankiDeckId;

  useEffect(() => {
    const runSync = async () => {
      try {
        console.log("Starting background dictionary sync...");
        if(!deckId) return;

        const mapping = books[0].settings.fieldMapping || settings.fieldMapping || {};
        const mirroredMapping =
          books[0].settings.mirroredFieldMapping || settings.mirroredFieldMapping || {};

        setCurrentCTree({langCode: 'en', deckId});

        BookEngine.onAppInit('en', deckId, mapping, mirroredMapping);
      } catch (error) {
        console.error("Failed to sync dictionary:", error);
      }
    };

    runSync();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PaperProvider>
          <AppContent />
        </PaperProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
