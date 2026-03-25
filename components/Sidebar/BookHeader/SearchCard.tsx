import { SearchResultWithTitle } from 'types';
import { Card, Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';

interface Props {
  searchItem: SearchResultWithTitle;
  onPress: () => void;
  isCurrentSearch: boolean;
}

export const SearchCard = ({ searchItem, onPress, isCurrentSearch }: Props) => {
  return (
    <Card style={isCurrentSearch ? { backgroundColor: '#1e40af' } : undefined} onPress={onPress}>
      <View className="flex justify-between p-4">
        <Text>{searchItem.snippet}</Text>
        <Text>{searchItem.chapterTitle}</Text>
      </View>
    </Card>
  );
};
