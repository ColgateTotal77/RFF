import { Animated, Dimensions, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Portal, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { Children, ReactElement, ReactNode, useEffect, useRef, useState } from 'react';

const ANIMATION_DURATION = 90;
const ELEVATION_LEVELS = ['level0', 'level1', 'level2', 'level3', 'level4', 'level5'] as const;

interface DropdownMenuItemProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

const DropdownMenuItem = ({ title, onPress, disabled, icon }: DropdownMenuItemProps) => {
  const theme = useTheme();
  const [highlighted, setHighlighted] = useState(false);
  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setHighlighted(true)}
      onPressOut={() => setHighlighted(false)}
      style={[styles.item, highlighted && { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.itemContent}>
        {icon}
        <Text style={{ color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface }}>
          {title}
        </Text>
      </View>
    </TouchableRipple>
  );
};

interface DropdownMenuProps {
  visible: boolean;
  onDismiss: () => void;
  anchor: ReactElement;
  children?: ReactNode;
  style?: ViewStyle;
  elevation?: number;
}

export const DropdownMenu = ({
  visible,
  onDismiss,
  anchor,
  children,
  style,
  elevation = 4,
}: DropdownMenuProps) => {
  const theme = useTheme();
  const anchorRef = useRef<View>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hasItems = Children.toArray(children).length > 0;

  const animateTo = (toValue: number, onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(scale, { toValue, duration: ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(opacity, { toValue, duration: ANIMATION_DURATION, useNativeDriver: true }),
    ]).start(onDone);
  };

  useEffect(() => {
    if (!visible || !hasItems) {
      if (position) animateTo(0, () => setPosition(null));
      return;
    }
    anchorRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      const windowWidth = Dimensions.get('window').width;
      setPosition({
        top: pageY + height + 4,
        right: Math.max(8, windowWidth - (pageX + width)),
      });
      scale.setValue(0);
      opacity.setValue(0);
      animateTo(1);
    });
  }, [visible, hasItems]);

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {anchor}
      </View>
      {position && hasItems && (
        <Portal>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
          <Animated.View
            style={[
              styles.menu,
              {
                top: position.top,
                right: position.right,
                backgroundColor:
                  theme.colors.elevation[ELEVATION_LEVELS[Math.min(5, Math.max(0, elevation))]],
                elevation,
                opacity,
                transform: [{ scale }],
              },
              style,
            ]}>
            {children}
          </Animated.View>
        </Portal>
      )}
    </>
  );
};

DropdownMenu.Item = DropdownMenuItem;

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    minWidth: 160,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
