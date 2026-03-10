import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
  title: string;
}

export const Header = ({ navigation, title }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Appbar.Header className="bg-white">
      <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      <Appbar.Content title={title} />
      <Appbar.Action icon="magnify" onPress={() => {}} />
      <Other
        isOpen={isMenuOpen}
        onOpen={() => setIsMenuOpen(true)}
        onClose={() => setIsMenuOpen(false)}
        navigation={navigation}
      />
    </Appbar.Header>
  );
};
