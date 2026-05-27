import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { MiscTab } from 'pages/Settings/tabs/MiscTab';
import { AnkiTab } from 'pages/Settings/tabs/AnkiTab';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';
import { useTheme } from 'react-native-paper';

type TabKey = 'anki' | 'misc';

export const SettingsScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

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
