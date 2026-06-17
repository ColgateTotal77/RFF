import { TextInput, useTheme } from 'react-native-paper';
import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { AppbarAction } from 'components/ui/AppbarAction';
import { useTempStore } from 'stores/useTempStore';

interface Props {
  leftContent: React.ReactNode;
}

export const SearchAction = ({ leftContent }: Props) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const setBookListQuery = useTempStore((state) => state.setBookListQuery);
  const theme = useTheme();

  const titleAnim = useRef(new Animated.Value(1)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  const openSearch = () => {
    setIsSearchOpen(true);
    Animated.timing(titleAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowSearch(true);
      Animated.timing(searchAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    Animated.timing(searchAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowSearch(false);
      setBookListQuery('');
      Animated.timing(titleAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const titleSlide = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });
  const searchSlide = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <>
      {showSearch ? (
        <Animated.View
          style={{ flex: 1, opacity: searchAnim, transform: [{ translateX: searchSlide }] }}>
          <TextInput
            value={bookListQuery}
            onChangeText={setBookListQuery}
            mode="flat"
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            returnKeyType="search"
            autoCapitalize="none"
            autoFocus
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: titleAnim,
            transform: [{ translateX: titleSlide }],
          }}>
          {leftContent}
        </Animated.View>
      )}

      <AppbarAction
        icon={isSearchOpen ? 'close' : 'magnify'}
        onPress={isSearchOpen ? closeSearch : openSearch}
      />
    </>
  );
};
