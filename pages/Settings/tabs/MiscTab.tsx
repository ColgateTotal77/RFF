import { List, Switch, Text } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';

export const MiscTab = () => {
  const {
    settings: { autoCardOnDoubleTap },
    updateSettings,
  } = useBookStore();

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        Misc
      </Text>

      <List.Item
        title="Auto card update on double click"
        description="When you translate word on double click also update/create card"
        right={() => (
          <Switch
            value={autoCardOnDoubleTap}
            onValueChange={(value) => updateSettings({ autoCardOnDoubleTap: value })}
          />
        )}
      />
    </>
  );
};
