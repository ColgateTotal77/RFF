import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { useBookStore } from 'stores/useBookStore';
import * as DocumentPicker from 'expo-document-picker';
import { AppbarAction } from 'components/ui/AppbarAction';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
  title: string;
}

export const Header = ({ navigation, title }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { loadBook } = useBookStore();

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
      <AppbarAction icon="magnify" onPress={() => {}} />
      <AppbarAction icon="plus" onPress={pickDocument} />
      <Other
        isOpen={isMenuOpen}
        onOpen={() => setIsMenuOpen(true)}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
      />
    </Appbar.Header>
  );
};
