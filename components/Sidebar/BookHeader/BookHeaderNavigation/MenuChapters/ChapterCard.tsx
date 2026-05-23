import { Card, Text, IconButton } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';
import { TocItem } from 'types';

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

  const indentStyle = { marginLeft: (tocItem.level) * 16 };
  const textColor = isCurrentChapter ? 'text-white' : 'text-black';
  const iconColor = isCurrentChapter ? '#ffffff' : '#6b7280';
  const backgroundColor = isCurrentChapter ? { backgroundColor: '#1e40af' } : undefined;

  return (
    <Card style={[backgroundColor, indentStyle]} onPress={onPress}>
      <View className="flex flex-row items-center justify-between p-4">
        <Text className={textColor}>{tocItem.title}</Text>

        {hasChildren && (
          <IconButton
            icon={isExpanded ? 'chevron-down' : 'chevron-right'}
            iconColor={iconColor}
            onPress={onToggle}
            size={20}
          />
        )}
      </View>
    </Card>
  );
};
