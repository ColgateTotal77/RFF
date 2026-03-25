import { useBookStore } from 'stores/useBookStore';
import { FlatList } from 'react-native';
import { ChapterCard } from 'components/Sidebar/BookHeader/ChapterCard';
import { Chapter } from 'types';
import { calculateBookProgress } from 'lib/utils';

export const MenuChapters = ({ onClose }: { onClose: () => void }) => {
  const { currentBook, jumpToChapter, scrollToChapterAction, updateMisc, setCurrentChapter } = useBookStore();

  const onPress = (chapter: Chapter) => {
    if (!currentBook) return;

    if (currentBook.currentChapters.find((c) => c === chapter.id)) {
      scrollToChapterAction(chapter.id);
    } else {
      jumpToChapter(chapter.id);
    }

    updateMisc({
      percent: calculateBookProgress(currentBook, chapter.id, 0),
    });
    setCurrentChapter(chapter.id);
    onClose();
  };

  const renderChapter = ({ item }: { item: Chapter }) => {
    return <ChapterCard isCurrentChapter={currentBook?.currentChapter === item.id} chapter={item} onPress={() => onPress(item)} />;
  };

  return (
    <FlatList
      data={currentBook?.chapters}
      keyExtractor={(chapter) => chapter.id.toString()}
      renderItem={renderChapter}
      contentContainerClassName="p-4 gap-4"
      initialNumToRender={15}
    />
  );
};
