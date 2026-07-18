import * as React from 'react';
import { IconButton as PaperIconButton, IconButtonProps, useTheme } from 'react-native-paper';

export const IconButton = ({ style, contentStyle, iconColor, ...props }: IconButtonProps) => {
  const theme = useTheme();
  return (
    <PaperIconButton
      {...props}
      iconColor={iconColor ?? theme.colors.primary}
      style={[{ borderRadius: 8 }, style]}
    />
  );
};

export const IconButtonWithBorder = ({
  style,
  contentStyle,
  iconColor,
  ...props
}: IconButtonProps) => {
  const theme = useTheme();
  return (
    <PaperIconButton
      {...props}
      iconColor={iconColor ?? theme.colors.primary}
      style={[
        {
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        },
        style,
      ]}
    />
  );
};
