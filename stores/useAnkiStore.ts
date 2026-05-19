import { create } from 'zustand';
import { Alert, PermissionsAndroid } from 'react-native';
import { Anki } from 'modules/book-engine';

const ANKI_PERMISSION = 'com.ichi2.anki.permission.READ_WRITE_DATABASE';

type FieldsSlot = 'fields' | 'mirroredFields' | 'bookFields' | 'bookMirroredFields';

type Store = {
  hasPermission: boolean;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  loadAnkiData: () => Promise<void>;
  loadFieldsInto: (modelId: string, slot: FieldsSlot) => Promise<number>;
  decks: { id: string; name: string }[];
  models: { id: string; name: string }[];
  fields: { id: number; name: string }[];
  mirroredFields: { id: number; name: string }[];

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

  loadAnkiData: async () => {
    const { useBookStore } = await import('./useBookStore');
    const {
      settings: { ankiModelId, mirroredAnkiModelId },
    } = useBookStore.getState();
    const [decks, models, _fields, _mirroredFields] = await Promise.all([
      Anki.getDecks(),
      Anki.getModels(),
      get().loadFieldsInto(ankiModelId, 'fields'),
      get().loadFieldsInto(mirroredAnkiModelId, 'mirroredFields'),
    ]);

    set({ decks, models });
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
    }
  },
}));
