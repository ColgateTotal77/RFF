import { Card, Text, useTheme } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';
import { SearchResult } from 'types';

interface Props {
  searchItem: SearchResult;
  onPress: () => void;
  isCurrentSearch: boolean;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightSearch = (text: string, searchQuery: string) => {
  if (!searchQuery) return <Text>{text}</Text>;

  const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));

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
  const theme = useTheme();

  return (
    <Card
      style={isCurrentSearch ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
      onPress={onPress}>
      <View className="flex justify-between p-4">
        <Text>{highlightSearch(searchItem.snippet, searchItem.query)}</Text>
        <Text>{searchItem.title + ' ' + '[' + searchItem.blockId + ']'}</Text>
      </View>
    </Card>
  );
};
