import { View } from 'react-native';
import { Dropdown } from 'components/Dropdown';
import { Text, Switch, List, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useBookStore, useCurrentBook } from 'stores/useBookStore';
import { FieldMapping } from 'types';
import { FieldMappingSection } from 'pages/Settings/tabs/AnkiTab/FieldMappingSection';
import { useAnkiStore } from 'stores/useAnkiStore';

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

  return (
    <>
      <Text variant="titleMedium" className="font-bold">
        {t('title')}
      </Text>

      {!hasPermission ? (
        <Button mode="contained" onPress={requestPermission} icon="database-plus">
          {t('connect')}
        </Button>
      ) : (
        <>
          <View>
            <Text className="text-green-700">{t('connected')}</Text>

            <Dropdown
              label={t('decksLabel')}
              value={ankiDeckId}
              options={decks}
              onSelect={(value) => updateBookSettings({ ankiDeckId: value })}
              isGrayed={isInherited(currentBook.settings.ankiDeckId)}
            />
            <Dropdown
              label={t('modelLabel')}
              value={ankiModelId}
              options={models}
              onSelect={async (value) => {
                const fieldCount = await loadFieldsInto(value, 'bookFields');
                updateBookSettings({
                  ankiModelId: value,
                  fieldMapping: {
                    modalId: value,
                    fieldCount,
                  },
                });
              }}
              isGrayed={isInherited(currentBook.settings.ankiModelId)}
            />
          </View>
          {fields.length > 0 && (
            <>
              <FieldMappingSection
                title={t('fieldMapping')}
                fieldMapping={currentBook.settings.fieldMapping}
                defaultFieldMapping={
                  settings.fieldMappings[`${settings.ankiDeckId}:${settings.ankiModelId}`]
                }
                fields={fields}
                onUpdate={updateFieldMapping}
              />

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

              {isTwoSided && (
                <>
                  <Dropdown
                    label={t('mirroredModelLabel')}
                    value={mirroredAnkiModelId}
                    options={models}
                    onSelect={async (value) => {
                      const fieldCount = await loadFieldsInto(value, 'bookMirroredFields');
                      updateBookSettings({
                        mirroredAnkiModelId: value,
                        mirroredFieldMapping: {
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
                    defaultFieldMapping={
                      settings.mirroredFieldMappings[
                        `${settings.ankiDeckId}:${settings.mirroredAnkiModelId}`
                      ]
                    }
                    fields={mirroredFields}
                    onUpdate={updateMirroredFieldMapping}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
