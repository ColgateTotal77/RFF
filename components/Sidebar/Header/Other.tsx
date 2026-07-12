import { DropdownMenu } from 'components/ui/DropdownMenu';
import { AppbarAction } from 'components/ui/AppbarAction';
interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose } = props;

  return (
    <DropdownMenu
      visible={isOpen}
      onDismiss={onClose}
      anchor={
        <AppbarAction icon="dots-vertical" onPress={onOpen} accessibilityLabel="More options" />
      }></DropdownMenu>
  );
};
