import { DefaultTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';
import { BookEngine } from 'modules/book-engine';
import { useEffect } from 'react';
import { useBookStore } from 'stores/useBookStore';
import { useAppStore } from 'stores/useAppStore';

import './global.css';
import { useAnkiStore } from 'stores/useAnkiStore';

function AppContent() {
  return <Sidebar />;
}

export default function App() {
  const books = useBookStore((state) => state.books);
  const isDarkMode = useAppStore((state) => state.theme === 'dark');
  const openBook = useBookStore((state) => state.openBook);
  const checkAnkiPermission = useAnkiStore((state) => state.checkPermission);

  useEffect(() => {
    const runSync = async () => {
      try {
        await BookEngine.onAppInit();
        const basePath = books[0]?.basePath;
        if (basePath) openBook(basePath);
      } catch (e) {
        console.error('onAppInit failed:', e);
      }
    };

    runSync();
    checkAnkiPermission();
  }, []);


  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PaperProvider theme={isDarkMode ? MD3DarkTheme : DefaultTheme}>
          <AppContent />
        </PaperProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
