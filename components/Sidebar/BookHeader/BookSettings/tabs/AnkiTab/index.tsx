import { View } from 'react-native';
import { Anki } from 'modules/book-engine';
import { useEffect, useState } from 'react';
import { Dropdown } from 'components/Dropdown';
import { Text, Switch, List } from 'react-native-paper';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'components/Sidebar/BookHeader/BookSettings/tabs/AnkiTab/FieldMappingSection';

const isInherited = (bookValue: any) => bookValue === undefined;

export const AnkiTab = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const { updateBookSettings } = useBookStore();

  const getInheritedValue = <T,>(bookValue: T | undefined, globalValue: T) => {
    return bookValue !== undefined ? bookValue : globalValue;
  };

  const ankiDeckId = getInheritedValue(currentBook.settings.ankiDeckId, settings.ankiDeckId);
  const ankiModelId = getInheritedValue(currentBook.settings.ankiModelId, settings.ankiModelId);
  const mirroredAnkiModelId = getInheritedValue(currentBook.settings.mirroredAnkiModelId, settings.mirroredAnkiModelId);
  const isTwoSided = getInheritedValue(currentBook.settings.isTwoSided, settings.isTwoSided);
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [mirroredFields, setMirroredFields] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const loadAnkiData = async () => {
      try {
        const [decks, models] = await Promise.all([Anki.getDecks(), Anki.getModels()]);
        setDecks(decks);
        setModels(models);
      } catch (error) {
        console.error('Failed to load Anki decks:', error);
        setDecks([]);
        setModels([]);
      }
    };

    loadAnkiData();
  }, []);

  useEffect(() => {
    if (!ankiModelId) return;

    const getFields = async () => {
      try {
        const result = await Anki.getFields(ankiModelId);
        const fieldsArr = typeof result === 'string' ? JSON.parse(result) : result;
        const fields = fieldsArr.map((field: string, index: number) => ({
          id: index,
          name: field,
        }));
        updateMapping('fieldMapping', { fieldCount: fields.length, modalId: ankiModelId });
        setFields(fields);
      } catch (err) {
        console.error('Failed to get fields:', err);
      }
    };

    getFields();
  }, [ankiModelId]);

  useEffect(() => {
    if (!mirroredAnkiModelId) return;

    const getMirroredFields = async () => {
      try {
        const result = await Anki.getFields(mirroredAnkiModelId);
        const fieldsArr = typeof result === 'string' ? JSON.parse(result) : result;
        const fields = fieldsArr.map((field: string, index: number) => ({ id: index, name: field }));
        updateMapping('mirroredFieldMapping', { fieldCount: fields.length, modalId: mirroredAnkiModelId });
        setMirroredFields(fields);
      } catch (err) {
        console.error('Failed to get mirrored fields:', err);
      }
    };

    getMirroredFields();
  }, [mirroredAnkiModelId]);

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
          onSelect={(value) =>
            updateBookSettings({
              ankiModelId: value,
              mirroredAnkiModelId: mirroredAnkiModelId ? mirroredAnkiModelId : ankiModelId,
            })
          }
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
                onSelect={(value) => updateBookSettings({ mirroredAnkiModelId: value })}
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
  );
};
