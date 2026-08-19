import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer, Text, useTheme } from 'react-native-paper';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { DrawerItem } from 'components/ui/DrawerItem';

export const SidebarContent = (props: DrawerContentComponentProps) => {
  const theme = useTheme();
  const activeRouteName = props.state.routes[props.state.index].name;
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      className="flex flex-col">
      <View className="items-center py-6">
        <Text className="mt-2 text-xl font-bold">{t('brand')}</Text>
      </View>

      <Drawer.Section className="flex gap-2 px-2">
        <DrawerItem
          label={t('readingNow')}
          icon="home"
          active={activeRouteName === 'Reading Now'}
          onPress={() => {
            props.navigation.navigate('Reading Now');
          }}
        />
        <DrawerItem
          label={t('haveRead')}
          icon="book"
          active={activeRouteName === 'Have Read'}
          onPress={() => {
            props.navigation.navigate('Have Read');
          }}
        />
      </Drawer.Section>

      <Drawer.Section showDivider={false} className="flex gap-2 px-2">
        <DrawerItem
          label={t('guide')}
          icon="help-circle-outline"
          active={activeRouteName === 'Guide'}
          onPress={() => {
            props.navigation.navigate('Guide');
          }}
        />
        <DrawerItem
          label={t('settings')}
          icon="cog"
          active={activeRouteName === 'Settings'}
          onPress={() => {
            props.navigation.navigate('Settings');
          }}
        />
      </Drawer.Section>

      <View className="flex-1 items-start justify-end px-2">
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          v{Constants.expoConfig?.version ?? '—'}
        </Text>
      </View>
    </SafeAreaView>
  );
};
