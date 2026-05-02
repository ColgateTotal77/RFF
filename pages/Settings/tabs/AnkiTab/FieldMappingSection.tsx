import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text } from 'react-native-paper';
import { FIELD_MAPPING_KEYS, FieldMapping } from 'types';

interface FieldMappingSectionProps {
  title: string;
  fieldMapping: FieldMapping | undefined;
  fields: { id: number; name: string }[];
  onUpdate: (partialMapping: Partial<FieldMapping>) => void;
}

export const FieldMappingSection = ({
  title,
  fieldMapping,
  fields,
  onUpdate,
}: FieldMappingSectionProps) => {
  const optionsWithNone = [
    { id: '', name: 'None' },
    ...fields.map((f) => ({ id: f.id.toString(), name: f.name })),
  ];

  return (
    <View className="gap-4">
      <Text variant="titleSmall" className="font-bold">{title}</Text>
      {FIELD_MAPPING_KEYS.map((key) => (
        <Dropdown
          key={key}
          label={`App field "${key}" → Anki field:`}
          value={fieldMapping?.[key]?.toString() ?? ''}
          options={optionsWithNone}
          onSelect={(idx) => {
            if (idx === '') onUpdate({ [key]: undefined });
            else onUpdate({ [key]: parseInt(idx) });
          }}
        />
      ))}
    </View>
  );
};
