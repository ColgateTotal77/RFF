import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { SearchResult } from 'types';
import { SearchCard } from 'pages/Reader/Overlay/BookHeader/Search/SearchCard';
import { ImmediateAction, useWebViewStore } from 'stores/useWebViewStore';

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
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToBackStack = useTempStore((state) => state.addToBackStack);

  const onPress = (searchResult: SearchResult) => {
    addToBackStack({
      blockId: currentBook.currentBlock,
      scrollPercent: currentBook.misc.currentBlockScrollPercent,
    });

    if (!currentBook.currentBlocks.includes(searchResult.blockId)) {
      if (!currentSearchResult.query) {
        addToPostLoadQueue({
          type: 'highlightAll',
          query: searchResult.query,
        });
      }
      addToPostLoadQueue({
        type: 'jumpToSearch',
        blockId: searchResult.blockId,
        occurrenceIndex: searchResult.occurrenceIndex,
      });
      loadWindow(searchResult.blockId, 0);
    } else {
      setCurrentBlock(searchResult.blockId);
      const toExecute: ImmediateAction[] = [];
      if (!currentSearchResult.query) {
        toExecute.push({
          type: 'highlightAll',
          query: searchResult.query,
        });
      }
      toExecute.push({
        type: 'jumpToSearch',
        blockId: searchResult.blockId,
        occurrenceIndex: searchResult.occurrenceIndex,
      });
      executeImmediateActions(toExecute);
    }

    setCurrentSearchResult(searchResult);

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
