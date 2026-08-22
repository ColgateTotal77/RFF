import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper/src';

const GuideItem = ({
  icon,
  text,
  title,
  body,
}: {
  icon?: string;
  text?: string;
  title: string;
  body: string;
}) => {
  const theme = useTheme();

  return (
    <View className="flex-row items-start gap-4">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.colors.secondaryContainer }}>
        {text ? (
          <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>
            {text}
          </Text>
        ) : (
          <Icon source={icon} size={20} color={theme.colors.onSecondaryContainer} />
        )}
      </View>
      <View className="flex-1">
        <Text variant="titleSmall" className="font-bold">
          {title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {body}
        </Text>
      </View>
    </View>
  );
};

const GuideSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <Card>
      <Card.Content className="gap-4">
        <Text variant="titleMedium" className="font-bold">
          {title}
        </Text>
        {children}
      </Card.Content>
    </Card>
  );
};

export const GuideScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'guide' });
  const theme = useTheme();

  return (
    <ScrollView contentContainerClassName="flex gap-4 p-4 pb-10">
      <GuideSection title={t('gestures.title')}>
        <GuideItem
          icon="format-list-numbered"
          title={t('gestures.oneTap.title')}
          body={t('gestures.oneTap.body')}
        />
        <GuideItem
          icon="translate"
          title={t('gestures.twoTaps.title')}
          body={t('gestures.twoTaps.body')}
        />
        <GuideItem
          icon="cards-outline"
          title={t('gestures.threeTaps.title')}
          body={t('gestures.threeTaps.body')}
        />
      </GuideSection>

      <GuideSection title={t('selection.title')}>
        <GuideItem
          icon="gesture-tap-hold"
          title={t('selection.longPress.title')}
          body={t('selection.longPress.body')}
        />
        <GuideItem
          icon="translate"
          title={t('selection.translate.title')}
          body={t('selection.translate.body')}
        />
        <GuideItem
          icon="content-copy"
          title={t('selection.copy.title')}
          body={t('selection.copy.body')}
        />
        <GuideItem
          icon="cards-outline"
          title={t('selection.addCard.title')}
          body={t('selection.addCard.body')}
        />
        <GuideItem
          icon="account-check-outline"
          title={t('selection.wordExists.title')}
          body={t('selection.wordExists.body')}
        />
        <GuideItem
          text="+F"
          title={t('selection.increaseFlag.title')}
          body={t('selection.increaseFlag.body')}
        />
        <GuideItem
          icon="dots-vertical"
          title={t('selection.more.title')}
          body={t('selection.more.body')}
        />
        <GuideItem
          text="-F"
          title={t('selection.decreaseFlag.title')}
          body={t('selection.decreaseFlag.body')}
        />
        <GuideItem
          icon="delete-outline"
          title={t('selection.delete.title')}
          body={t('selection.delete.body')}
        />
      </GuideSection>

      <GuideSection title={t('flags.title')}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('flags.description')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('flags.meaning')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('flags.range')}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('flags.usage')}
        </Text>
      </GuideSection>
    </ScrollView>
  );
};
