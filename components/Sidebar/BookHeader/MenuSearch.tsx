import { useBookStore, useCurrentBook } from 'stores/useBookStore';
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

  const currentBook = useCurrentBook();
  const jumpToBlock = useBookStore((state) => state.jumpToBlock);
  const clearSearchAction = useBookStore((state) => state.clearSearchAction);

  const onPress = (searchResultWithTitle: SearchResultWithTitle) => {
    clearSearchAction();

    if (!currentBook.currentBlocks.includes(searchResultWithTitle.blockIndex)) {
      setIsWebViewReady(false);
      jumpToBlock(searchResultWithTitle.blockIndex);
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
        `${searchResultWithTitle.blockIndex}-${searchResultWithTitle.occurrenceIndex}`
      }
      renderItem={renderSearchCard}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
