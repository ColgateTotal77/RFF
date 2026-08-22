import { useState, ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useTheme, Divider, Icon } from 'react-native-paper';
import { View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Button } from 'components/ui/Button';
import { SearchInput } from 'components/ui/SearchInput';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useScrollIntoView } from 'components/ui/ScrollViewWithScrollControl';

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

type OptionExtra<T extends string> = {
  value: any | undefined;
  onSelect: (id: T) => void;
  onSelected: () => void;
};

const Separator = () => <Divider />;

const renderOption = <T extends string>({
  item,
  extraData,
}: ListRenderItemInfo<DropdownOption<T>>) => {
  const { value, onSelect, onSelected } = extraData as OptionExtra<T>;
  const isSelected = item.id === value;

  return (
    <DropdownItem
      isSelected={isSelected}
      onPress={() => {
        if (isSelected) return;
        onSelect(item.id);
        onSelected();
      }}
      itemName={item.name}
    />
  );
};

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
  const { t } = useTranslation('translation');
  const {
    label,
    value,
    options,
    isLoading = false,
    placeholder = t('common.selectAnOption'),
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
  const dropdownContentRef = useRef<View>(null);
  const lastHeight = useRef(0);
  const scrollIntoView = useScrollIntoView();

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
    lastHeight.current = 0;
  };

  const handleClose = () => {
    onClose?.();
    setIsOpen(false);
    lastHeight.current = 0;
  };

  const extraData: OptionExtra<T> = {
    value,
    onSelect,
    onSelected: () => closeOnSelect && handleClose(),
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height === lastHeight.current) return;
    lastHeight.current = height;
    scrollIntoView?.(dropdownContentRef.current);
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
          ref={dropdownContentRef}
          onLayout={onLayout}
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
            ItemSeparatorComponent={Separator}
            extraData={extraData}
            renderItem={renderOption}
          />
        </View>
      )}
    </View>
  );
};
