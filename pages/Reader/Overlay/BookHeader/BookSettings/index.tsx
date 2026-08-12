import { useState } from 'react';
import { AnkiTab } from 'pages/Reader/Overlay/BookHeader/BookSettings/tabs/AnkiTab';
import { MiscTab } from 'pages/Reader/Overlay/BookHeader/BookSettings/tabs/MiscTab';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';
import { ScrollViewWithScrollControl } from 'components/ui/ScrollViewWithScrollControl';

type TabKey = 'anki' | 'misc';

export const BookSettings = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('anki');

  return (
    <>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
        buttons={[
          { value: 'anki', label: 'Anki' },
          { value: 'misc', label: 'Misc' },
        ]}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />

      <ScrollViewWithScrollControl>
        {activeTab === 'anki' && <AnkiTab />}
        {activeTab === 'misc' && <MiscTab />}
      </ScrollViewWithScrollControl>
    </>
  );
};
