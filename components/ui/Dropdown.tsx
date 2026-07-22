import { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, Divider, Icon } from 'react-native-paper';
import { View, TouchableOpacity } from 'react-native';
import { Button } from 'components/ui/Button';
import { SearchInput } from 'components/ui/SearchInput';
import { FlashList } from '@shopify/flash-list';

interface DropdownItemProps {
  isSelected: boolean;
  onPress: () => void;
  itemName: string;
}

const DropdownItem = ({ isSelected, onPress, itemName }: DropdownItemProps) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isSelected ? theme.colors.secondaryContainer : undefined,
      }}>
      {isSelected && <Icon source="check" size={18} color={theme.colors.primary} />}
      <Text
        variant="bodyLarge"
        style={{
          color: isSelected ? theme.colors.onSecondaryContainer : theme.colors.onSurface,
          marginLeft: isSelected ? 12 : 30,
        }}>
        {itemName}
      </Text>
    </TouchableOpacity>
  );
};

interface DropdownOption<T extends string> {
  id: T;
  name: string;
}

interface DropdownProps<T extends string> {
  label?: string;
  value: any | undefined;
  options: DropdownOption<T>[];
  isLoading?: boolean;
  placeholder?: string;
  isGrayed?: boolean;
  labelRight?: ReactNode;
  closeOnSelect?: boolean;
  searchable?: boolean;
  rightComponent?: ReactNode;
  onSelect: (id: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const DropdownEmptyState = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'search' });
  const theme = useTheme();

  return (
    <Text
      variant="bodyMedium"
      style={{
        color: theme.colors.onSurfaceVariant,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}>
      {t('noResults')}
    </Text>
  );
};

export const Dropdown = <T extends string>(props: DropdownProps<T>) => {
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
    rightComponent,
    onSelect,
    onOpen,
    onClose,
  } = props;

  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((o) => o.id === value);
  const displayLabel = selectedOption ? selectedOption.name : placeholder;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions =
    searchable && normalizedQuery
      ? options.filter((o) => o.name.toLowerCase().includes(normalizedQuery))
      : options;

  const handleOpen = () => {
    setQuery('');
    onOpen?.();
    setIsOpen(true);
  };

  const handleClose = () => {
    onClose?.();
    setIsOpen(false);
  };

  return (
    <View className="flex-1 gap-4">
      {label && (
        <View className="flex-row items-center justify-between">
          <Text
            variant="labelLarge"
            style={{ color: isGrayed ? theme.colors.outline : theme.colors.onSurfaceVariant }}>
            {label}
          </Text>
          {labelRight}
        </View>
      )}

      <View className="flex-row items-center gap-4">
        <Button
          mode="outlined"
          onPress={() => (isOpen ? handleClose() : handleOpen())}
          loading={isLoading}
          icon={isOpen ? 'chevron-up' : 'chevron-down'}
          contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}
          style={{ flexGrow: 1 }}
          textColor={isGrayed ? theme.colors.outline : undefined}>
          {displayLabel}
        </Button>
        {rightComponent}
      </View>

      {isOpen && (
        <View
          style={{
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outline,
            borderWidth: 1,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
          {searchable && (
            <View style={{ padding: 8 }}>
              <SearchInput value={query} onChangeText={setQuery} />
            </View>
          )}

          <FlashList
            data={filteredOptions}
            style={{ maxHeight: 400 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            ListEmptyComponent={<DropdownEmptyState />}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            extraData={value}
            renderItem={({ item, extraData }) => {
              const isSelected = item.id === extraData;
              return (
                <DropdownItem
                  isSelected={isSelected}
                  onPress={() => {
                    if (isSelected) return;
                    onSelect(item.id);
                    if (closeOnSelect) handleClose();
                  }}
                  itemName={item.name}
                />
              );
            }}
          />
        </View>
      )}
    </View>
  );
};
