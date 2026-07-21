import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { create } from 'zustand';

type ToastType = 'default' | 'error';

type ToastStore = {
  visible: boolean;
  message: string;
  type: ToastType;
  onPress?: () => void;
  show: (message: string, type?: ToastType, onPress?: () => void) => void;
  hide: () => void;
};

const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  message: '',
  type: 'default',
  show: (message, type = 'default', onPress) => set({ visible: true, message, type, onPress }),
  hide: () => set({ visible: false, onPress: undefined }),
}));

export const Toast = {
  show: (message: string, type: ToastType = 'default', onPress?: () => void) =>
    useToastStore.getState().show(message, type, onPress),
  hide: () => useToastStore.getState().hide(),
};

export const AppToast = () => {
  const { colors } = useTheme();
  const visible = useToastStore((state) => state.visible);
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const hide = useToastStore((state) => state.hide);
  const onPress = useToastStore((state) => state.onPress);
  const translateX = useRef(new Animated.Value(400)).current;
  const timerRef = useRef<number>(null);

  const bg = type === 'error' ? colors.errorContainer : colors.inverseSurface;
  const fg = type === 'error' ? colors.onErrorContainer : colors.inverseOnSurface;

  useEffect(() => {
    if (!visible) return;

    clearTimeout(timerRef.current!);
    translateX.setValue(400);
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();

    timerRef.current = setTimeout(
      () => {
        Animated.timing(translateX, { toValue: 400, duration: 250, useNativeDriver: true }).start(
          hide
        );
      },
      onPress ? 10000 : 4000
    );
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute right-4 top-32 z-50 max-w-[75%] rounded-xl"
      style={{ backgroundColor: bg, transform: [{ translateX }] }}>
      <Pressable onPress={onPress} disabled={!onPress} className="px-4 py-3">
        <Text style={{ color: fg }} variant="bodyMedium">
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
