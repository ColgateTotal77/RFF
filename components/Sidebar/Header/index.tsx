import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { useBookStore } from 'stores/useBookStore';
import * as DocumentPicker from 'expo-document-picker';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useAnkiStore } from 'stores/useAnkiStore';
import { SearchAction } from 'components/Sidebar/Header/SearchAction';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
  title: string;
  routeName: string;
}

export const Header = ({ navigation, title, routeName }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { loadBook } = useBookStore();
  const hasDeck = useAnkiStore((state) => state.hasDeck);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/epub+zip',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      await loadBook(result.assets[0].uri);
      navigation.navigate('Reader');
    }
  };

  const isBookListRoute = routeName === 'Reading Now' || routeName === 'Have Read';

  return (
    <Appbar.Header>
      {isBookListRoute ? (
        <SearchAction
          leftContent={
            <>
              <AppbarAction icon="menu" onPress={() => navigation.openDrawer()} accessibilityLabel="Open menu" />
              <Appbar.Content title={title} />
            </>
          }
        />
      ) : (
        <>
          <AppbarAction icon="menu" onPress={() => navigation.openDrawer()} accessibilityLabel="Open menu" />
          <Appbar.Content title={title} />
        </>
      )}

      {isBookListRoute && (
        <>
          <AppbarAction icon="plus" onPress={pickDocument} disabled={!hasDeck()} accessibilityLabel="Add book" />
          <Other
            isOpen={isMenuOpen}
            onOpen={() => setIsMenuOpen(true)}
            onClose={() => setIsMenuOpen(false)}
          />
        </>
      )}
    </Appbar.Header>
  );
};
