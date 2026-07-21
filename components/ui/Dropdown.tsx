import { useState, useRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, Divider, Icon } from 'react-native-paper';
import { View, Modal, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Button } from 'components/ui/Button';
import { SearchInput } from 'components/ui/SearchInput';

const SEARCH_BAR_HEIGHT = 56;

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
  searchable?: boolean;
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
    searchable = false,
    onSelect,
    onOpen,
    onClose,
  } = props;

  const { t } = useTranslation('common');
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    shouldPositionAbove: false,
  });
  const buttonRef = useRef<View>(null);

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions =
    searchable && normalizedQuery
      ? options.filter((o) => o.name.toLowerCase().includes(normalizedQuery))
      : options;

  const handleOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const estimatedDropdownHeight =
        Math.min(options.length * 52, 400) + (searchable ? SEARCH_BAR_HEIGHT : 0);
      const spaceBelow = screenHeight - (y + height + 4);
      const shouldPositionAbove = spaceBelow < estimatedDropdownHeight;

      setQuery('');
      setDropdownLayout({ x, y, width, height, shouldPositionAbove });
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
              ? undefined
              : dropdownLayout.y + dropdownLayout.height + 4,
            bottom: dropdownLayout.shouldPositionAbove
              ? Dimensions.get('window').height - dropdownLayout.y + 4
              : undefined,
            left: dropdownLayout.x,
            width: dropdownLayout.width,
            backgroundColor: theme.colors.elevation.level3,
            borderRadius: theme.roundness * 3,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            maxHeight: 400 + (searchable ? SEARCH_BAR_HEIGHT : 0),
            overflow: 'hidden',
          }}>
          {searchable && (
            <View style={{ padding: 8 }}>
              <SearchInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('search')}
                autoFocus
              />
            </View>
          )}

          <FlatList
            data={filteredOptions}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}>
                {t('noResults')}
              </Text>
            }
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
