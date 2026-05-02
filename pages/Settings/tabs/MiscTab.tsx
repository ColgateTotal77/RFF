import { List, Switch, Text } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { Dropdown } from 'components/Dropdown';
import { LANGUAGE_OPTIONS } from 'lib/constants';

export const MiscTab = () => {
  const {
    settings: { autoCardOnDoubleTap, targetLang },
    updateSettings,
  } = useBookStore();

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        Misc
      </Text>

      <Dropdown
        label="Default target language"
        value={targetLang}
        options={LANGUAGE_OPTIONS.map((l) => ({ id: l.code, name: l.name }))}
        onSelect={(value) => updateSettings({ targetLang: value })}
      />

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
