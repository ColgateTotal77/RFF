import { Modal, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Appbar, Portal, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MenuChapters } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuChapters';
import { MenuBookmarks } from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation/MenuBookmarks';
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
  const { bottom } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('chapters');
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader.navigation' });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <Portal.Host>
        <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingBottom: bottom }}>
          <Appbar.Header style={{ marginLeft: 4 }}>
            <AppbarAction
              icon="arrow-left"
              onPress={onClose}
              accessibilityLabel={t('close', { keyPrefix: 'common' })}
            />
            <Appbar.Content title={bookTitle} />
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

            <View className="flex-1">
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: activeTab === 'chapters' ? 1 : 0,
                    pointerEvents: activeTab === 'chapters' ? 'auto' : 'none',
                  },
                ]}>
                <MenuChapters onClose={onClose} />
              </View>
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: activeTab === 'bookmarks' ? 1 : 0,
                    pointerEvents: activeTab === 'bookmarks' ? 'auto' : 'none',
                  },
                ]}>
                <MenuBookmarks onClose={onClose} />
              </View>
            </View>
          </View>
        </View>
      </Portal.Host>
    </Modal>
  );
};

export default BookHeaderNavigation;
