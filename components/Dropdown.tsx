import { useState, useRef } from 'react';
import { Button, Text } from 'react-native-paper';
import { View, Modal, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';

interface Props {
  label?: string;
  value: string | undefined;
  options: { id: string; name: string }[];
  onSelect: (id: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  isGrayed?: boolean;
}

export const Dropdown = (props: Props) => {
  const {
    label,
    value,
    options,
    onSelect,
    isLoading = false,
    placeholder = 'Select an option',
    isGrayed,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0, shouldPositionAbove: false, dropdownHeight: 0 });
  const buttonRef = useRef<View>(null);

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const handleOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const estimatedDropdownHeight = Math.min(options.length * 54, 400);
      const spaceBelow = screenHeight - (y + height + 4);
      const shouldPositionAbove = spaceBelow < estimatedDropdownHeight;
      const dropdownHeight = shouldPositionAbove ? estimatedDropdownHeight : 0;

      setDropdownLayout({ x, y, width, height, shouldPositionAbove, dropdownHeight });
      setIsOpen(true);
    });
  };

  return (
    <View className="flex gap-2">
      {label && (
        <Text
          variant="labelLarge"
          className="mb-1 text-gray-600"
          style={isGrayed ? { color: '#9ca3af' } : undefined}>
          {label}
        </Text>
      )}

      <View ref={buttonRef} collapsable={false} className="w-full">
        <Button
          mode="outlined"
          onPress={handleOpen}
          loading={isLoading}
          icon="chevron-down"
          contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}
          textColor={isGrayed ? '#9ca3af' : undefined}>
          {displayLabel}
        </Button>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        />

        <View
          style={{
            position: 'absolute',
            top: dropdownLayout.shouldPositionAbove
              ? dropdownLayout.y - dropdownLayout.dropdownHeight - 4
              : dropdownLayout.y + dropdownLayout.height + 4,
            left: dropdownLayout.x,
            width: dropdownLayout.width,
            backgroundColor: '#1e1e2e',
            borderRadius: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            maxHeight: 400,
            overflow: 'hidden',
          }}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.id);
                  setIsOpen(false);
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                }}>
                <Text
                  style={{
                    color: item.id === value ? '#a78bfa' : '#ffffff',
                    fontSize: 18,
                  }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};
