import { useBookStore } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { SearchResultWithTitle } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { SearchCard } from 'components/Sidebar/BookHeader/SearchCard';

interface Props {
  onClose: () => void;
}

export const MenuSearch = ({ onClose }: Props) => {
  const { searchResults, setCurrentSearchResult, setIsWebViewReady, setIsSearchOperation, currentSearchResult } = useTempStore();
  const { currentBook, jumpToChapter, clearSearchAction } = useBookStore();

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
