import { View } from 'react-native';
import { Dropdown } from 'components/ui/Dropdown';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { FIELD_MAPPING_KEYS, FieldMapping } from 'types';

interface FieldMappingSectionProps {
  title: string;
  fieldMapping: FieldMapping | undefined;
  defaultFieldMapping?: FieldMapping | undefined;
  fields: { id: number; name: string }[];
  onUpdate: (partialMapping: Partial<FieldMapping>) => void;
}

export const FieldMappingSection = (props: FieldMappingSectionProps) => {
  const { title, fieldMapping, defaultFieldMapping, fields, onUpdate } = props;
  const defaults: Partial<FieldMapping> = defaultFieldMapping ?? {};
  const { t } = useTranslation('translation', { keyPrefix: 'ankiTab' });

  const appFieldOptions = [
    { id: '', name: t('none') },
    ...FIELD_MAPPING_KEYS.map((key) => ({
      id: key,
      name: t(`appFields.${key}`, { defaultValue: key }),
    })),
  ];

  return (
    <View className="gap-4">
      <Text variant="titleSmall" className="font-bold">
        {title}
      </Text>
      {fields.map((ankiField) => {
        const ankiIndex = ankiField.id;
        const selectedAppKey = getAppKeyForAnkiIndex(ankiIndex, fieldMapping, defaults);
        const inherited =
          selectedAppKey !== '' && isInherited(fieldMapping?.[selectedAppKey as AppFieldKey]);

        return (
          <Dropdown
            key={ankiIndex}
            label={t('fieldMappingLabel', { ankiFieldName: ankiField.name })}
            value={selectedAppKey}
            options={appFieldOptions}
            onSelect={(appKeyId) => {
              const selected = appKeyId as AppFieldKey;
              onUpdate(partialMappingForAnkiSlot(ankiIndex, selected, fieldMapping, defaults));
            }}
            isGrayed={Object.keys(defaults).length === 0 ? false : inherited}
          />
        );
      })}
    </View>
  );
};

const isInherited = (bookValue: unknown) => bookValue === undefined;

type AppFieldKey = (typeof FIELD_MAPPING_KEYS)[number];

const getAnkiIndex = (
  appKey: AppFieldKey,
  mapping: Partial<FieldMapping> | undefined,
  defaults: Partial<FieldMapping>
): number | null | undefined => {
  if (mapping?.[appKey] !== undefined) return mapping[appKey];
  return defaults[appKey];
};

const getAppKeyForAnkiIndex = (
  ankiIndex: number,
  mapping: Partial<FieldMapping> | undefined,
  defaults: Partial<FieldMapping>
): AppFieldKey | '' => {
  for (const appKey of FIELD_MAPPING_KEYS) {
    const idx = getAnkiIndex(appKey, mapping, defaults);
    if (idx === ankiIndex) return appKey;
  }
  return '';
};

const partialMappingForAnkiSlot = (
  ankiIndex: number,
  selectedAppKey: AppFieldKey | '',
  mapping: Partial<FieldMapping> | undefined,
  defaults: Partial<FieldMapping>
): Partial<FieldMapping> => {
  const partial: Partial<FieldMapping> = {};
  for (const appKey of FIELD_MAPPING_KEYS) {
    if (getAnkiIndex(appKey, mapping, defaults) === ankiIndex) {
      partial[appKey] = undefined;
    }
  }
  if (selectedAppKey !== '') partial[selectedAppKey] = ankiIndex;
  return partial;
};
