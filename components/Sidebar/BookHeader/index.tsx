import { Appbar } from 'react-native-paper';
import { Other } from 'components/Sidebar/BookHeader/Other';
import { MenuChapters } from 'components/Sidebar/BookHeader/MenuChapters';
import { useBookStore } from 'stores/useBookStore';
import { useState } from 'react';
import { View, Modal } from 'react-native';

export const BookHeader = () => {
  const { currentBook } = useBookStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChaptersMenuOpen, setIsChaptersMenuOpen] = useState(false);

  return (
    <>
      <Appbar.Header className="bg-white">
        <Appbar.Content title={currentBook?.title} />
        <Appbar.Action icon="magnify" onPress={() => {}} />

        <Other
          isOpen={isMenuOpen}
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
        />

        <Appbar.Action icon="format-list-bulleted" onPress={() => setIsChaptersMenuOpen(true)} />
      </Appbar.Header>
      <Modal
        visible={isChaptersMenuOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsChaptersMenuOpen(false)}>
        <View className="flex-1 bg-white">
          <Appbar.Header className="bg-white">
            <Appbar.Action icon="close" onPress={() => setIsChaptersMenuOpen(false)} />
            <Appbar.Content title="Chapters" />
          </Appbar.Header>
          <MenuChapters onClose={() => setIsChaptersMenuOpen(false)} />
        </View>
      </Modal>
    </>
  );
};
