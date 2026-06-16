import { useState, useRef, ReactNode } from 'react';
import { Text, useTheme, Divider, Icon } from 'react-native-paper';
import { View, Modal, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'components/ui/Button';

interface DropdownOption<T extends string> {
  id: T;
  name: string;
}

interface Props<T extends string> {
  label?: string;
  value: any | undefined;
  options: DropdownOption<T>[];
  isLoading?: boolean;
  placeholder?: string;
  isGrayed?: boolean;
  labelRight?: ReactNode;
  closeOnSelect?: boolean;
  onSelect: (id: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export const Dropdown = <T extends string>(props: Props<T>) => {
  const {
    label,
    value,
    options,
    isLoading = false,
    placeholder = 'Select an option',
    isGrayed,
    labelRight,
    closeOnSelect = true,
    onSelect,
    onOpen,
    onClose,
  } = props;

  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    shouldPositionAbove: false,
    dropdownHeight: 0,
  });
  const buttonRef = useRef<View>(null);

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const handleOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const estimatedDropdownHeight = Math.min(options.length * 52, 400);
      const spaceBelow = screenHeight - (y + height + 4);
      const shouldPositionAbove = spaceBelow < estimatedDropdownHeight;
      const dropdownHeight = shouldPositionAbove ? estimatedDropdownHeight : 0;

      setDropdownLayout({ x, y, width, height, shouldPositionAbove, dropdownHeight });
      onOpen?.();
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    onClose?.();
    setIsOpen(false);
  };

  return (
    <View className="flex flex-1 gap-2">
      {label && (
        <View className="mb-1 flex-row items-center justify-between">
          <Text
            variant="labelLarge"
            style={{ color: isGrayed ? theme.colors.outline : theme.colors.onSurfaceVariant }}>
            {label}
          </Text>
          {labelRight}
        </View>
      )}

      <View ref={buttonRef} collapsable={false} className="w-full">
        <Button
          mode="outlined"
          onPress={handleOpen}
          loading={isLoading}
          icon="chevron-down"
          contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}
          textColor={isGrayed ? theme.colors.outline : undefined}>
          {displayLabel}
        </Button>
      </View>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.25)' }]}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={{
            position: 'absolute',
            top: dropdownLayout.shouldPositionAbove
              ? dropdownLayout.y - dropdownLayout.dropdownHeight - 4
              : dropdownLayout.y + dropdownLayout.height + 4,
            left: dropdownLayout.x,
            width: dropdownLayout.width,
            backgroundColor: theme.colors.elevation.level3,
            borderRadius: theme.roundness * 3,
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
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => {
              const isSelected = item.id === value;
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (item.id === value) return;
                    onSelect(item.id);
                    if (closeOnSelect) handleClose();
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isSelected ? theme.colors.secondaryContainer : 'transparent',
                  }}>
                  {isSelected && <Icon source="check" size={18} color={theme.colors.primary} />}
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: isSelected
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurface,
                      marginLeft: isSelected ? 12 : 30,
                    }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};
