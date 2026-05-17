import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text, Button, Switch, List } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { updateNestedMapping } from 'lib/utils';
import { useAnkiStore } from 'stores/useAnkiStore';

export const AnkiTab = () => {
  const {
    settings: {
      ankiDeckId,
      ankiModelId,
      mirroredAnkiModelId,
      isTwoSided,
      fieldMappings,
      mirroredFieldMappings,
    },
    updateSettings,
  } = useBookStore();
  const hasPermission = useAnkiStore((state) => state.hasPermission);
  const requestPermission = useAnkiStore((state) => state.requestPermission);
  const decks = useAnkiStore((state) => state.decks);
  const models = useAnkiStore((state) => state.models);
  const fields = useAnkiStore((state) => state.fields);
  const mirroredFields = useAnkiStore((state) => state.mirroredFields);
  const loadFieldsInto = useAnkiStore((state) => state.loadFieldsInto);

  const key = `${ankiDeckId}:${ankiModelId}`;
  const mirroredKey = `${ankiDeckId}:${mirroredAnkiModelId}`;

  const updateFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      fieldMappings: updateNestedMapping(fieldMappings, key, partialMapping),
    });
  };

  const updateMirroredFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      mirroredFieldMappings: updateNestedMapping(
        mirroredFieldMappings,
        mirroredKey,
        partialMapping
      ),
    });
  };

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        Anki Integration
      </Text>

      {!hasPermission ? (
        <Button mode="contained" onPress={requestPermission} icon="database-plus">
          Connect to AnkiDroid
        </Button>
      ) : (
        <View>
          <Text className="text-green-700">✓ Connected to AnkiDroid</Text>

          <Dropdown
            label="Decks"
            value={ankiDeckId}
            options={decks}
            onSelect={(value) => {
              updateSettings({ ankiDeckId: value });
            }}
          />
          <Dropdown
            label="Model"
            value={ankiModelId}
            options={models}
            onSelect={(value) => {
              updateSettings({
                ankiModelId: value,
                mirroredAnkiModelId: mirroredAnkiModelId ? mirroredAnkiModelId : ankiModelId,
              });
              loadFieldsInto(ankiModelId, 'fields');
            }}
          />
        </View>
      )}
      {fields.length > 0 && (
        <>
          <FieldMappingSection
            title="Field Mapping"
            fieldMapping={fieldMappings[key]}
            fields={fields}
            onUpdate={updateFieldMapping}
          />

          <List.Item
            title="Two-sided deck"
            description="Create mirrored cards (front↔back)"
            right={() => (
              <Switch
                value={isTwoSided}
                onValueChange={(value) => updateSettings({ isTwoSided: value })}
              />
            )}
          />

          {isTwoSided && (
            <>
              <Dropdown
                label="Mirrored Model"
                value={mirroredAnkiModelId}
                options={models}
                onSelect={(value) => {
                  updateSettings({ mirroredAnkiModelId: value });
                  loadFieldsInto(mirroredAnkiModelId, 'mirroredFields');
                }}
              />
              <FieldMappingSection
                title="Mirrored Field Mapping"
                fieldMapping={mirroredFieldMappings[mirroredKey]}
                fields={mirroredFields}
                onUpdate={updateMirroredFieldMapping}
              />
            </>
          )}
        </>
      )}
    </>
  );
};
