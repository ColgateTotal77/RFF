import { Appbar } from 'react-native-paper';
import { useState } from 'react';
import { Other } from 'components/Sidebar/Header/Other';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';
import { AppbarAction } from 'components/ui/AppbarAction';
import { SearchAction } from 'components/Sidebar/Header/SearchAction';
import { pickDocument } from 'stores/actions';
import { useTranslation } from 'react-i18next';

interface Props {
  navigation: DrawerNavigationProp<ParamListBase>;
  title: string;
  routeName: string;
}

export const Header = ({ navigation, title, routeName }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isBookListRoute = routeName === 'Reading Now' || routeName === 'Have Read';

  return (
    <Appbar.Header style={{ marginLeft: 4 }}>
      {isBookListRoute ? (
        <SearchAction
          leftContent={
            <>
              <AppbarAction
                icon="menu"
                onPress={() => navigation.openDrawer()}
                accessibilityLabel={t('openMenu')}
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
            accessibilityLabel={t('openMenu')}
          />
          <Appbar.Content title={title} />
        </>
      )}

      {isBookListRoute && (
        <>
          <AppbarAction
            icon="plus"
            onPress={pickDocument}
            accessibilityLabel={t('addBook')}
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
