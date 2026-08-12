import { createContext, useCallback, useContext, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as RNScrollView,
  ScrollViewProps,
  View,
} from 'react-native';

type ScrollIntoView = (node: View | null, margin?: number) => void;

const ScrollIntoViewContext = createContext<ScrollIntoView | null>(null);

export const useScrollIntoView = () => useContext(ScrollIntoViewContext);

export const ScrollViewWithScrollControl = ({ children, onScroll, ...rest }: ScrollViewProps) => {
  const scrollRef = useRef<RNScrollView>(null);
  const scrollPosition = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  const scrollIntoView = useCallback<ScrollIntoView>((node, margin = 16) => {
    const viewport = scrollRef.current?.getNativeScrollRef();
    if (!node || !viewport) return;

    viewport.measureInWindow((_x, viewportY, _width, viewportHeight) => {
      node.measureInWindow((_nodeX, nodeY, _nodeWidth, nodeHeight) => {
        const hiddenBelow = nodeY + nodeHeight + margin - (viewportY + viewportHeight);
        const shift = Math.min(hiddenBelow, Math.max(0, nodeY - viewportY));
        if (shift <= 0) return;

        scrollRef.current?.scrollTo({ y: scrollPosition.current + shift, animated: true });
      });
    });
  }, []);

  return (
    <ScrollIntoViewContext.Provider value={scrollIntoView}>
      <RNScrollView ref={scrollRef} scrollEventThrottle={16} {...rest} onScroll={handleScroll}>
        {children}
      </RNScrollView>
    </ScrollIntoViewContext.Provider>
  );
};
