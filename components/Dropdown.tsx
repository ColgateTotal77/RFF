import { useState, useRef } from 'react';
import { Button, Menu, Text } from 'react-native-paper';
import { View, LayoutChangeEvent } from 'react-native';

interface Props {
  label?: string;
  value: string | undefined;
  options: { id: string; name: string }[];
  onSelect: (id: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const Dropdown = (props: Props) => {
  const {
    label,
    value,
    options,
    onSelect,
    isLoading = false,
    placeholder = 'Select an option',
  } = props;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [menuWidth, setMenuWidth] = useState<number>(0);
  const isTogglingRef = useRef<boolean>(false);

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const handleToggle = () => {
    if (!isTogglingRef.current) {
      isTogglingRef.current = true;
      setIsOpen(!isOpen);
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 100);
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setMenuWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="flex gap-4">
      <Text variant="labelLarge" className="mb-1 text-gray-600">
        {label}
      </Text>
      <View onLayout={onLayout} className="w-full">
        <Menu
          visible={isOpen}
          onDismiss={() => setIsOpen(false)}
          anchorPosition="bottom"
          contentStyle={{ width: menuWidth }}
          anchor={
            <Button
              mode="outlined"
              onPress={handleToggle}
              loading={isLoading}
              icon="chevron-down"
              contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              {displayLabel}
            </Button>
          }>
          {options.map((option) => (
            <Menu.Item
              key={option.id}
              title={option.name}
              onPress={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
            />
          ))}
        </Menu>
      </View>
    </View>
  );
};
