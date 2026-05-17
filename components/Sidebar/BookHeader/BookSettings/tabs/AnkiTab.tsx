import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text, Switch, List, Button } from 'react-native-paper';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { useAnkiStore } from 'stores/useAnkiStore';
const isInherited = (bookValue: any) => bookValue === undefined;

export const AnkiTab = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const { updateBookSettings } = useBookStore();
  const hasPermission = useAnkiStore((state) => state.hasPermission);
  const requestPermission = useAnkiStore((state) => state.requestPermission);
  const decks = useAnkiStore((state) => state.decks);
  const models = useAnkiStore((state) => state.models);
  const fields = useAnkiStore((state) => state.bookFields);
  const mirroredFields = useAnkiStore((state) => state.bookMirroredFields);
  const loadFieldsInto = useAnkiStore((state) => state.loadFieldsInto);

  const getInheritedValue = <T,>(bookValue: T | undefined, globalValue: T) => {
    return bookValue !== undefined ? bookValue : globalValue;
  };

  const ankiDeckId = getInheritedValue(currentBook.settings.ankiDeckId, settings.ankiDeckId);
  const ankiModelId = getInheritedValue(currentBook.settings.ankiModelId, settings.ankiModelId);
  const mirroredAnkiModelId = getInheritedValue(
    currentBook.settings.mirroredAnkiModelId,
    settings.mirroredAnkiModelId
  );
  const isTwoSided = getInheritedValue(currentBook.settings.isTwoSided, settings.isTwoSided);

  const updateMapping = (
    mappingName: 'fieldMapping' | 'mirroredFieldMapping',
    partialData: Partial<FieldMapping>
  ) => {
    updateBookSettings({ [mappingName]: partialData });
  };

  const updateFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateMapping('fieldMapping', partialMapping);
  };

  const updateMirroredFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateMapping('mirroredFieldMapping', partialMapping);
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
        <>
          <View>
            <Text className="text-green-700">✓ Connected to AnkiDroid</Text>

            <Dropdown
              label="Decks"
              value={ankiDeckId}
              options={decks}
              onSelect={(value) => updateBookSettings({ ankiDeckId: value })}
              isGrayed={isInherited(currentBook.settings.ankiDeckId)}
            />
            <Dropdown
              label="Model"
              value={ankiModelId}
              options={models}
              onSelect={(value) => {
                updateBookSettings({ ankiModelId: value });
                loadFieldsInto(value, 'bookFields');
              }}
              isGrayed={isInherited(currentBook.settings.ankiModelId)}
            />
          </View>
          {fields.length > 0 && (
            <>
              <FieldMappingSection
                title="Field Mapping"
                fieldMapping={currentBook.settings.fieldMapping}
                defaultFieldMapping={
                  settings.fieldMappings[`${settings.ankiDeckId}:${settings.ankiModelId}`]
                }
                fields={fields}
                onUpdate={updateFieldMapping}
              />

              <List.Item
                title="Two-sided deck"
                description="Create mirrored cards (front↔back)"
                titleStyle={
                  isInherited(currentBook.settings.isTwoSided) ? { color: '#9ca3af' } : undefined
                }
                descriptionStyle={
                  isInherited(currentBook.settings.isTwoSided) ? { color: '#9ca3af' } : undefined
                }
                right={() => (
                  <Switch
                    value={isTwoSided}
                    onValueChange={(value) => updateBookSettings({ isTwoSided: value })}
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
                      updateBookSettings({ mirroredAnkiModelId: value });
                      loadFieldsInto(value, 'bookMirroredFields');
                    }}
                    isGrayed={isInherited(currentBook.settings.mirroredAnkiModelId)}
                  />
                  <FieldMappingSection
                    title="Mirrored Field Mapping"
                    fieldMapping={currentBook.settings.mirroredFieldMapping}
                    defaultFieldMapping={
                      settings.mirroredFieldMappings[
                        `${settings.ankiDeckId}:${settings.mirroredAnkiModelId}`
                      ]
                    }
                    fields={mirroredFields}
                    onUpdate={updateMirroredFieldMapping}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
