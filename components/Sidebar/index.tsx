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

const Drawer = createDrawerNavigator<RootStackParamList>();

const ReadingNowScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  return (
    <BookListScreen
      filterFn={(book) => !book.misc.haveRead}
      toggleLabel={t('readingNow')}
    />
  );
};

const HaveReadScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  return (
    <BookListScreen
      filterFn={(book) => book.misc.haveRead}
      toggleLabel={t('haveRead')}
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
          return <Header navigation={navigation} title={getHeaderTitle(options, route.name)} />;
        },
      }}>
      <Drawer.Screen name="Reading Now" component={ReadingNowScreen} options={{ title: t('readingNow') }} />
      <Drawer.Screen name="Have Read" component={HaveReadScreen} options={{ title: t('haveRead') }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') }} />
      <Drawer.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
