import { create } from 'zustand';
import { Alert, PermissionsAndroid } from 'react-native';
import { Anki } from 'modules/book-engine';
import { updateNestedMapping } from 'lib/utils';
import { useAppStore } from './useAppStore';
import { Toast } from 'components/ui/Toast';

const ANKI_PERMISSION = 'com.ichi2.anki.permission.READ_WRITE_DATABASE';

type FieldsSlot = 'fields' | 'mirroredFields' | 'bookFields' | 'bookMirroredFields';

type Store = {
  hasPermission: boolean;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  loadAnkiData: () => Promise<void>;
  loadFieldsInto: (modelId: string, slot: FieldsSlot) => Promise<number>;
  applyDefaultModel: (deckId: string) => Promise<void>;
  createDeck: (deckName: string) => Promise<string>;
  decks: { id: string; name: string }[];
  models: { id: string; name: string }[];
  fields: { id: number; name: string }[];
  mirroredFields: { id: number; name: string }[];
  hasDeck: () => boolean;

  bookFields: { id: number; name: string }[];
  bookMirroredFields: { id: number; name: string }[];
};

export const useAnkiStore = create<Store>()((set, get) => ({
  hasPermission: false,
  decks: [],
  models: [],
  fields: [],
  mirroredFields: [],
  bookFields: [],
  bookMirroredFields: [],

  checkPermission: async () => {
    const isGranted = await PermissionsAndroid.check(
      ANKI_PERMISSION as Parameters<typeof PermissionsAndroid.check>[0]
    );
    if (isGranted) {
      set({ hasPermission: true });
      get().loadAnkiData();
    }
  },

  loadFieldsInto: async (modelId, slot) => {
    if (!get().hasPermission) return 0;

    const rawFields = await Anki.getFields(modelId);
    const fields = rawFields.map((field: string, index: number) => ({
      id: index,
      name: field,
    }));

    set({ [slot]: fields } as Pick<Store, FieldsSlot>);
    return rawFields.length;
  },

  applyDefaultModel: async (deckId) => {
    const { settings, updateSettings } = useAppStore.getState();

    const sortedModels = [...get().models].sort((a, b) => Number(a.id) - Number(b.id)).slice(0, 1);

    let modelId: string | null = null;
    for (const model of sortedModels) {
      const fieldCount = (await Anki.getFields(model.id)).length;
      if (fieldCount === 2) {
        modelId = model.id;
        break;
      }
    }
    if (!modelId) return;

    const key = `${deckId}:${modelId}`;

    await get().loadFieldsInto(modelId, 'fields');
    updateSettings({
      ankiModelId: modelId,
      isTwoSided: false,
      fieldMappings: updateNestedMapping(settings.fieldMappings, key, {
        modalId: modelId,
        fieldCount: 3,
        word: 0,
        translation: 1,
      }),
    });
  },

  loadAnkiData: async () => {
    const {
      settings: { ankiModelId, mirroredAnkiModelId, ankiDeckId },
      updateSettings,
    } = useAppStore.getState();

    const [decks, models, fields, mirroredFields] = await Promise.all([
      Anki.getDecks(),
      Anki.getModels(),
      ankiModelId ? get().loadFieldsInto(ankiModelId, 'fields') : Promise.resolve(0),
      mirroredAnkiModelId
        ? get().loadFieldsInto(mirroredAnkiModelId, 'mirroredFields')
        : Promise.resolve(0),
    ]);

    set({ decks, models });

    if (!ankiDeckId) return;
    if (!fields) get().applyDefaultModel(ankiDeckId);
    if (!mirroredFields) updateSettings({ isTwoSided: false });
  },

  requestPermission: async () => {
    try {
      const granted = await PermissionsAndroid.request(ANKI_PERMISSION as never, {
        title: 'Anki Integration',
        message: 'Allow this app to send flashcards directly to your Anki database.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        set({ hasPermission: true });
        get().loadAnkiData();
      } else {
        Alert.alert('Permission Denied', 'Cannot connect to Anki without permission.');
      }
    } catch (err) {
      console.warn(err);
      Toast.show('Failed to request Anki permission', 'error');
    }
  },

  createDeck: async (deckName: string) => {
    const deckId = (await Anki.createDeck(deckName)).toString();
    return deckId.toString();
  },

  hasDeck: () => {
    return get().decks.length > 0;
  },
}));
