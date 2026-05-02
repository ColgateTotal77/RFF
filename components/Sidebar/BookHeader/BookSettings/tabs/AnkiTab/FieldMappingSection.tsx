import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text } from 'react-native-paper';
import { FIELD_MAPPING_KEYS, FieldMapping } from 'types';

interface FieldMappingSectionProps {
  title: string;
  fieldMapping: FieldMapping | undefined;
  defaultFieldMapping: FieldMapping | undefined;
  fields: { id: number; name: string }[];
  onUpdate: (partialMapping: Partial<FieldMapping>) => void;
}

const isInherited = (bookValue: any) => bookValue === undefined;

export const FieldMappingSection = ({
  title,
  fieldMapping,
  defaultFieldMapping,
  fields,
  onUpdate,
}: FieldMappingSectionProps) => {
  const optionsWithNone = [
    { id: '', name: 'None' },
    ...fields.map((f) => ({ id: f.id.toString(), name: f.name })),
  ];

  const getEffectiveValue = (key: keyof FieldMapping) => {
    if (fieldMapping?.[key] !== undefined) {
      return fieldMapping[key];
    }
    return defaultFieldMapping?.[key];
  };

  return (
    <View className="gap-4">
      <Text
        variant="titleSmall"
        className="font-bold"
      >
        {title}
      </Text>
      {FIELD_MAPPING_KEYS.map((key) => (
        <Dropdown
          key={key}
          label={`App field "${key}" → Anki field:`}
          value={getEffectiveValue(key)?.toString() ?? ''}
          options={optionsWithNone}
          onSelect={(idx) => {
            if (idx === '') onUpdate({ [key]: null });
            else onUpdate({ [key]: parseInt(idx) });
          }}
          isGrayed={isInherited(fieldMapping?.[key])}
        />
      ))}
    </View>
  );
};
