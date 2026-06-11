import { useState } from 'react';
import { View } from 'react-native';
import { Dropdown } from 'components/ui/Dropdown';
import { Text, Switch, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useBookStore } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { CreateDeckDialog } from 'pages/Settings/tabs/AnkiTab/CreateDeckDialog';
import { updateNestedMapping } from 'lib/utils';
import { useAnkiStore } from 'stores/useAnkiStore';
import { Button } from 'components/ui/Button';
import { IconButtonWithBorder } from 'components/ui/IconButton';

export const AnkiTab = () => {
  const {
    settings: {
      ankiDeckId,
      ankiModelId,
      mirroredAnkiModelId,
      isTwoSided,
      fieldMappings,
      mirroredFieldMappings,
    },
    updateSettings,
  } = useBookStore();
  const hasPermission = useAnkiStore((state) => state.hasPermission);
  const requestPermission = useAnkiStore((state) => state.requestPermission);
  const decks = useAnkiStore((state) => state.decks);
  const models = useAnkiStore((state) => state.models);
  const fields = useAnkiStore((state) => state.fields);
  const mirroredFields = useAnkiStore((state) => state.mirroredFields);
  const loadFieldsInto = useAnkiStore((state) => state.loadFieldsInto);
  const createDeck = useAnkiStore((state) => state.createDeck);
  const applyDefaultModel = useAnkiStore((state) => state.applyDefaultModel);
  const { t } = useTranslation('translation', { keyPrefix: 'ankiTab' });

  const [dialogVisible, setDialogVisible] = useState(false);

  const key = `${ankiDeckId}:${ankiModelId}`;
  const mirroredKey = `${ankiDeckId}:${mirroredAnkiModelId}`;

  const handleDeckCreated = async (deckName: string) => {
    const newDeckId = await createDeck(deckName);
    if (newDeckId && !ankiModelId) await applyDefaultModel(newDeckId);
    updateSettings({ ankiDeckId: newDeckId });
    setDialogVisible(false);
  };

  const updateFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      fieldMappings: updateNestedMapping(fieldMappings, key, partialMapping),
    });
  };

  const updateMirroredFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateSettings({
      mirroredFieldMappings: updateNestedMapping(
        mirroredFieldMappings,
        mirroredKey,
        partialMapping
      ),
    });
  };

  const findMappingByModelId = (
    mappings: Record<string, FieldMapping>,
    modelId: string
  ): FieldMapping | undefined => {
    return Object.values(mappings).find((m) => m.modalId === modelId);
  };

  return (
    <View className="gap-4 p-4">
      <Text variant="titleMedium" className="font-bold">
        {t('title')}
      </Text>

      {!hasPermission ? (
        <Button mode="contained" onPress={requestPermission} icon="database-plus">
          {t('connect')}
        </Button>
      ) : (
        <>
          <Text className="text-green-700">{t('connected')}</Text>

          <View className="flex-row items-center gap-4">
            <Dropdown
              label={t('decksLabel')}
              value={ankiDeckId}
              options={decks}
              onSelect={(value) => {
                updateSettings({ ankiDeckId: value });
              }}
            />
            <IconButtonWithBorder
              icon="plus"
              style={{ marginTop: 36, height: 54, width: 54 }}
              onPress={() => setDialogVisible(true)}
            />
          </View>

          <Dropdown
            label={t('modelLabel')}
            value={ankiModelId}
            options={models}
            onSelect={async (value) => {
              const fieldCount = await loadFieldsInto(value, 'fields');
              const mappingFromAnotherDeck = findMappingByModelId(fieldMappings, value);
              const existingMapping = fieldMappings[`${ankiDeckId}:${value}`];

              updateSettings({
                ankiModelId: value,
                fieldMappings: updateNestedMapping(fieldMappings, `${ankiDeckId}:${value}`, {
                  ...(existingMapping ? undefined : mappingFromAnotherDeck),
                  modalId: value,
                  fieldCount,
                }),
              });
            }}
          />
        </>
      )}

      {fields.length > 0 && (
        <FieldMappingSection
          title={t('fieldMapping')}
          fieldMapping={fieldMappings[key]}
          fields={fields}
          onUpdate={updateFieldMapping}
        />
      )}

      {fields.length > 0 && (
        <List.Item
          title={t('twoSidedTitle')}
          description={t('twoSidedDescription')}
          right={() => (
            <Switch
              value={isTwoSided}
              onValueChange={(value) => updateSettings({ isTwoSided: value })}
            />
          )}
        />
      )}

      {mirroredFields.length > 0 && isTwoSided && (
        <>
          <Dropdown
            label={t('mirroredModelLabel')}
            value={mirroredAnkiModelId}
            options={models}
            onSelect={async (value) => {
              const fieldCount = await loadFieldsInto(value, 'mirroredFields');
              const mappingFromAnotherDeck = findMappingByModelId(mirroredFieldMappings, value);
              const existingMapping = mirroredFieldMappings[`${ankiDeckId}:${value}`];

              updateSettings({
                mirroredAnkiModelId: value,
                mirroredFieldMappings: updateNestedMapping(
                  mirroredFieldMappings,
                  `${ankiDeckId}:${value}`,
                  {
                    ...(existingMapping ? undefined : mappingFromAnotherDeck),
                    modalId: value,
                    fieldCount,
                  }
                ),
              });
            }}
          />
          <FieldMappingSection
            title={t('mirroredFieldMapping')}
            fieldMapping={mirroredFieldMappings[mirroredKey]}
            fields={mirroredFields}
            onUpdate={updateMirroredFieldMapping}
          />
        </>
      )}
      <CreateDeckDialog
        isOpen={dialogVisible}
        onConfirm={handleDeckCreated}
        onClose={() => setDialogVisible(false)}
      />
    </View>
  );
};
