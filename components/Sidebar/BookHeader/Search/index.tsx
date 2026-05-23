import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { SearchResult } from 'types';
import { SearchCard } from './SearchCard';
import { useWebViewStore } from 'stores/useWebViewStore';

interface Props {
  onClose: () => void;
}

export const MenuSearch = ({ onClose }: Props) => {
  const searchResults = useTempStore((state) => state.searchResults);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const currentBook = useCurrentBook();
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const loadWindow = useWebViewStore((state) => state.loadWindow);
  const executeImmediateAction = useWebViewStore((state) => state.executeImmediateAction);

  const onPress = (searchResult: SearchResult) => {
    setCurrentSearchResult(searchResult);

    if (!currentBook.currentBlocks.includes(searchResult.blockId)) {
      addToPostLoadQueue({
        type: 'jumpToSearch',
        blockId: searchResult.blockId,
        occurrenceIndex: searchResult.occurrenceIndex,
      });
      loadWindow(searchResult.blockId, 0);
    } else {
      setCurrentBlock(searchResult.blockId);
      executeImmediateAction({
        type: 'jumpToSearch',
        blockId: searchResult.blockId,
        occurrenceIndex: searchResult.occurrenceIndex,
      });
    }

    onClose();
  };

  const renderSearchCard = ({ item }: { item: SearchResult }) => (
    <SearchCard
      isCurrentSearch={item.id === currentSearchResult.id}
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
