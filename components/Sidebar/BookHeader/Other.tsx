import { Appbar, Divider, Menu } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const Other = (props: Props) => {
  const { isOpen, onOpen, onClose } = props;
  const updateThemeAction = useBookStore((state) => state.updateThemeAction);
  const settings = useBookStore((state) => state.settings);

  return (
    <Menu
      visible={isOpen}
      onDismiss={onClose}
      anchor={<Appbar.Action icon="dots-vertical" onPress={onOpen} />}
      anchorPosition={'bottom'}
      elevation={1}>
      <Menu.Item title="Title" />
      <Menu.Item onPress={() => updateThemeAction(settings.theme === 'dark' ? 'light' : 'dark')} title="Switch Theme" />
      <Divider />
      <Menu.Item onPress={() => {}} title="Settings" />
    </Menu>
  );
};
