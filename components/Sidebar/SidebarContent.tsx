import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer, Text } from 'react-native-paper';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

export const SidebarContent = (props: DrawerContentComponentProps) => {
  const activeRouteName = props.state.routes[props.state.index].name;
  const { t } = useTranslation('translation', { keyPrefix: 'sidebar' });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center py-6">
        <Text className="mt-2 text-xl font-bold">{t('brand')}</Text>
      </View>

      <Drawer.Section className="flex gap-2 px-2">
        <Drawer.Item
          label={t('readingNow')}
          icon="home"
          active={activeRouteName === 'Reading Now'}
          onPress={() => {
            props.navigation.navigate('Reading Now');
          }}
          className="rounded-lg"
        />
        <Drawer.Item
          label={t('haveRead')}
          icon="book"
          active={activeRouteName === 'Have Read'}
          onPress={() => {
            props.navigation.navigate('Have Read');
          }}
          className="rounded-lg"
        />
      </Drawer.Section>

      <Drawer.Section showDivider={false} className="px-2">
        <Drawer.Item
          label={t('settings')}
          icon="cog"
          active={activeRouteName === 'Settings'}
          onPress={() => {
            props.navigation.navigate('Settings');
          }}
          className="rounded-lg"
        />
      </Drawer.Section>
    </SafeAreaView>
  );
};
