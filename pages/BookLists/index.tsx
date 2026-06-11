import { FlatList, View, Text } from 'react-native';
import { useBookStore } from 'stores/useBookStore';
import { useNavigation } from '@react-navigation/native';
import { Book, RootDrawerNavigationProp } from 'types';
import { useTempStore } from 'stores/useTempStore';
import { BookCard } from 'pages/BookLists/BookCard';
import { useTheme } from 'react-native-paper';
import { useAnkiStore } from 'stores/useAnkiStore';
import { Button } from 'components/ui/Button';
import { useTranslation } from 'react-i18next';

interface BookListScreenProps {
  filterFn: (book: Book) => boolean;
  toggleLabel: string;
}

export const BookListScreen = ({ filterFn, toggleLabel }: BookListScreenProps) => {
  const books = useBookStore((state) => state.books);
  const openBook = useBookStore((state) => state.openBook);
  const closeMenu = useTempStore((state) => state.closeSelectionMenu);
  const hasDeck = useAnkiStore((state) => state.hasDeck);
  const theme = useTheme();
  const { t } = useTranslation();

  const navigation = useNavigation<RootDrawerNavigationProp>();

  const onPress = (basePath: string) => {
    closeMenu();
    openBook(basePath);
    navigation.navigate('Reader');
  };

  if (books.length === 0 && !hasDeck()) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 px-6"
        style={{ backgroundColor: theme.colors.background }}>
        <Text className="text-center text-lg" style={{ color: theme.colors.onBackground }}>
          {t('bookLists.setupAnki')}
        </Text>
        <Button mode="contained" onPress={() => navigation.navigate('Settings')}>
          {t('bookLists.goToSettings')}
        </Button>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => onPress(item.basePath)} toggleLabel={toggleLabel} />
  );

  const filteredBooks = books.filter(filterFn);

  return (
    <FlatList
      data={filteredBooks}
      style={{ backgroundColor: theme.colors.background }}
      keyExtractor={(book) => book.basePath}
      renderItem={renderBook}
      contentContainerClassName="p-4 gap-4"
    />
  );
};
