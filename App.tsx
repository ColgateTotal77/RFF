import { DefaultTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from 'lib/navigation';
import { BookEngine } from 'modules/book-engine';
import { useEffect, useRef } from 'react';
import { useAppStore } from 'stores/useAppStore';

import './global.css';
import { useAnkiStore } from 'stores/useAnkiStore';
import { AppToast } from 'components/ui/Toast';
import { GlobalLoading } from 'components/ui/GlobalLoading';
import { useOpenFileIntent } from 'lib/hooks/useOpenFileIntent';
import { AppState } from 'react-native';

function AppContent() {
  useOpenFileIntent();

  return (
    <>
      <Sidebar />
      <AppToast />
    </>
  );
}

export default function App() {
  const isDarkMode = useAppStore((state) => state.theme === 'dark');
  const checkAnkiPermission = useAnkiStore((state) => state.checkPermission);
  const checkIsAnkiInstalled = useAnkiStore((state) => state.checkIsAnkiInstalled);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    try {
      BookEngine.onAppInit();
    } catch (e) {
      console.error('onAppInit failed:', e);
    }

    checkAnkiPermission();
    checkIsAnkiInstalled();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkAnkiPermission();
        checkIsAnkiInstalled();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [checkAnkiPermission, checkIsAnkiInstalled]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <PaperProvider theme={isDarkMode ? MD3DarkTheme : DefaultTheme}>
          <AppContent />
          <GlobalLoading />
        </PaperProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
