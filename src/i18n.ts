import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en/translation.json'
import sv from './locales/sv/translation.json'

// Search engine and AI crawlers report an English browser, which would get the
// site indexed in English while the page, meta tags and canonical URLs are
// Swedish. Crawlers get Swedish, the shop's main language.
const isCrawler = typeof navigator !== 'undefined' && /bot|crawl|spider|slurp|inspectiontool/i.test(navigator.userAgent)

i18n.on('languageChanged', (language) => {
  // resolvedLanguage is "sv" or "en", while language can be e.g. "en-US".
  document.documentElement.lang = i18n.resolvedLanguage ?? language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sv: { translation: sv },
    },
    lng: isCrawler ? 'sv' : undefined,
    fallbackLng: 'en',
    supportedLngs: ['sv', 'en'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
