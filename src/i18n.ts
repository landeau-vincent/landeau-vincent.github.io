import { createI18n } from 'vue-i18n'
import {
  applyPortfolioLocale,
  languagesAvailable as portfolioLanguages,
  portfolioReady,
  syncPortfolioLocaleToI18n,
} from './content/portfolio'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: {} },
})

export function getLanguagesAvailable(): string[] {
  return portfolioLanguages.length ? portfolioLanguages : ['en', 'fr']
}

export const languagesAvailable = getLanguagesAvailable()

function setI18nLanguage(lang: string) {
  i18n.global.locale = lang as typeof i18n.global.locale
  document.querySelector('html')?.setAttribute('lang', lang)
  if (portfolioReady.loaded) {
    applyPortfolioLocale(lang)
    syncPortfolioLocaleToI18n(i18n, lang)
  }
  return lang
}

export function navigatorCloseLanguage() {
  const available = getLanguagesAvailable()
  const userLanguage = navigator.language
  if (available.includes(userLanguage)) {
    return loadLanguageAsync(userLanguage)
  }
  if (userLanguage.includes('-')) {
    const userLanguageSplit = userLanguage.split('-')
    if (available.includes(userLanguageSplit[0])) {
      return loadLanguageAsync(userLanguageSplit[0])
    }
  }
  return loadLanguageAsync('en')
}

export function loadLanguageAsync(lang: string) {
  if (i18n.global.locale !== lang) {
    return Promise.resolve(setI18nLanguage(lang))
  }
  applyPortfolioLocale(lang)
  return Promise.resolve(setI18nLanguage(lang))
}
