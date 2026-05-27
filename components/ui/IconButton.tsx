import * as React from 'react';
import { IconButton as PaperIconButton, IconButtonProps } from 'react-native-paper';

export const IconButton = ({ style, contentStyle, ...props }: IconButtonProps) => {
  return <PaperIconButton {...props} style={[{ borderRadius: 8 }, style]} />;
};
