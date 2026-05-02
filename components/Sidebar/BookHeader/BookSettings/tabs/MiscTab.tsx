import { Text, Switch, List } from 'react-native-paper';
import { Dropdown } from 'components/Dropdown';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { LANGUAGE_OPTIONS } from 'lib/constants';
import { View } from 'react-native';

export const MiscTab = () => {
  const {
    settings: { autoCardOnDoubleTap, bookLang, targetLang },
  } = useCurrentBook();
  const { updateBookSettings } = useBookStore();

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        Misc
      </Text>

      <View className="flex gap-4">
        <Dropdown
          label="Book language"
          value={bookLang}
          options={LANGUAGE_OPTIONS.map((l) => ({ id: l.code, name: l.name }))}
          onSelect={(value) => updateBookSettings({ bookLang: value })}
        />
        <Dropdown
          label="Target language"
          value={targetLang}
          options={LANGUAGE_OPTIONS.map((l) => ({ id: l.code, name: l.name }))}
          onSelect={(value) => updateBookSettings({ targetLang: value })}
        />
      </View>

      <List.Item
        title="Auto card update on double click"
        description="When you translate word on double click also update/create card"
        right={() => (
          <Switch
            value={autoCardOnDoubleTap}
            onValueChange={(value) => updateBookSettings({ autoCardOnDoubleTap: value })}
          />
        )}
      />
    </>
  );
};
