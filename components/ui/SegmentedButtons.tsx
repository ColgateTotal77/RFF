import * as React from 'react';
import { SegmentedButtons as PaperSegmentedButtons, useTheme } from 'react-native-paper';

type PaperSegmentedButtonsProps = React.ComponentProps<typeof PaperSegmentedButtons>;

export const SegmentedButtons = (props: PaperSegmentedButtonsProps) => {
  const theme = useTheme();

  return (
    <PaperSegmentedButtons
      {...props}
      theme={{
        ...theme,
        roundness: 1.6,
      }}
    />
  );
};
