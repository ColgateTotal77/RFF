import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FlatList, Text, View } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { SearchResult } from 'types';
import { SearchCard } from 'pages/Reader/Overlay/BookHeader/Search/SearchCard';
import { ImmediateAction, useWebViewStore } from 'stores/useWebViewStore';
import { useAppStore } from 'stores/useAppStore';
import { Loading } from 'components/ui/Loading';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { loadWindow } from 'stores/actions';

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
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const isSearchLoading = useTempStore((state) => state.isSearchLoading);
  const searchQuery = useTempStore((state) => state.searchQuery);
  const { t } = useTranslation('translation', { keyPrefix: 'bookHeader' });
  const theme = useTheme();

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
      setGlobalLoading({ isLoading: true, message: 'Loading result…' });
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

  const EmptyState = () =>
    searchQuery ? (
      <View className="flex-1 items-center justify-center p-8">
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('noResults')}</Text>
      </View>
    ) : null;

  return (
    <>
      {!isSearchLoading && searchQuery && (
        <FlatList
          data={Object.values(searchResults)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSearchCard}
          contentContainerClassName="p-4 gap-4"
          initialNumToRender={15}
          ListEmptyComponent={EmptyState}
        />
      )}
      {isSearchLoading && <Loading />}
    </>
  );
};
