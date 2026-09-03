import * as DocumentPicker from 'expo-document-picker';
import { BookEngine } from 'modules/book-engine';
import { Toast } from 'components/ui/Toast';
import i18n from 'i18n';
import { buildBookMapping } from 'lib/utils';
import { parseBook } from 'lib/ParseBook';
import {
  normalizeLanguageCode,
  FALLBACK_BOOK_LANGUAGE,
  bookLanguageToLocaleTag,
} from 'lib/langHelper';
import { BOOK_LANGUAGE } from 'lib/languagesMappings';
import { useAppStore } from './useAppStore';
import { useAnkiStore } from './useAnkiStore';
import { useBookStore } from './useBookStore';
import { useTempStore } from './useTempStore';
import { useWebViewStore } from './useWebViewStore';


export const toggleTheme = () => {
  const nextTheme = useAppStore.getState().theme === 'dark' ? 'light' : 'dark';
  useAppStore.getState().setTheme(nextTheme);

  const { isWebViewReady, executeImmediateActions, addToPostLoadQueue } =
    useWebViewStore.getState();

  if (isWebViewReady) executeImmediateActions([{ type: 'setTheme', theme: nextTheme }]);
  else addToPostLoadQueue({ type: 'setTheme', theme: nextTheme });
};

export const loadWindow = async (targetBlockId: number, blockScrollPercent: number) => {
  const { jumpToBlock, getBookSettings } = useBookStore.getState();

  if (targetBlockId !== -1) jumpToBlock(targetBlockId);

  try {
    const currentBook = useBookStore.getState().currentBook;
    if (!currentBook) return;

    const settings = getBookSettings();

    const { currentBlocks, blocks } = currentBook;
    const paths = currentBlocks.map((index) => blocks[index].fullPath);

    const currentSearchResult = useTempStore.getState().currentSearchResult;

    useTempStore.getState().setIsOverlayVisible(false);

    const { addToPostLoadQueue, setPostLoadQueue } = useWebViewStore.getState();

    if (useWebViewStore.getState().postLoadQueue.length === 0) {
      addToPostLoadQueue({
        type: 'scrollToBlock',
        blockId: currentBook.currentBlock,
        scrollPercent: blockScrollPercent,
        instant: true,
      });
    }

    if (currentSearchResult.id !== -1) {
      setPostLoadQueue([
        {
          type: 'highlightAll',
          query: currentSearchResult.query,
        },
        ...(useWebViewStore.getState().postLoadQueue ?? []),
      ]);
    }

    const generatedFileUrl = await BookEngine.loadInitialHtml(
      paths,
      currentBlocks,
      currentBook.cssPaths,
      {
        fontSize: settings.font.fontSize,
        fontFamily: settings.font.fontFamily,
        theme: useAppStore.getState().theme,
        totalBlocks: blocks.length,
      }
    );

    const reactTag = await new Promise((resolve) => {
      const currentTag = useWebViewStore.getState().reactTag;
      if (currentTag !== null) {
        return resolve(currentTag);
      }

      const unsubscribe = useWebViewStore.subscribe((state) => {
        if (state.reactTag !== null) {
          unsubscribe();
          resolve(state.reactTag);
        }
      });
    });

    setTimeout(async () => {
      await BookEngine.setupBookBridge(
        reactTag,
        currentBook.blocks.map((b) => b.fullPath),
        currentBook.currentBlocks
      );

      useWebViewStore.getState().setWebViewSource({ uri: generatedFileUrl });

      if (!useAppStore.getState().hasSeenFirstBookHint) {
        useAppStore.getState().dismissFirstBookHint();
        Toast.show(i18n.t('guide.firstBookHint'), 'default', () =>
          useAppStore.getState().navigate('Guide')
        );
      }
    }, 0);
  } catch (e) {
    console.error('Failed to prepare initial blocks:', e);
    Toast.show(i18n.t('toast.failedToLoadReader'), 'error');
    useAppStore.getState().setGlobalLoading({ isLoading: false, message: '' });
  }
};

