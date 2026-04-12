import { Appbar, TextInput } from 'react-native-paper';
import { Other } from 'components/Sidebar/BookHeader/Other';
import { MenuChapters } from 'components/Sidebar/BookHeader/MenuChapters';
import { useCurrentBook } from 'stores/useBookStore';
import { useState } from 'react';
import { View, Modal } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { BookEngine } from 'modules/book-engine';
import { SearchResult } from 'types';
import { MenuSearch } from 'components/Sidebar/BookHeader/MenuSearch';

export const BookHeader = () => {
  const searchQuery = useTempStore((state) => state.searchQuery);
  const setSearchQuery = useTempStore((state) => state.setSearchQuery);
  const toggleIsSearchModuleOpen = useTempStore((state) => state.toggleIsSearchModuleOpen);
  const setSearchResults = useTempStore((state) => state.setSearchResults);
  const isSearchModuleOpen = useTempStore((state) => state.isSearchModuleOpen);
  const currentBook = useCurrentBook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChaptersMenuOpen, setIsChaptersMenuOpen] = useState(false);

  const onSearchSubmit = async () => {
    const results: SearchResult[] = await BookEngine.searchInBook(searchQuery, currentBook.basePath);
    setSearchResults(results);
  };

  return (
    <>
      <Appbar.Header className="bg-white">
        <Appbar.Content title={currentBook?.title} />
        <Appbar.Action icon="magnify" onPress={toggleIsSearchModuleOpen} />
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

      <Modal
        visible={isSearchModuleOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={toggleIsSearchModuleOpen}>
        <View className="flex-1 bg-white">
          <Appbar.Header className="bg-white">
            <Appbar.Action icon="close" onPress={toggleIsSearchModuleOpen} />
            <TextInput
              placeholder="search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="flat"
              style={{ flex: 1 }}
              returnKeyType="search"
              autoCapitalize="none"
              onSubmitEditing={onSearchSubmit}
            />
          </Appbar.Header>
          <MenuSearch onClose={toggleIsSearchModuleOpen} />
        </View>
      </Modal>
    </>
  );
};
