import { Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Loading } from 'components/ui/Loading';
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from 'stores/useAppStore';

export const GlobalLoading = () => {
  const globalLoading = useAppStore((state) => state.globalLoading);
  const { colors } = useTheme();
  const [isMounted, setIsMounted] = useState(globalLoading.isLoading);
  const [message, setMessage] = useState(globalLoading.message);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (globalLoading.isLoading) {
      setMessage(globalLoading.message);
      setIsMounted(true);
      opacity.setValue(1);
    } else if (isMounted) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [globalLoading.isLoading, globalLoading.message, isMounted, opacity]);

  if (!isMounted) return null;

  return (
    <Animated.View
      className="absolute inset-0"
      style={{ opacity, backgroundColor: colors.background }}>
      <Loading message={message} />
    </Animated.View>
  );
};
