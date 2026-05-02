import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';
import { BookEngine } from 'modules/book-engine';
import { useEffect } from 'react';
import { useBookStore } from 'stores/useBookStore';

import './global.css';
import { deepMerge } from 'lib/utils';

function AppContent() {
  return <Sidebar />;
}

export default function App() {
  const books = useBookStore((state) => state.books);
  const settings = useBookStore((state) => state.settings);
  const setCurrentCTree = useBookStore((state) => state.setCurrentCTree);

  const deckId = books[0]?.settings?.ankiDeckId || settings.ankiDeckId;
  const modelId = books[0]?.settings?.ankiModelId || settings.ankiModelId;
  const mirroredModelId = books[0]?.settings?.mirroredAnkiModelId || settings.mirroredAnkiModelId;

  useEffect(() => {
    const runSync = async () => {
      try {
        console.log("Starting background dictionary sync...");
        if(!deckId) return;

        const key = `${deckId}:${modelId}`;
        const mirroredKey = `${deckId}:${mirroredModelId}`;

        const mapping = deepMerge(
          settings.fieldMappings?.[key] || {},
          books[0].settings.fieldMapping || {}
        );
        const mirroredMapping = deepMerge(
          settings.mirroredFieldMappings?.[mirroredKey] || {},
          books[0].settings.mirroredFieldMapping || {}
        );

        console.log(JSON.stringify(mapping, null, 2))
        console.log(JSON.stringify(mirroredMapping, null, 2));
        const bookLang = books[0]?.settings?.bookLang || 'en';
        setCurrentCTree({langCode: bookLang, deckId});

        BookEngine.onAppInit(bookLang, deckId, mapping, mirroredMapping);
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
