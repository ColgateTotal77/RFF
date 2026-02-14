import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sidebar } from 'components/Sidebar';
import { NavigationContainer } from '@react-navigation/native';

import './global.css';

function AppContent() {
  return <Sidebar />;
}

export default function App() {
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
