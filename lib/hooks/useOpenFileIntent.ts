import { useEffect } from 'react';
import { Linking } from 'react-native';
import { importBook } from 'stores/actions';
import { copyUriToCache } from 'lib/utils';

const isBookUri = (uri: string | null): uri is string =>
  !!uri && (uri.startsWith('content://') || uri.startsWith('file://'));

export const useOpenFileIntent = () => {
  useEffect(() => {
    const open = async (uri: string | null) => {
      if (!isBookUri(uri)) return;
      const path = await copyUriToCache(uri);
      importBook(path);
    };

    Linking.getInitialURL().then(open);

    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, []);
};
