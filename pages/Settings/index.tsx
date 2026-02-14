import { PermissionsAndroid, View, Alert } from 'react-native';
import { Anki } from 'modules/book-engine';
import { useBookStore } from 'stores/useBookStore';
import { useEffect, useState } from 'react';
import { Dropdown } from 'components/Dropdown';
import { ANKI_PERMISSION } from 'lib/constants';
import { Card, Text, Button } from 'react-native-paper';

export const SettingsScreen = () => {
  const {
    settings: {
      defaultBookSettings: { ankiDeckId, ankiModelId },
    },
    updateSettings,
  } = useBookStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const isGranted = await PermissionsAndroid.check(ANKI_PERMISSION);
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
      const tempDecks = await Anki.getDecks();
      setDecks(tempDecks);
      const tempModels = await Anki.getModels();
      setModels(tempModels);
    } catch (error) {
      console.error('Failed to load Anki decks:', error);
      setDecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const f = async () => {
      const temp = await Anki.getFields(ankiModelId?.toString());
      console.log('Fields: ', temp.toString());
    };

    f();
  }, [ankiModelId]);

  const handleConnectAnki = async () => {
    try {
      const granted = await PermissionsAndroid.request(ANKI_PERMISSION, {
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

  return (
    <Card className="p-4">
      <Card.Content className="gap-4">
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
              onSelect={(value) => updateSettings({ defaultBookSettings: { ankiDeckId: value } })}
              isLoading={isLoading}
            />
            <Dropdown
              label="models"
              value={ankiModelId}
              options={models}
              onSelect={(value) => updateSettings({ defaultBookSettings: { ankiModelId: value } })}
              isLoading={isLoading}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};
