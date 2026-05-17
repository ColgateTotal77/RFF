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

const Drawer = createDrawerNavigator<RootStackParamList>();

const ReadingNowScreen = () => (
  <BookListScreen filterFn={(book) => !book.misc.haveRead} toggleLabel="Reading Now" />
);

const HaveReadScreen = () => (
  <BookListScreen filterFn={(book) => book.misc.haveRead} toggleLabel="Have Read" />
);

export const Sidebar = () => {
  const currentBook = useBookStore((state) => state.currentBook);

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
      <Drawer.Screen name="Reading Now" component={ReadingNowScreen} />
      <Drawer.Screen name="Have Read" component={HaveReadScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
