import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useAppStore } from 'stores/useAppStore';
import { copyUriToCache } from 'lib/utils';

const isBookUri = (uri: string | null): uri is string =>
  !!uri && (uri.startsWith('content://') || uri.startsWith('file://'));

export const useOpenFileIntent = () => {
  const importBook = useAppStore((state) => state.importBook);

  useEffect(() => {
    const open = async (uri: string | null) => {
      if (!isBookUri(uri)) return;
      const path = await copyUriToCache(uri);
      importBook(path);
    };

    Linking.getInitialURL().then(open);

    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, [importBook]);
};
