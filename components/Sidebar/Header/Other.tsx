import { Menu } from 'react-native-paper';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { AppbarAction } from 'components/ui/AppbarAction';
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
      anchor={<AppbarAction icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item title="?????" />
    </Menu>
  );
};
