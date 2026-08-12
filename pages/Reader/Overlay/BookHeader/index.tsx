import { Appbar, Portal, useTheme } from 'react-native-paper';
import { Other } from 'pages/Reader/Overlay/BookHeader/Other';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { View, Modal, Animated, TextInput as NativeTextInput } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { BookEngine } from 'modules/book-engine';
import { BookSettings } from 'pages/Reader/Overlay/BookHeader/BookSettings';
import BookHeaderNavigation from 'pages/Reader/Overlay/BookHeader/BookHeaderNavigation';
import { MenuSearch } from 'pages/Reader/Overlay/BookHeader/Search';
import { useTranslation } from 'react-i18next';
import { AppbarAction } from 'components/ui/AppbarAction';
import { SearchInput } from 'components/ui/SearchInput';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openBook } from 'stores/actions';

const BookSearchInput = ({
  onSubmit,
  inputRef,
}: {
  onSubmit: (q: string) => void;
  inputRef: React.Ref<NativeTextInput>;
}) => {
  const setTempSearchQuery = useTempStore((state) => state.setTempSearchQuery);
  const tempSearchQuery = useTempStore((state) => state.tempSearchQuery);

  return (
    <View style={{ flex: 1 }}>
      <SearchInput
        inputRef={inputRef}
        value={tempSearchQuery}
        onChangeText={setTempSearchQuery}
        accessibilityLabel="Search in book"
        onSubmitEditing={() => onSubmit(tempSearchQuery)}
      />
    </View>
  );
};

export const BookHeader = () => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const setSearchQuery = useTempStore((state) => state.setSearchQuery);
  const toggleIsSearchModuleOpen = useTempStore((state) => state.toggleIsSearchModuleOpen);
  const setSearchResults = useTempStore((state) => state.setSearchResults);
  const isSearchModuleOpen = useTempStore((state) => state.isSearchModuleOpen);
  const isAnkiConfigStale = useBookStore((state) => state.isAnkiConfigStale);
  const resetSearch = useTempStore((state) => state.resetSearch);
  const setIsSearchLoading = useTempStore((state) => state.setIsSearchLoading);
  const currentBook = useCurrentBook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookSettingsOpen, setIsBookSettingsOpen] = useState(false);
  const [isBookHeaderNavigationOpen, setIsBookHeaderNavigationOpen] = useState(false);
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader' });
  const isOverlayVisible = useTempStore((state) => state.isOverlayVisible);

  const onSearchSubmit = async (localQuery: string) => {
    const cleanedQuery = localQuery.trim();

    if (cleanedQuery.length < 2) return;

    resetSearch();
    setSearchQuery(cleanedQuery);
    setIsSearchLoading(true);
    try {
      const results = await BookEngine.searchInBook(cleanedQuery, currentBook.basePath);
      setSearchResults(results);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const onBookSettingsClose = () => {
    setIsBookSettingsOpen(false);
    if (!isAnkiConfigStale(currentBook)) return;
    openBook(currentBook.basePath);
  };

  const searchInputRef = useRef<NativeTextInput>(null);
  const opacityAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const unsubscribe = useTempStore.subscribe((state) => {
      Animated.timing(opacityAnim, {
        toValue: state.isBookSettingsTransparent ? 0.7 : 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });

    return unsubscribe;
  }, [opacityAnim]);

  if (!isOverlayVisible) return null;

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title={currentBook?.title} />
        <AppbarAction
          icon="magnify"
          onPress={toggleIsSearchModuleOpen}
          accessibilityLabel="Search in book"
        />
        <Other
          isOpen={isMenuOpen}
          onOpen={() => setIsMenuOpen(true)}
          onClose={() => setIsMenuOpen(false)}
          onBookSettingsOpen={() => setIsBookSettingsOpen(true)}
        />

        <AppbarAction
          icon="format-list-bulleted"
          onPress={() => setIsBookHeaderNavigationOpen(true)}
          accessibilityLabel="Chapters and bookmarks"
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
        onRequestClose={toggleIsSearchModuleOpen}
        onShow={() => {
          if (!useTempStore.getState().searchQuery || !useTempStore.getState().searchResults.length)
            searchInputRef.current?.focus();
        }}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Appbar.Header style={{ marginRight: 8, marginLeft: 4 }}>
            <AppbarAction
              icon="arrow-left"
              onPress={toggleIsSearchModuleOpen}
              accessibilityLabel="Close search"
            />
            <BookSearchInput inputRef={searchInputRef} onSubmit={onSearchSubmit} />
          </Appbar.Header>
          <MenuSearch onClose={toggleIsSearchModuleOpen} />
        </View>
      </Modal>

      <Modal
        visible={isBookSettingsOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={onBookSettingsClose}>
        <Portal.Host>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              opacity: opacityAnim,
              paddingBottom: bottom,
            }}>
            <Appbar.Header style={{ marginLeft: 4 }}>
              <AppbarAction
                icon="arrow-left"
                onPress={onBookSettingsClose}
                accessibilityLabel="Close book settings"
              />
              <Appbar.Content title={t('bookSettings')} />
            </Appbar.Header>
            <BookSettings />
          </Animated.View>
        </Portal.Host>
      </Modal>
    </>
  );
};
