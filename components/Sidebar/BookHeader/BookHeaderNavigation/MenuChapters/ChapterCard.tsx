import { Card, Text, useTheme } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';
import { TocItem } from 'types';
import { IconButton } from 'components/ui/IconButton';
interface Props {
  tocItem: TocItem;
  hasChildren: boolean;
  isExpanded: boolean;
  isCurrentChapter: boolean;
  onPress: () => void;
  onToggle: () => void;
}

export const ChapterCard = ({
  tocItem,
  hasChildren,
  isExpanded,
  isCurrentChapter,
  onPress,
  onToggle,
}: Props) => {
  const theme = useTheme();
  const indentStyle = { marginLeft: tocItem.level * 16 };
  const backgroundColor = isCurrentChapter
    ? { backgroundColor: theme.colors.secondaryContainer }
    : undefined;

  return (
    <Card style={[backgroundColor, indentStyle]} onPress={onPress}>
      <View className="flex flex-row items-center justify-between p-4">
        <Text>{tocItem.title}</Text>

        {hasChildren && (
          <IconButton
            icon={isExpanded ? 'chevron-down' : 'chevron-right'}
            onPress={onToggle}
            size={20}
          />
        )}
      </View>
    </Card>
  );
};