export const openBook = async (basePath: string) => {
  const { currentBook, books, closeBook, getBookSettings, isAnkiConfigStale } =
    useBookStore.getState();

  const bookToOpen = books.find((book) => book.basePath === basePath);
  if (!bookToOpen) return;

  const bookSettings = getBookSettings(bookToOpen);
  const configStale = isAnkiConfigStale(bookToOpen);
  const needsDictionaryReload = !!bookSettings.ankiDeckId && configStale;
  const needsBookReload = currentBook?.basePath !== bookToOpen.basePath;

  await BookEngine.addNewLangForSync(bookSettings.bookLang);

  try {
    if (needsDictionaryReload || needsBookReload) {
      useAppStore
        .getState()
        .setGlobalLoading({ isLoading: true, message: i18n.t('ankiTab.processingDeck') });

      closeBook();

      if (needsDictionaryReload) {
        console.log('Loading Anki dictionary for book');

        useBookStore.getState().setCurrentCTree({
          langCode: bookSettings.bookLang,
          deckId: bookSettings.ankiDeckId!,
          fieldMapping: bookSettings.fieldMapping,
          mirroredFieldMapping: bookSettings.mirroredFieldMapping,
        });

        await BookEngine.loadAnkiDictionary(
          bookSettings.bookLang,
          bookSettings.ankiDeckId,
          bookSettings.fieldMapping,
          bookSettings.mirroredFieldMapping
        );
      }

      console.log('Opening book');

      const { loadFieldsInto } = useAnkiStore.getState();
      loadFieldsInto(bookSettings.ankiModelId!, 'bookFields');
      loadFieldsInto(bookSettings.mirroredAnkiModelId!, 'bookMirroredFields');

      bookToOpen.mapping = buildBookMapping(bookToOpen);

      useBookStore.setState((state) => ({
        currentBook: bookToOpen,
        books: [bookToOpen, ...state.books.filter((b) => b.basePath !== basePath)],
      }));

      loadWindow(bookToOpen.currentBlock, bookToOpen.misc.currentBlockScrollPercent);
    } else {
      useAppStore.getState().setGlobalLoading({ isLoading: false, message: '' });
    }

    useAppStore.getState().navigate('Reader');

    if (
      bookSettings.fieldMapping.audio != null ||
      bookSettings.mirroredFieldMapping.audio != null
    ) {
      const hasTTSModel = await BookEngine.hasTTSDownloaded(
        bookLanguageToLocaleTag(bookSettings.bookLang)
      );
      if (hasTTSModel) return;

      const neededLang = BOOK_LANGUAGE[bookSettings.bookLang];

      Toast.show(i18n.t('toast.installTtsVoice', { lang: neededLang }), 'error', () =>
        BookEngine.openTTSSettings()
      );
    }
  } catch (e) {
    useAppStore.getState().setGlobalLoading({ isLoading: false, message: '' });
    console.error('❌ Failed to open book:', e);
    Toast.show(i18n.t('toast.failedToOpenBook'), 'error');
  }
};

export const loadBook = async (uri: string) => {
  useBookStore.getState().closeBook();

  try {
    const targetLang =
      normalizeLanguageCode(useAppStore.getState().settings.targetLang) ?? FALLBACK_BOOK_LANGUAGE;

    const book = await parseBook(uri, targetLang);

    useBookStore.setState((state) => ({
      books: [book, ...state.books.filter((b) => b.basePath !== book.basePath)],
    }));

    openBook(book.basePath);
  } catch (e) {
    console.error('❌ Failed to load book:', e);
    Toast.show(
      e instanceof Error && e.message ? e.message : i18n.t('toast.failedToLoadBook'),
      'error'
    );
    useAppStore.getState().setGlobalLoading({ isLoading: false, message: '' });
  }
};

export const importBook = async (path: string) => {
  const { setGlobalLoading } = useAppStore.getState();
  try {
    setGlobalLoading({ isLoading: true, message: i18n.t('bookLists.importingBook') });
    loadBook(path);
  } catch (e) {
    console.error('Failed to import book:', e);
    setGlobalLoading({ isLoading: false, message: '' });
  }
};

export const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/epub+zip',
      'application/x-fictionbook+xml',
      'application/zip',
      'application/octet-stream',
    ],
    copyToCacheDirectory: true,
  });

  if (!result.canceled) await importBook(result.assets[0].uri);
};
