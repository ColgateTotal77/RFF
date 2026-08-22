import { Ref } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  inputRef?: Ref<TextInput>;
};

export const SearchInput = ({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  autoFocus,
  onSubmitEditing,
  inputRef,
}: Props) => {
  const theme = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'search' });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 12,
        height: 40,
        paddingHorizontal: 12,
      }}>
      <Icon source="magnify" size={20} color={theme.colors.onSurfaceVariant} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('placeholder')}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={{
          flex: 1,
          marginLeft: 8,
          fontSize: 16,
          includeFontPadding: false,
          color: theme.colors.onSurfaceVariant,
        }}
        returnKeyType="search"
        autoCapitalize="none"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={accessibilityLabel}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel={t('clearSearch')}>
          <Icon source="close" size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>
      )}
    </View>
  );
};
