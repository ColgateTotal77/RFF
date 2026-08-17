import { Linking, Pressable, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppStore } from 'stores/useAppStore';
import { useAnkiStore } from 'stores/useAnkiStore';

const ANKI_PLAY_STORE_URL = 'market://details?id=com.ichi2.anki';

export const InstallAnkiBanner = () => {
  const theme = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const dismissInstallAnkiBanner = useAppStore((state) => state.dismissAnkiBanner);

  return (
    <View
      className="mb-4 flex-row items-center gap-2 rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: theme.colors.surfaceVariant,
      }}>
      <Icon source="cards-outline" size={18} color={theme.colors.primary} />
      <Text
        variant="bodySmall"
        numberOfLines={2}
        className="flex-1"
        style={{ color: theme.colors.onSurfaceVariant }}>
        {t('installBannerMessage')}
      </Text>
      <Pressable
        onPress={() => Linking.openURL(ANKI_PLAY_STORE_URL)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('installAnki')}>
        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '600' }}>
          {t('installBannerAction')}
        </Text>
      </Pressable>
      <Pressable
        onPress={dismissInstallAnkiBanner}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('dismiss', { keyPrefix: 'common' })}>
        <Icon source="close" size={16} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
};

export const GiveAnkiPermissionsBanner = () => {
  const theme = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'bookLists' });
  const dismissInstallAnkiBanner = useAppStore((state) => state.dismissAnkiBanner);
  const navigate = useAppStore((state) => state.navigate);

  return (
    <View
      className="mb-4 flex-row items-center gap-2 rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: theme.colors.surfaceVariant,
      }}>
      <Icon source="cards-outline" size={18} color={theme.colors.primary} />
      <Text
        variant="bodySmall"
        numberOfLines={2}
        className="flex-1"
        style={{ color: theme.colors.onSurfaceVariant }}>
        {t('permissionBannerMessage')}
      </Text>
      <Pressable
        onPress={() => navigate('Settings')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('goToSettings')}>
        <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '600' }}>
          {t('permissionBannerAction')}
        </Text>
      </Pressable>
      <Pressable
        onPress={dismissInstallAnkiBanner}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('dismiss', { keyPrefix: 'common' })}>
        <Icon source="close" size={16} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
};

export const Banner = () => {
  const isInstalled = useAnkiStore((s) => s.isInstalled);
  const hasPermission = useAnkiStore((s) => s.hasPermission);
  const dismissed = useAppStore((state) => state.ankiBannerDismissed);

  if (!isInstalled && !dismissed) return <InstallAnkiBanner />;
  if (!hasPermission && !dismissed) return <GiveAnkiPermissionsBanner />;
};
