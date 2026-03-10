import { Chapter } from 'types';
import { Card, Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';

interface Props {
  chapter: Chapter;
  onPress: () => void;
}

export const ChapterCard = ({ chapter, onPress }: Props) => {
  return (
    <Card onPress={onPress}>
      <View className="flex justify-between p-4">
        <Text>{chapter.title}</Text>
      </View>
    </Card>
  );
};
