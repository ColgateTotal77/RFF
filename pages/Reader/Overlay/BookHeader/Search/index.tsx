import { useBookStore } from 'stores/useBookStore';
import { Text, View } from 'react-native';
import { useTempStore } from 'stores/useTempStore';
import { SearchResult } from 'types';
import { SearchCard } from 'pages/Reader/Overlay/BookHeader/Search/SearchCard';
import { WebViewAction, useWebViewStore } from 'stores/useWebViewStore';
import { useAppStore } from 'stores/useAppStore';
import { Loading } from 'components/ui/Loading';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { loadWindow } from 'stores/actions';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';

interface Props {
  onClose: () => void;
}

type SearchExtra = {
  currentSearchResultId: number;
  onPress: (searchResult: SearchResult) => void;
};

const Separator = () => <View className="h-4" />;

const renderSearchCard = ({ item, extraData }: ListRenderItemInfo<SearchResult>) => {
  const { currentSearchResultId, onPress } = extraData as SearchExtra;

  return (
    <SearchCard
      isCurrentSearch={item.id === currentSearchResultId}
      searchItem={item}
      onPress={() => onPress(item)}
    />
  );
};

export const MenuSearch = ({ onClose }: Props) => {
  const searchResults = useTempStore((state) => state.searchResults);
  const setCurrentSearchResult = useTempStore((state) => state.setCurrentSearchResult);
  const currentSearchResult = useTempStore((state) => state.currentSearchResult);
  const currentBook = useBookStore((state) => state.currentBook);
  const addToPostLoadQueue = useWebViewStore((state) => state.addToPostLoadQueue);
  const setCurrentBlock = useBookStore((state) => state.setCurrentBlock);
  const executeImmediateActions = useWebViewStore((state) => state.executeImmediateActions);
  const addToBackStack = useTempStore((state) => state.addToBackStack);
  const setGlobalLoading = useAppStore((state) => state.setGlobalLoading);
  const isSearchLoading = useTempStore((state) => state.isSearchLoading);
  const searchQuery = useTempStore((state) => state.searchQuery);
  const { t } = useTranslation('translation', { keyPrefix: 'search' });
  const theme = useTheme();

  const onPress = (searchResult: SearchResult) => {
    if (!currentBook) return;

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
      const toExecute: WebViewAction[] = [];
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

  const extraData: SearchExtra = {
    currentSearchResultId: currentSearchResult.id,
    onPress,
  };

  if (!currentBook) return;

  const EmptyState = () =>
    searchQuery ? (
      <View className="flex-1 items-center justify-center p-8">
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{t('noResults')}</Text>
      </View>
    ) : null;

  return (
    <>
      {!isSearchLoading && searchQuery && (
        <FlashList
          data={searchResults}
          extraData={extraData}
          renderItem={renderSearchCard}
          ItemSeparatorComponent={Separator}
          contentContainerClassName="p-4"
          ListEmptyComponent={EmptyState}
        />
      )}
      {isSearchLoading && <Loading />}
    </>
  );
};
