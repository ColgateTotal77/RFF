import React from 'react';
import { Text, useTheme } from 'react-native-paper';
import SliderComponent from '@react-native-community/slider';

export type SliderProps = React.ComponentProps<typeof SliderComponent> & {
  label?: string;
};

export const Slider: React.FC<SliderProps> = ({ label, style, ...props }) => {
  const { colors } = useTheme();
  return (
    <>
      {label ? <Text>{label}</Text> : null}
      <SliderComponent
        style={[{ height: 40 }, style]}
        minimumTrackTintColor={props.minimumTrackTintColor ?? colors.primary}
        maximumTrackTintColor={props.maximumTrackTintColor ?? colors.onSurface}
        thumbTintColor={props.thumbTintColor ?? colors.primary}
        {...props}
      />
    </>
  );
};
