import { Modal, View } from 'react-native';
import { useState } from 'react';
import { Appbar, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MenuChapters } from './MenuChapters';
import { MenuBookmarks } from './MenuBookmarks';

type TabKey = 'chapters' | 'bookmarks';

const BookHeaderNavigation = ({
  onClose,
  isOpen,
  bookTitle,
}: {
  onClose: () => void;
  isOpen: boolean;
  bookTitle: string;
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('chapters');
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.navigation' });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <Appbar.Header
        className="bg-white"
        style={{
          height: 'auto',
          flexDirection: 'column',
          alignItems: 'stretch',
          paddingBottom: 12,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <Appbar.Action icon="close" onPress={onClose} />
          <Appbar.Content title={bookTitle} titleStyle={{ fontWeight: 'bold', fontSize: 16 }} />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabKey)}
            buttons={[
              { value: 'chapters', label: t('chapters') },
              { value: 'bookmarks', label: t('bookmarks') },
            ]}
          />
        </View>
      </Appbar.Header>

      <View className="flex-1">
        <View className={activeTab === 'chapters' ? 'flex-1' : 'hidden'}>
          <MenuChapters onClose={onClose} />
        </View>
        <View className={activeTab === 'bookmarks' ? 'flex-1' : 'hidden'}>
          <MenuBookmarks onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default BookHeaderNavigation;
