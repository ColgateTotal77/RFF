import { Modal, View } from 'react-native';
import { useState } from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MenuChapters } from './MenuChapters';
import { MenuBookmarks } from './MenuBookmarks';
import { AppbarAction } from 'components/ui/AppbarAction';
import { SegmentedButtons } from 'components/ui/SegmentedButtons';

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
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('chapters');
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.navigation' });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header>
          <AppbarAction icon="close" onPress={onClose} />
          <Appbar.Content title={bookTitle} titleStyle={{ fontWeight: 'bold', fontSize: 16 }} />
        </Appbar.Header>

        <View style={{ flex: 1, gap: 16 }}>
          <View style={{ marginHorizontal: 16 }}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabKey)}
              buttons={[
                { value: 'chapters', label: t('chapters') },
                { value: 'bookmarks', label: t('bookmarks') },
              ]}
            />
          </View>

          <View className={`flex-1 ${activeTab === 'chapters' ? 'block' : 'hidden'}`}>
            <MenuChapters onClose={onClose} />
          </View>
          <View className={`flex-1 ${activeTab === 'bookmarks' ? 'block' : 'hidden'}`}>
            <MenuBookmarks onClose={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BookHeaderNavigation;
