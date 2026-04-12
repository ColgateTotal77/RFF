import { Card, Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';
import { SearchResult } from 'types';

interface Props {
  searchItem: SearchResult;
  onPress: () => void;
  isCurrentSearch: boolean;
}

const highlightSearch = (text: string, searchQuery: string) => {
  if (!searchQuery) return <Text>{text}</Text>;

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <Text key={i} style={{ backgroundColor: '#fff59d', color: '#000' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </>
  );
};

export const SearchCard = (props: Props) => {
  const { searchItem, onPress, isCurrentSearch } = props;

  return (
    <Card style={isCurrentSearch ? { backgroundColor: '#1e40af' } : undefined} onPress={onPress}>
      <View className="flex justify-between p-4">
        <Text>{highlightSearch(searchItem.snippet, searchItem.query)}</Text>
        <Text>{searchItem.title}</Text>
      </View>
    </Card>
  );
};
