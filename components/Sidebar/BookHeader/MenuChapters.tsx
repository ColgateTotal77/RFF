import { useBookStore } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { ChapterCard } from 'components/Sidebar/BookHeader/ChapterCard';
import { Chapter } from 'types';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const { currentBook, jumpToChapter } = useBookStore();

  const onPress = (chapter: Chapter) => {
    if (!currentBook) return;

    const index = currentBook.chapters.findIndex((c) => c.id === chapter.id);

    if (index !== -1) {
      jumpToChapter(index);
      onClose();
    }
  };

  const renderChapter = ({ item }: { item: Chapter }) => (
    <ChapterCard chapter={item} onPress={() => onPress(item)} />
  );

  return (
    <FlatList
      data={currentBook?.chapters}
      keyExtractor={(chapter) => chapter.id}
      renderItem={renderChapter}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
