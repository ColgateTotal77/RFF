import { View } from 'react-native';
import { Dropdown } from 'components/ui/Dropdown';
import { Text, Switch, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { useAnkiStore } from 'stores/useAnkiStore';
import { Button } from 'components/ui/Button';
import { IconButtonWithBorder } from 'components/ui/IconButton';
import { useState } from 'react';
import { CreateDeckDialog } from 'pages/Settings/tabs/AnkiTab/CreateDeckDialog';
import { RESET_FIELD_MAPPING } from 'lib/constants';

const isInherited = (bookValue: unknown) => bookValue === undefined;

export const AnkiTab = () => {
  const currentBook = useCurrentBook();
  const settings = useBookStore((state) => state.settings);
  const { updateBookSettings } = useBookStore();
  const hasPermission = useAnkiStore((state) => state.hasPermission);
  const requestPermission = useAnkiStore((state) => state.requestPermission);
  const decks = useAnkiStore((state) => state.decks);
  const models = useAnkiStore((state) => state.models);
  const fields = useAnkiStore((state) => state.bookFields);
  const mirroredFields = useAnkiStore((state) => state.bookMirroredFields);
  const loadFieldsInto = useAnkiStore((state) => state.loadFieldsInto);
  const { t } = useTranslation('translation', { keyPrefix: 'ankiTab' });
  const createDeck = useAnkiStore((state) => state.createDeck);
  const books = useBookStore((state) => state.books);

  const [dialogVisible, setDialogVisible] = useState(false);

  const getInheritedValue = <T,>(bookValue: T | undefined, globalValue: T) => {
    return bookValue !== undefined ? bookValue : globalValue;
  };

  const ankiDeckId = getInheritedValue(currentBook.settings.ankiDeckId, settings.ankiDeckId);
  const ankiModelId = getInheritedValue(currentBook.settings.ankiModelId, settings.ankiModelId);
  const mirroredAnkiModelId = getInheritedValue(
    currentBook.settings.mirroredAnkiModelId,
    settings.mirroredAnkiModelId
  );
  const isTwoSided = getInheritedValue(currentBook.settings.isTwoSided, settings.isTwoSided);

  const key = `${ankiDeckId}:${ankiModelId}`;
  const mirroredKey = `${ankiDeckId}:${mirroredAnkiModelId}`;

  const handleDeckCreated = async (deckName: string) => {
    const newDeckId = await createDeck(deckName);
    updateBookSettings({ ankiDeckId: newDeckId });
    setDialogVisible(false);
  };

  const updateMapping = (
    mappingName: 'fieldMapping' | 'mirroredFieldMapping',
    partialData: Partial<FieldMapping>
  ) => {
    updateBookSettings({ [mappingName]: partialData });
  };

  const updateFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateMapping('fieldMapping', partialMapping);
  };

  const updateMirroredFieldMapping = (partialMapping: Partial<FieldMapping>) => {
    updateMapping('mirroredFieldMapping', partialMapping);
  };

  const findMappingFromOtherBooks = (
    modelId: string,
    mappingKey: 'fieldMapping' | 'mirroredFieldMapping'
  ): FieldMapping | undefined => {
    for (const book of books) {
      const mapping = book.settings[mappingKey];
      if (mapping && mapping.modalId === modelId) return mapping;
    }
    return undefined;
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
              onSelect={(value) => updateBookSettings({ ankiDeckId: value })}
              isGrayed={isInherited(currentBook.settings.ankiDeckId)}
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
              const fieldCount = await loadFieldsInto(value, 'bookFields');
              const defaultMapping = settings.fieldMappings[`${ankiDeckId}:${value}`];
              const mappingFromAnotherBook = findMappingFromOtherBooks(value, 'fieldMapping');

              updateBookSettings({
                ankiModelId: value,
                fieldMapping: {
                  ...RESET_FIELD_MAPPING,
                  ...(defaultMapping ? undefined : mappingFromAnotherBook),
                  modalId: value,
                  fieldCount,
                },
              });
            }}
            isGrayed={isInherited(currentBook.settings.ankiModelId)}
          />
          {fields.length > 0 && (
            <>
              <FieldMappingSection
                title={t('fieldMapping')}
                fieldMapping={currentBook.settings.fieldMapping}
                defaultFieldMapping={settings.fieldMappings[key]}
                fields={fields}
                onUpdate={updateFieldMapping}
              />
            </>
          )}

          {fields.length > 0 && (
            <List.Item
              title={t('twoSidedTitle')}
              description={t('twoSidedDescription')}
              titleStyle={
                isInherited(currentBook.settings.isTwoSided) ? { color: '#9ca3af' } : undefined
              }
              descriptionStyle={
                isInherited(currentBook.settings.isTwoSided) ? { color: '#9ca3af' } : undefined
              }
              right={() => (
                <Switch
                  value={isTwoSided}
                  onValueChange={(value) => updateBookSettings({ isTwoSided: value })}
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
                  const fieldCount = await loadFieldsInto(value, 'bookMirroredFields');
                  const defaultMapping = settings.mirroredFieldMappings[`${ankiDeckId}:${value}`];
                  const mappingFromAnotherBook = findMappingFromOtherBooks(
                    value,
                    'mirroredFieldMapping'
                  );

                  updateBookSettings({
                    mirroredAnkiModelId: value,
                    mirroredFieldMapping: {
                      ...RESET_FIELD_MAPPING,
                      ...(defaultMapping ? undefined : mappingFromAnotherBook),
                      modalId: value,
                      fieldCount,
                    },
                  });
                }}
                isGrayed={isInherited(currentBook.settings.mirroredAnkiModelId)}
              />
              <FieldMappingSection
                title={t('mirroredFieldMapping')}
                fieldMapping={currentBook.settings.mirroredFieldMapping}
                defaultFieldMapping={settings.mirroredFieldMappings[mirroredKey]}
                fields={mirroredFields}
                onUpdate={updateMirroredFieldMapping}
              />
            </>
          )}
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
