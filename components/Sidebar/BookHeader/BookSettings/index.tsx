import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { AnkiTab } from 'components/Sidebar/BookHeader/BookSettings/tabs/AnkiTab';
import { MiscTab } from 'components/Sidebar/BookHeader/BookSettings/tabs/MiscTab';


type TabKey = 'anki' | 'misc';

export const BookSettings = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

  return (
    <View className="flex-1 bg-white dark:bg-[#1e1e1e]">
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        buttons={[
          { value: 'anki', label: 'Anki' },
          { value: 'misc', label: 'Misc' },
        ]}
        style={{ margin: 16 }}
      />

      <ScrollView className="flex-1">
        <View className="gap-4 p-4">
          {activeTab === 'anki' && <AnkiTab />}
          {activeTab === 'misc' && <MiscTab />}
        </View>
      </ScrollView>
    </View>
  );
};
