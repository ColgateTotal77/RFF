import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Updates from 'expo-updates';
import { Button } from 'components/ui/Button';

export const CrashScreen = () => {
  const theme = useTheme();

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: theme.colors.background }}>
      <Text variant="titleLarge" style={{ color: theme.colors.onBackground, marginBottom: 20 }}>
        Something went wrong
      </Text>
      <Button mode="contained" onPress={() => Updates.reloadAsync()}>
        Restart app
      </Button>
    </View>
  );
};
