import { create } from 'zustand';
import { useBookStore } from './useBookStore';
import { useWebViewStore } from './useWebViewStore';

type Store = {
  toggleTheme: () => void;
};

export const useAppStore = create<Store>()((set) => ({
  toggleTheme: () => {
    const currentTheme = useBookStore.getState().settings.theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    useBookStore.getState().updateSettings({ theme: nextTheme });
    useWebViewStore.getState().executeImmediateActions([{ type: 'setTheme', theme: nextTheme }]);
  },
}));
