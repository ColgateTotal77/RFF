import { create } from 'zustand';
import { Linking, PermissionsAndroid } from 'react-native';
import { Anki } from 'modules/book-engine';
import { updateNestedMapping } from 'lib/utils';
import { useAppStore } from './useAppStore';
import { Toast } from 'components/ui/Toast';
import i18n from 'i18n';

const ANKI_PERMISSION = 'com.ichi2.anki.permission.READ_WRITE_DATABASE';

type FieldsSlot = 'fields' | 'mirroredFields' | 'bookFields' | 'bookMirroredFields';

type Store = {
  hasPermission: boolean;
  isInstalled: boolean;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  checkIsAnkiInstalled: () => Promise<void>;
  loadAnkiData: () => Promise<void>;
  loadFieldsInto: (modelId: string, slot: FieldsSlot) => Promise<number>;
  applyDefaultModel: (deckId: string) => Promise<void>;
  createDeck: (deckName: string) => Promise<string>;
  decks: { id: string; name: string }[];
  models: { id: string; name: string }[];
  fields: { id: number; name: string }[];
  mirroredFields: { id: number; name: string }[];

  bookFields: { id: number; name: string }[];
  bookMirroredFields: { id: number; name: string }[];
};

export const useAnkiStore = create<Store>()((set, get) => ({
  hasPermission: false,
  isInstalled: false,
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
    } else {
      // Permission revoked or not yet granted — reflect it so the UI
      // (e.g. the banner) doesn't keep showing a stale "connected" state.
      set({ hasPermission: false });
    }
  },

  checkIsAnkiInstalled: async () => {
    try {
      set({ isInstalled: await Anki.isInstalled() });
    } catch {
      set({ isInstalled: false });
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
      if (!get().isInstalled) {
        Toast.show(i18n.t('toast.ankiDroidNotInstalled'), 'error', () =>
          Linking.openURL('market://details?id=com.ichi2.anki')
        );
        return;
      }

      const granted = await PermissionsAndroid.request(ANKI_PERMISSION as never, {
        title: i18n.t('ankiTab.title'),
        message: i18n.t('ankiTab.permissionMessage'),
        buttonPositive: i18n.t('common.allow'),
        buttonNegative: i18n.t('common.cancel'),
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        set({ hasPermission: true });
        get().loadAnkiData();
      } else {
        Toast.show(i18n.t('toast.ankiPermissionDenied'), 'error');
      }
    } catch (err) {
      console.warn(err);
      Toast.show(i18n.t('toast.failedToRequestAnkiPermission'), 'error');
    }
  },

  createDeck: async (deckName: string) => {
    const deckId = (await Anki.createDeck(deckName)).toString();
    return deckId.toString();
  },
}));
