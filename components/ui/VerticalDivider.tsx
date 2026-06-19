import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

export const VerticalDivider = () => {
  const theme = useTheme();

  return <View style={{ marginVertical: 4, width: 1, backgroundColor: theme.colors.outline }} />;
};
