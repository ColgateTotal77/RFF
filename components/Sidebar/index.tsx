import { createDrawerNavigator } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { Header } from 'components/Sidebar/Header';
import { SidebarContent } from 'components/Sidebar/SidebarContent';
import { SettingsScreen } from 'pages/Settings';
import { ReaderScreen } from 'pages/Reader';
import { DrawerTab, RootStackParamList } from 'types';
import { BookHeader } from 'components/Sidebar/BookHeader';
import { useBookStore } from 'stores/useBookStore';
import { BookListScreen } from 'pages/BookLists';
import { useTranslation } from 'react-i18next';
import { useTempStore } from 'stores/useTempStore';

const Drawer = createDrawerNavigator<RootStackParamList>();

const ReadingScreen = (haveReade: boolean) => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  const query = useTempStore((state) => state.bookListQuery).toLowerCase();

  return (
    <BookListScreen
      filterFn={(book) =>
        (haveReade ? book.misc.haveRead : !book.misc.haveRead) &&
        book.title.toLowerCase().includes(query)
      }
      toggleLabel={t('readingNow')}
    />
  );
};

export const Sidebar = () => {
  const currentBook = useBookStore((state) => state.currentBook);
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        header: ({ navigation, route, options }) => {
          const currentTab = route.name as DrawerTab;

          if (currentTab === 'Reader' && currentBook) return <BookHeader />;
          return (
            <Header
              navigation={navigation}
              title={getHeaderTitle(options, route.name)}
              routeName={route.name}
            />
          );
        },
      }}>
      <Drawer.Screen
        name="Reading Now"
        component={() => ReadingScreen(false)}
        options={{ title: t('readingNow') }}
      />
      <Drawer.Screen
        name="Have Read"
        component={() => ReadingScreen(true)}
        options={{ title: t('haveRead') }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
      <Drawer.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
