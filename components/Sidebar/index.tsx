import { createDrawerNavigator } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { Header } from 'components/Sidebar/Header';
import { SidebarContent } from 'components/Sidebar/SidebarContent';
import { ReadingNowScreen } from 'pages/ReadingNow';
import { SettingsScreen } from 'pages/Settings';
import { ReaderScreen } from 'pages/Reader';

const Drawer = createDrawerNavigator();

export const Sidebar = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        header: ({ navigation, route, options }) => {
          return <Header navigation={navigation} title={getHeaderTitle(options, route.name)} />;
        },
      }}>
      <Drawer.Screen name="Reading Now" component={ReadingNowScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Reader" component={ReaderScreen} />
    </Drawer.Navigator>
  );
};
