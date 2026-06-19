import { useState } from 'react';
import { View } from 'react-native';
import { Dropdown } from 'components/ui/Dropdown';
import { Text, Switch, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppStore } from 'stores/useAppStore';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { CreateDeckDialog } from 'pages/Settings/tabs/AnkiTab/CreateDeckDialog';
import { findBestMapping, updateNestedMapping } from 'lib/utils';
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
  } = useAppStore();
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

  const handleDeckChange = (newDeckId: string) => {
    const update: Parameters<typeof updateSettings>[0] = { ankiDeckId: newDeckId };
    if (ankiModelId) {
      update.fieldMappings = updateNestedMapping(fieldMappings, `${newDeckId}:${ankiModelId}`, {
        ...findBestMapping(fieldMappings, newDeckId, ankiModelId),
        modalId: ankiModelId,
        fieldCount: fields.length,
      });
    }
    if (mirroredAnkiModelId) {
      update.mirroredFieldMappings = updateNestedMapping(
        mirroredFieldMappings,
        `${newDeckId}:${mirroredAnkiModelId}`,
        {
          ...findBestMapping(mirroredFieldMappings, newDeckId, mirroredAnkiModelId),
          modalId: mirroredAnkiModelId,
          fieldCount: mirroredFields.length,
        }
      );
    }
    updateSettings(update);
  };

  const handleDeckCreated = async (deckName: string) => {
    const newDeckId = await createDeck(deckName);
    if (newDeckId && !ankiModelId) await applyDefaultModel(newDeckId);
    handleDeckChange(newDeckId);
    setDialogVisible(false);
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
              onSelect={handleDeckChange}
            />
            <IconButtonWithBorder
              icon="plus"
              style={{ marginTop: 36, height: 54, width: 54 }}
              onPress={() => setDialogVisible(true)}
              accessibilityLabel="Create new deck"
            />
          </View>

          <Dropdown
            label={t('modelLabel')}
            value={ankiModelId}
            options={models}
            onSelect={async (value) => {
              const fieldCount = await loadFieldsInto(value, 'fields');
              const bestMapping = findBestMapping(fieldMappings, ankiDeckId, value);

              updateSettings({
                ankiModelId: value,
                fieldMappings: updateNestedMapping(fieldMappings, `${ankiDeckId}:${value}`, {
                  ...bestMapping,
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
          onUpdate={(partialMapping) =>
            updateSettings({
              fieldMappings: updateNestedMapping(fieldMappings, key, partialMapping),
            })
          }
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

      {isTwoSided && (
        <>
          <Dropdown
            label={t('mirroredModelLabel')}
            value={mirroredAnkiModelId}
            options={models}
            onSelect={async (value) => {
              const fieldCount = await loadFieldsInto(value, 'mirroredFields');
              const bestMapping = findBestMapping(mirroredFieldMappings, ankiDeckId, value);

              updateSettings({
                mirroredAnkiModelId: value,
                mirroredFieldMappings: updateNestedMapping(
                  mirroredFieldMappings,
                  `${ankiDeckId}:${value}`,
                  {
                    ...bestMapping,
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
            onUpdate={(partialMapping) =>
              updateSettings({
                mirroredFieldMappings: updateNestedMapping(
                  mirroredFieldMappings,
                  mirroredKey,
                  partialMapping
                ),
              })
            }
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
