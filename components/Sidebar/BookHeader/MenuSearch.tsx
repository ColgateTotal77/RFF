import { useBookStore } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { SearchResultWithTitle } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { SearchCard } from 'components/Sidebar/BookHeader/SearchCard';

interface Props {
  onClose: () => void;
}

export const MenuSearch = ({ onClose }: Props) => {
  const searchResults = useTempStore((state) => state.searchResults);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const setIsWebViewReady = useTempStore((state) => state.setIsWebViewReady);
  const setIsSearchOperation = useTempStore((state) => state.setIsSearchOperation);
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);

  const currentBook = useBookStore((state) => state.currentBook);
  const jumpToChapter = useBookStore((state) => state.jumpToChapter);
  const clearSearchAction = useBookStore((state) => state.clearSearchAction);

  const onPress = (searchResultWithTitle: SearchResultWithTitle) => {
    const isAlreadyLoaded = (currentBook?.currentChapters || []).includes(
      searchResultWithTitle.chapterIndex
    );

    clearSearchAction();

    if (!isAlreadyLoaded) {
      setIsWebViewReady(false);
      jumpToChapter(searchResultWithTitle.chapterIndex);
    }

    setIsSearchOperation(true);
    setCurrentSearchResult(searchResultWithTitle);
    onClose();
  };

  const renderSearchCard = ({ item }: { item: SearchResultWithTitle }) => (
    <SearchCard
      isCurrentSearch={item.id === currentSearchResult.id}
      searchItem={item}
      onPress={() => onPress(item)}
    />
  );

  return (
    <FlatList
      data={Object.values(searchResults)}
      keyExtractor={(searchResultWithTitle) =>
        `${searchResultWithTitle.chapterIndex}-${searchResultWithTitle.occurrenceIndex}`
      }
      renderItem={renderSearchCard}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
