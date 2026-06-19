import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { Appearance } from 'react-native';
import { Theme } from 'types';
import { useWebViewStore } from './useWebViewStore';

const mmkvStorage = createMMKV({ id: 'app-storage' });

const zustandStorage: StateStorage = {
  setItem: (name, value) => mmkvStorage.set(name, value),
  getItem: (name) => mmkvStorage.getString(name) ?? null,
  removeItem: (name) => mmkvStorage.remove(name),
};

type Store = {
  theme: Theme;
  toggleTheme: () => void;
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: nextTheme });
        useWebViewStore.getState().executeImmediateActions([{ type: 'setTheme', theme: nextTheme }]);
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
