import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en/translation.json'
import sv from './locales/sv/translation.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv },
    },
    fallbackLng: 'sv',
    supportedLngs: ['sv', 'en'],
    interpolation: { escapeValue: false },
  })

export default i18n
