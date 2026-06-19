import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

export const HorizontalDivider = () => {
  const theme = useTheme();

  return <View style={{ marginHorizontal: 4, height: 1, backgroundColor: theme.colors.outline }} />;
};
