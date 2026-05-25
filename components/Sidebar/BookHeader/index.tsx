import { Appbar, TextInput } from 'react-native-paper';
import { Other } from 'components/Sidebar/BookHeader/Other';
import { useCurrentBook } from 'stores/useBookStore';
import { useState } from 'react';
import { View, Modal } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { BookEngine } from 'modules/book-engine';
import { BookSettings } from 'components/Sidebar/BookHeader/BookSettings';
import BookHeaderNavigation from 'components/Sidebar/BookHeader/BookHeaderNavigation';
import { MenuSearch } from 'components/Sidebar/BookHeader/Search';
import { useWebViewStore } from 'stores/useWebViewStore';
import { useTranslation } from 'react-i18next';

const SearchInput = ({ onSubmit }: { onSubmit: (q: string) => void }) => {
  const setSearchQuery = useTempStore((state) => state.setSearchQuery);
  const searchQuery = useTempStore((state) => state.searchQuery);
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader' });

  return (
    <TextInput
      placeholder={t('searchPlaceholder')}
      value={searchQuery}
      onChangeText={setSearchQuery}
      mode="flat"
      style={{ flex: 1 }}
      returnKeyType="search"
      autoCapitalize="none"
      onSubmitEditing={() => onSubmit(searchQuery)}
    />
  );
};

export const BookHeader = () => {
  const setSearchQuery = useTempStore((state) => state.setSearchQuery);
  const toggleIsSearchModuleOpen = useTempStore((state) => state.toggleIsSearchModuleOpen);
  const setSearchResults = useTempStore((state) => state.setSearchResults);
  const isSearchModuleOpen = useTempStore((state) => state.isSearchModuleOpen);
  const currentBook = useCurrentBook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookSettingsOpen, setIsBookSettingsOpen] = useState(false);
  const [isBookHeaderNavigationOpen, setIsBookHeaderNavigationOpen] = useState(false);
  const setPostLoadQueue = useWebViewStore((state) => state.setPostLoadQueue);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const executeQueueActions = useWebViewStore((state) => state.executeQueueActions);
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader' });

  const onSearchSubmit = async (localQuery: string) => {
    const cleanedQuery = localQuery.trim();

    setPostLoadQueue([{ type: 'clearSearch' }]);
    if (cleanedQuery) {
      addToPostLoadQueue({
        type: 'highlightAll',
        query: cleanedQuery,
      });
    }
    executeQueueActions();

    if (!cleanedQuery) return;

    setSearchQuery(cleanedQuery);
    const results = await BookEngine.searchInBook(cleanedQuery, currentBook.basePath);
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
          onBookSettingsOpen={() => setIsBookSettingsOpen(true)}
        />

        <Appbar.Action
          icon="format-list-bulleted"
          onPress={() => setIsBookHeaderNavigationOpen(true)}
        />
      </Appbar.Header>

      <BookHeaderNavigation
        onClose={() => setIsBookHeaderNavigationOpen(false)}
        isOpen={isBookHeaderNavigationOpen}
        bookTitle={currentBook.title}
      />

      <Modal
        visible={isSearchModuleOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={toggleIsSearchModuleOpen}>
        <View className="flex-1 bg-white">
          <Appbar.Header className="bg-white">
            <Appbar.Action icon="close" onPress={toggleIsSearchModuleOpen} />
            <SearchInput onSubmit={onSearchSubmit} />
          </Appbar.Header>
          <MenuSearch onClose={toggleIsSearchModuleOpen} />
        </View>
      </Modal>

      <Modal
        visible={isBookSettingsOpen}
        animationType="slide"
        onRequestClose={() => setIsBookSettingsOpen(false)}>
        <View className="flex-1 bg-white">
          <Appbar.Header className="bg-white">
            <Appbar.Action icon="close" onPress={() => setIsBookSettingsOpen(false)} />
            <Appbar.Content title={t('bookSettings')} />
          </Appbar.Header>
          <BookSettings />
        </View>
      </Modal>
    </>
  );
};
