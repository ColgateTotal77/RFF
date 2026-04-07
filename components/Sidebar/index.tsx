import { createDrawerNavigator } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { Header } from 'components/Sidebar/Header';
import { SidebarContent } from 'components/Sidebar/SidebarContent';
import { ReadingNowScreen } from 'pages/ReadingNow';
import { SettingsScreen } from 'pages/Settings';
import { ReaderScreen } from 'pages/Reader';
import { DrawerTab, RootStackParamList } from 'types';
import { BookHeader } from 'components/Sidebar/BookHeader';
import { useBookStore } from 'stores/useBookStore';

const Drawer = createDrawerNavigator<RootStackParamList>();

export const Sidebar = () => {
  const currentBook = useBookStore(state => state.currentBook);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        header: ({ navigation, route, options }) => {
          const currentTab = route.name as DrawerTab;

          if (currentTab === "Reader" && currentBook) return <BookHeader/>
          return <Header navigation={navigation} title={getHeaderTitle(options, route.name)} />;
        },
      }}>
      <Drawer.Screen name="Reading Now" component={ReadingNowScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Reader" component={ReaderScreen} />
    </Drawer.Navigator>
  );
};
