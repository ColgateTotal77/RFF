import { Menu } from 'react-native-paper';
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
      anchor={<AppbarAction icon="dots-vertical" onPress={onOpen} accessibilityLabel="More options" />}
      anchorPosition={'bottom'}
      elevation={1}>
      <></>
    </Menu>
  );
};
