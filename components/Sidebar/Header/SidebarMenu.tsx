import { Appbar, Divider, Menu } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { useBookStore } from 'stores/useBookStore';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  navigation: DrawerNavigationProp<ParamListBase>;
}

export const SidebarMenu = (props: Props) => {
  const { isOpen, onOpen, onClose, navigation } = props;
  const { loadBook } = useBookStore();

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/epub+zip',
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      onClose();
      loadBook(result.assets[0].uri);
      navigation.navigate('Reader');
    }
  };

  return (
    <Menu
      visible={isOpen}
      onDismiss={onClose}
      anchor={<Appbar.Action icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item onPress={pickDocument} title="Load Book" />
      <Divider />
      <Menu.Item onPress={() => {}} title="Item 2" />
      <Menu.Item onPress={() => {}} title="Item 3" />
    </Menu>
  );
};
