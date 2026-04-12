import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { SearchCard } from 'components/Sidebar/BookHeader/SearchCard';
import { SearchResult } from 'types';

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

  const onPress = (searchResult: SearchResult) => {
    clearSearchAction();

    if (!currentBook.currentBlocks.includes(searchResult.blockId)) {
      setIsWebViewReady(false);
      jumpToBlock(searchResult.blockId);
    }

    setIsSearchOperation(true);
    setCurrentSearchResult(searchResult);
    onClose();
  };

  const renderSearchCard = ({ item }: { item: SearchResult }) => (
    <SearchCard
      isCurrentSearch={ item.id === currentSearchResult.id }
      searchItem={item}
      onPress={() => onPress(item)}
    />
  );

  return (
    <FlatList
      data={Object.values(searchResults)}
      keyExtractor={(searchResults) => searchResults.id.toString()}
      renderItem={renderSearchCard}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
