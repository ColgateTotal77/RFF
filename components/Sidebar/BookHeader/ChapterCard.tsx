import { Chapter } from 'types';
import { Card, Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';

interface Props {
  chapter: Chapter;
  onPress: () => void;
  isCurrentChapter: boolean;
}


export const ChapterCard = ({ chapter, onPress, isCurrentChapter }: Props) => {
  return (
    <Card style={isCurrentChapter ? { backgroundColor: '#1e40af' } : undefined} onPress={onPress}>
      <View className="flex justify-between p-4">
        <Text>{chapter.title}</Text>
        <Text className="text-gray-500 text-[10px]">{JSON.stringify(chapter.blockIds)}</Text> {/*TEMP*/}
      </View>
    </Card>
  );
};
