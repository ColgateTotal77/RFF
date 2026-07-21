import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Appearance } from 'react-native';
import { Theme, Settings, DeepPartial, DrawerTab } from 'types';
import { navigationRef } from 'lib/navigation';
import { useWebViewStore } from './useWebViewStore';
import i18n from 'i18n';
import { appLanguageToBookLanguage } from 'lib/langHelper';
import { DEFAULT_FONT_FAMILY } from 'lib/constants';
import { deepMerge } from 'lib/utils';
import * as DocumentPicker from 'expo-document-picker';
import { useBookStore } from 'stores/useBookStore';

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
  toggleTheme: () => void;
  updateSettings: (toUpdate: DeepPartial<Settings>) => void;
  setGlobalLoading: (globalLoading: { isLoading: boolean; message: string }) => void;
  navigate: (route: DrawerTab) => void;
  importBook: (uri: string) => Promise<void>;
  pickDocument: () => Promise<void>;
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
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

      setGlobalLoading: (globalLoading) => set({ globalLoading }),

      navigate: (route) => {
        if (navigationRef.isReady()) navigationRef.navigate(route);
      },

      importBook: async (path) => {
        const { setGlobalLoading } = get();
        try {
          setGlobalLoading({ isLoading: true, message: 'Importing book…' });
          useBookStore.getState().loadBook(path);
        } catch (e) {
          console.error('Failed to import book:', e);
          setGlobalLoading({ isLoading: false, message: '' });
        }
      },

      pickDocument: async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/epub+zip',
            'application/x-fictionbook+xml',
            'application/zip',
            'application/octet-stream',
          ],
          copyToCacheDirectory: true,
        });

        if (!result.canceled) await get().importBook(result.assets[0].uri);
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
