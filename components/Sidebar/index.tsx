import { createDrawerNavigator } from '@react-navigation/drawer';
import { getHeaderTitle } from '@react-navigation/elements';
import { Header } from 'components/Sidebar/Header';
import { SidebarContent } from 'components/Sidebar/SidebarContent';
import { SettingsScreen } from 'pages/Settings';
import { ReaderScreen } from 'pages/Reader';
import { DrawerTab, RootStackParamList } from 'types';
import { BookListScreen } from 'pages/BookLists';
import { useTranslation } from 'react-i18next';
import { useTempStore } from 'stores/useTempStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

const Drawer = createDrawerNavigator<RootStackParamList>();

const ReadingScreen = ({ haveRead }: { haveRead: boolean }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });
  const query = useTempStore((state) => state.bookListQuery).toLowerCase();

  return (
    <BookListScreen
      filterFn={(book) =>
        (haveRead ? book.misc.haveRead : !book.misc.haveRead) &&
        book.title.toLowerCase().includes(query)
      }
      toggleLabel={haveRead ? t('haveRead') : t('readingNow')}
    />
  );
};

const ReadingNowScreen = () => <ReadingScreen haveRead={false} />;
const HaveReadScreen = () => <ReadingScreen haveRead={true} />;

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
        component={ReadingNowScreen}
        options={{ title: t('readingNow') }}
      />
      <Drawer.Screen
        name="Have Read"
        component={HaveReadScreen}
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
        options={{ sceneStyle: { paddingBottom: 0 }, drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>
  );
};
