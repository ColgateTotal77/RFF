import * as React from 'react';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';

export const Button = ({ style, contentStyle, ...props }: ButtonProps) => {
  return (
    <PaperButton
      {...props}
      style={[{ borderRadius: 8 }, style]}
      contentStyle={[{ paddingVertical: 6 }, contentStyle]}
    />
  );
};
