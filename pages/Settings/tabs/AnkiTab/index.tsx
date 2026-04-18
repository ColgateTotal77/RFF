import { PermissionsAndroid, View, Alert } from 'react-native';
import { Anki } from 'modules/book-engine';
import { useEffect, useState } from 'react';
import { Dropdown } from 'components/Dropdown';
import { ANKI_PERMISSION } from 'lib/constants';
import { Text, Button, Switch, List } from 'react-native-paper';
import { useBookStore } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';

export const AnkiTab = () => {
  const {
    settings: { ankiDeckId, ankiModelId, mirroredAnkiModelId, isTwoSided, fieldMapping, mirroredFieldMapping },
    updateSettings,
  } = useBookStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [mirroredFields, setMirroredFields] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const isGranted = await PermissionsAndroid.check(ANKI_PERMISSION as any);
      if (isGranted) {
        setHasPermission(true);
        loadAnkiData();
      }
    };
    checkPermission();
  }, []);

  const loadAnkiData = async () => {
    setIsLoading(true);
    try {
      const [decks, models] = await Promise.all([Anki.getDecks(), Anki.getModels()]);
      setDecks(decks);
      setModels(models);
    } catch (error) {
      console.error('Failed to load Anki decks:', error);
      setDecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ankiModelId) return;

    const getFields = async () => {
      try {
        const result = await Anki.getFields(ankiModelId.toString());
        const fieldsArr = typeof result === 'string' ? JSON.parse(result) : result;
        const fields = fieldsArr.map((field: string, index: number) => ({ id: index, name: field }));
        updateSettings({fieldMapping: {fieldCount: fields.length}});
        setFields(fields);
      } catch (err) {
        console.error('Failed to get fields:', err);
      }
    };

    getFields();
  }, [ankiModelId, updateSettings]);

  useEffect(() => {
    if (!mirroredAnkiModelId) return;

    const getMirroredFields = async () => {
      try {
        const result = await Anki.getFields(mirroredAnkiModelId.toString());
        const fieldsArr = typeof result === 'string' ? JSON.parse(result) : result;
        const fields = fieldsArr.map((field: string, index: number) => ({ id: index, name: field }));
        updateSettings({mirroredFieldMapping: {fieldCount: fields.length}});
        setMirroredFields(fields);
      } catch (err) {
        console.error('Failed to get mirrored fields:', err);
      }
    };

    getMirroredFields();
  }, [mirroredAnkiModelId, updateSettings]);

  const handleConnectAnki = async () => {
    try {
      const granted = await PermissionsAndroid.request(ANKI_PERMISSION as any, {
        title: 'Anki Integration',
        message: 'Allow this app to send flashcards directly to your Anki database.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasPermission(true);
        loadAnkiData();
      } else {
        Alert.alert('Permission Denied', 'Cannot connect to Anki without permission.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      fieldMapping: partialMapping,
    });
  };

  const updateMirroredFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      mirroredFieldMapping: partialMapping,
    });
  };

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        Anki Integration
      </Text>

      {!hasPermission ? (
        <Button mode="contained" onPress={handleConnectAnki} icon="database-plus">
          Connect to AnkiDroid
        </Button>
      ) : (
        <View>
          <Text className="text-green-700">✓ Connected to AnkiDroid</Text>

          <Dropdown
            label="Decks"
            value={ankiDeckId}
            options={decks}
            onSelect={(value) => updateSettings({ ankiDeckId: value })}
            isLoading={isLoading}
          />
          <Dropdown
            label="Model"
            value={ankiModelId}
            options={models}
            onSelect={(value) =>
              updateSettings({
                ankiModelId: value,
                mirroredAnkiModelId: mirroredAnkiModelId ? mirroredAnkiModelId : ankiModelId,
              })
            }
            isLoading={isLoading}
          />
        </View>
      )}
      {fields.length > 0 && (
        <>
          <FieldMappingSection
            title="Field Mapping"
            fieldMapping={fieldMapping}
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
                onSelect={(value) => updateSettings({ mirroredAnkiModelId: value })}
                isLoading={isLoading}
              />
              <FieldMappingSection
                title="Mirrored Field Mapping"
                fieldMapping={mirroredFieldMapping}
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
