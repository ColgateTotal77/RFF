import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { useBookStore } from 'stores/useBookStore';
import * as DocumentPicker from 'expo-document-picker';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useAnkiStore } from 'stores/useAnkiStore';

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

  return (
    <Appbar.Header>
      <AppbarAction icon="menu" onPress={() => navigation.openDrawer()} />
      <Appbar.Content title={title} />
      {(routeName === 'Reading Now' || routeName === 'Have Read') && (
        <>
          <AppbarAction icon="magnify" onPress={() => {}} />
          <AppbarAction icon="plus" onPress={pickDocument} disabled={!hasDeck()} />
          <Other
            isOpen={isMenuOpen}
            onOpen={() => setIsMenuOpen(true)}
            onClose={() => setIsMenuOpen(false)}
            navigation={navigation}
          />
        </>
      )}
    </Appbar.Header>
  );
};
