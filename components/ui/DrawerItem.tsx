import * as React from 'react';
import { Drawer } from 'react-native-paper';

type DrawerItemProps = React.ComponentProps<typeof Drawer.Item>;

export const DrawerItem = ({ style, ...props }: DrawerItemProps) => {
  return <Drawer.Item {...props} style={[{ borderRadius: 8 }, style]} />;
};
