import { Appbar, Divider, Menu } from 'react-native-paper';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose } = props;

  return (
    <Menu
      visible={isOpen}
      onDismiss={onClose}
      anchor={<Appbar.Action icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item title="Item 1" />
      <Menu.Item onPress={() => {}} title="Item 2" />
      <Divider />
      <Menu.Item onPress={() => {}} title="Settings" />
    </Menu>
  );
};
