import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text } from 'react-native-paper';
import { FIELD_MAPPING_KEYS, FieldMapping } from 'types';

interface FieldMappingSectionProps {
  title: string;
  fieldMapping: FieldMapping | undefined;
  defaultFieldMapping?: FieldMapping | undefined;
  fields: { id: number; name: string }[];
  onUpdate: (partialMapping: Partial<FieldMapping>) => void;
}

const isInherited = (bookValue: any) => bookValue === undefined;

export const FieldMappingSection = (props: FieldMappingSectionProps) => {
  const { title, fieldMapping, defaultFieldMapping, fields, onUpdate } = props;
  const defaults: Partial<FieldMapping> = defaultFieldMapping ?? {};

  const optionsWithNone = [
    { id: '', name: 'None' },
    ...fields.map((f) => ({ id: f.id.toString(), name: f.name })),
  ];

  const getEffectiveValue = (key: keyof FieldMapping) => {
    if (fieldMapping?.[key] !== undefined) return fieldMapping[key];

    return defaults?.[key];
  };

  return (
    <View className="gap-4">
      <Text variant="titleSmall" className="font-bold">
        {title}
      </Text>
      {FIELD_MAPPING_KEYS.map((key) => (
        <Dropdown
          key={key}
          label={`App field "${key}" → Anki field:`}
          value={getEffectiveValue(key)?.toString() ?? ''}
          options={optionsWithNone}
          onSelect={(idx) => {
            // TODO(21): book clear should use null (revert to global), not undefined (inherit)
            if (idx === '') onUpdate({ [key]: undefined });
            else onUpdate({ [key]: parseInt(idx) });
          }}
          isGrayed={Object.keys(defaults).length === 0 ? false : isInherited(fieldMapping?.[key])}
        />
      ))}
    </View>
  );
};
