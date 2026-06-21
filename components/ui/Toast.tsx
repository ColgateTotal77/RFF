import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { create } from 'zustand';

type ToastType = 'default' | 'error';

type ToastStore = {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
};

const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  message: '',
  type: 'default',
  show: (message, type = 'default') => set({ visible: true, message, type }),
  hide: () => set({ visible: false }),
}));

export const Toast = {
  show: (message: string, type: ToastType = 'default') =>
    useToastStore.getState().show(message, type),
  hide: () => useToastStore.getState().hide(),
};

export const AppToast = () => {
  const { colors } = useTheme();
  const { visible, message, type, hide } = useToastStore();
  const translateX = useRef(new Animated.Value(400)).current;
  const timerRef = useRef<number>(null);

  const bg = type === 'error' ? colors.errorContainer : colors.inverseSurface;
  const fg = type === 'error' ? colors.onErrorContainer : colors.inverseOnSurface;

  useEffect(() => {
    if (!visible) return;

    clearTimeout(timerRef.current!);
    translateX.setValue(400);
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(translateX, { toValue: 400, duration: 250, useNativeDriver: true }).start(
        hide
      );
    }, 3000);
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute right-4 top-32 z-50 rounded-xl px-4 py-3"
      style={{ backgroundColor: bg, transform: [{ translateX }] }}>
      <Text style={{ color: fg }} variant="bodyMedium">
        {message}
      </Text>
    </Animated.View>
  );
};
