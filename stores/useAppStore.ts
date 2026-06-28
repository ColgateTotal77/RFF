import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Appearance } from 'react-native';
import { Theme, Settings, DeepPartial } from 'types';
import { useWebViewStore } from './useWebViewStore';
import i18n from 'i18n';
import { LanguageCode, BOOK_LANGUAGE_OPTIONS, FALLBACK_LANGUAGE } from 'lib/langHelper';
import { DEFAULT_FONT_FAMILY } from 'lib/constants';
import { deepMerge } from 'lib/utils';

const mmkvStorage = createMMKV({ id: 'app-storage' });

const zustandStorage: StateStorage = {
  setItem: (name, value) => mmkvStorage.set(name, value),
  getItem: (name) => mmkvStorage.getString(name) ?? null,
  removeItem: (name) => mmkvStorage.remove(name),
};

type Store = {
  theme: Theme;
  toggleTheme: () => void;
  settings: Settings;
  updateSettings: (toUpdate: DeepPartial<Settings>) => void;
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      settings: {
        ankiDeckId: '',
        ankiModelId: '',
        fieldMappings: {},
        mirroredAnkiModelId: '',
        mirroredFieldMappings: {},
        isTwoSided: false,
        autoCardOnDoubleTap: false,
        targetLang:
          i18n.language in BOOK_LANGUAGE_OPTIONS
            ? (i18n.language as LanguageCode)
            : FALLBACK_LANGUAGE,
        font: { fontSize: 30, fontFamily: DEFAULT_FONT_FAMILY },
      },
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      updateSettings: (toUpdate) =>
        set((state) => ({
          settings: deepMerge(state.settings, toUpdate),
        })),
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
        if (useWebViewStore.getState().isWebViewReady) {
          useWebViewStore
            .getState()
            .executeImmediateActions([{ type: 'setTheme', theme: nextTheme }]);
        } else {
          useWebViewStore.getState().addToPostLoadQueue({ type: 'setTheme', theme: nextTheme });
        }
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
