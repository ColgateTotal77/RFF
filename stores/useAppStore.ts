import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Appearance } from 'react-native';
import { Theme, Settings, DeepPartial, DrawerTab } from 'types';
import { navigationRef } from 'lib/navigation';
import i18n from 'i18n';
import { appLanguageToBookLanguage } from 'lib/langHelper';
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
  settings: Settings;
  globalLoading: { isLoading: boolean; message: string };
  setTheme: (theme: Theme) => void;
  updateSettings: (toUpdate: DeepPartial<Settings>) => void;
  setGlobalLoading: (globalLoading: { isLoading: boolean; message: string }) => void;
  navigate: (route: DrawerTab) => void;
};

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      settings: {
        ankiDeckId: '',
        ankiModelId: '',
        fieldMappings: {},
        mirroredAnkiModelId: '',
        mirroredFieldMappings: {},
        isTwoSided: false,
        autoCardOnDoubleTap: false,
        targetLang: appLanguageToBookLanguage(i18n.language),
        font: { fontSize: 30, fontFamily: DEFAULT_FONT_FAMILY },
      },
      globalLoading: { isLoading: false, message: '' },

      updateSettings: (toUpdate) =>
        set((state) => ({
          settings: deepMerge(state.settings, toUpdate),
        })),

      setTheme: (theme) => set({ theme }),

      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      navigate: (route) => {
        if (navigationRef.isReady()) navigationRef.navigate(route);
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
      }),
    }
  )
);
