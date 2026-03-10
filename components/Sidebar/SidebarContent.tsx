import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer, Text } from 'react-native-paper';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerTab } from 'types';

export const SidebarContent = (props: DrawerContentComponentProps) => {
  const [active, setActive] = useState<DrawerTab>('Reading Now');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center py-6">
        <Text className="mt-2 text-xl font-bold">RFF</Text>
      </View>

      <Drawer.Section className="px-2">
        <Drawer.Item
          label="Reading Now"
          icon="home"
          active={active === 'Reading Now'}
          onPress={() => {
            setActive('Reading Now');
            props.navigation.navigate('Reading Now');
          }}
          className="rounded-lg"
        />
      </Drawer.Section>

      <Drawer.Section showDivider={false} className="px-2">
        <Drawer.Item
          label="Settings"
          icon="cog"
          active={active === 'Settings'}
          onPress={() => {
            setActive('Settings');
            props.navigation.navigate('Settings');
          }}
          className="rounded-lg"
        />
      </Drawer.Section>
    </SafeAreaView>
  );
};
