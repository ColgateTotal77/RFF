import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useAnkiStore } from 'stores/useAnkiStore';
import { SearchAction } from 'components/Sidebar/Header/SearchAction';
import { useAppStore } from 'stores/useAppStore';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
  title: string;
  routeName: string;
}

export const Header = ({ navigation, title, routeName }: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const decks = useAnkiStore((state) => state.decks);
  const pickDocument = useAppStore((state) => state.pickDocument);

  const isBookListRoute = routeName === 'Reading Now' || routeName === 'Have Read';

  return (
    <Appbar.Header>
      {isBookListRoute ? (
        <SearchAction
          leftContent={
            <>
              <AppbarAction
                icon="menu"
                onPress={() => navigation.openDrawer()}
                accessibilityLabel="Open menu"
              />
              <Appbar.Content title={title} />
            </>
          }
        />
      ) : (
        <>
          <AppbarAction
            icon="menu"
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Open menu"
          />
          <Appbar.Content title={title} />
        </>
      )}

      {isBookListRoute && (
        <>
          <AppbarAction
            icon="plus"
            onPress={pickDocument}
            disabled={!decks.length}
            accessibilityLabel="Add book"
          />
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
