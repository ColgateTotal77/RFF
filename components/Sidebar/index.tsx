import { createDrawerNavigator } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { Header } from 'components/Sidebar/Header';
import { SidebarContent } from 'components/Sidebar/SidebarContent';
import { SettingsScreen } from 'pages/Settings';
import { ReaderScreen } from 'pages/Reader';
import { DrawerTab, RootStackParamList } from 'types';
import { BookListScreen } from 'pages/BookLists';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { GuideScreen } from 'pages/GuideScreen';

const Drawer = createDrawerNavigator<RootStackParamList>();

export const Sidebar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        sceneStyle: { paddingBottom: bottom, backgroundColor: theme.colors.background },
        header: ({ navigation, route, options }) => {
          const currentTab = route.name as DrawerTab;

          if (currentTab === 'Reader') return null;
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
        component={() => <BookListScreen tab = { "Reading Now" }/>}
        options={{ title: t('readingNow') }}
      />
      <Drawer.Screen
        name="Have Read"
        component={() => <BookListScreen tab = { "Have Read" }/>}
        options={{ title: t('haveRead') }}
      />
      <Drawer.Screen name="Guide" component={GuideScreen} options={{ title: t('guide') }} />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
      <Drawer.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ sceneStyle: { paddingBottom: 0 }, drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
