import i18n, { changeLanguage as changeLanguageI18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { createMMKV } from 'react-native-mmkv';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { checkIsRTL, AppLanguageCode, APP_LANGUAGE, FALLBACK_APP_LANGUAGE } from 'lib/langHelper';

import en from './locales/en.json';
import uk from './locales/uk.json';
import ru from './locales/ru.json';

const storage = createMMKV({
  id: 'i18n',
});

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: false,
  init: () => {},
  detect: function () {
    try {
      const savedLanguage = storage.getString('user-language');
      if (savedLanguage) return savedLanguage;

      const deviceLanguage = Localization.getLocales()[0]?.languageCode?.toLowerCase();
      if (deviceLanguage && deviceLanguage in APP_LANGUAGE) {
        return deviceLanguage as AppLanguageCode;
      }

      return FALLBACK_APP_LANGUAGE;
    } catch (error) {
      console.log('Error reading language from i18n storage', error);
      return FALLBACK_APP_LANGUAGE;
    }
  },
  cacheUserLanguage: function (language: AppLanguageCode) {
    try {
      storage.set('user-language', language);
    } catch (error) {
      console.log('Error saving language to i18n storage', error);
    }
  },
};

export const changeLanguage = async (lang: AppLanguageCode) => {
  const isRTL = checkIsRTL(lang);

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    await changeLanguageI18n(lang);
    await Updates.reloadAsync();
  } else {
    changeLanguageI18n(lang);
  }
};

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      uk: { translation: uk },
      ru: { translation: ru },
    },
    fallbackLng: FALLBACK_APP_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
