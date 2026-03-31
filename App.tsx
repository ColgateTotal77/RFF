import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';
import { BookEngine } from 'modules/book-engine';

import './global.css';
import { useEffect } from 'react';
import { useBookStore } from 'stores/useBookStore';

function AppContent() {
  return <Sidebar />;
}

export default function App() {
  const {books, settings, setCurrentCTree} = useBookStore()
  const deckId = books[0]?.settings?.ankiDeckId || settings.defaultBookSettings.ankiDeckId;

  useEffect(() => {
    const runSync = async () => {
      try {
        console.log("Starting background dictionary sync...");
        if(!deckId) return;
        setCurrentCTree({langCode: 'en', deckId});
        BookEngine.onAppInit('en', deckId);
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
