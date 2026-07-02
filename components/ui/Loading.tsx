import React, { useEffect, useRef, useState } from 'react';
import { View, Animated } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const Dot = ({ delay, color }: { delay: number; color: string }) => {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, { toValue: -10, duration: 350, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      className="mx-1.5 h-3 w-3 rounded-full"
      style={{ backgroundColor: color, transform: [{ translateY: bounce }] }}
    />
  );
};

export const Loading = ({ message = '' }: { message?: string }) => {
  const { colors } = useTheme();
  const [showMessage, setShowMessage] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const msgFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      setShowMessage(true);
      Animated.timing(msgFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      className="flex-1 items-center justify-center"
      style={{ opacity: fade, backgroundColor: colors.background }}>
      <View className="mb-6 flex-row items-center">
        <Dot delay={0} color={colors.primary} />
        <Dot delay={200} color={colors.primary} />
        <Dot delay={400} color={colors.primary} />
      </View>

      <Animated.View style={{ opacity: msgFade }}>
        {showMessage && (
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {message}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
};
