import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { AppbarAction } from 'components/ui/AppbarAction';
import { SearchInput } from 'components/ui/SearchInput';
import { useTempStore } from 'stores/useTempStore';
import { useTranslation } from 'react-i18next';

interface Props {
  leftContent: React.ReactNode;
}

export const SearchAction = ({ leftContent }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'search' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const bookListQuery = useTempStore((state) => state.bookListQuery);
  const setBookListQuery = useTempStore((state) => state.setBookListQuery);

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
          <SearchInput value={bookListQuery} onChangeText={setBookListQuery} autoFocus />
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
        accessibilityLabel={isSearchOpen ? t('closeSearch') : t('searchBooks')}
      />
    </>
  );
};
