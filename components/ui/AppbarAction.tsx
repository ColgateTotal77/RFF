import * as React from 'react';
import { Appbar } from 'react-native-paper';

type AppbarActionProps = React.ComponentProps<typeof Appbar.Action>;

export const AppbarAction = ({ style, ...props }: AppbarActionProps) => {
  return <Appbar.Action {...props} style={[{ borderRadius: 8 }, style]} />;
};
