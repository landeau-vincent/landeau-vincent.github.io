import {createI18n} from 'vue-i18n'
import { en } from './assets/locales/en'
import { fr } from './assets/locales/fr'

export const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: { 'en': en, 'fr': fr }
})

const loadedLanguages = ['en']

export const languagesAvailable = ['en', 'fr']

function setI18nLanguage (lang: string) {
    i18n.global.locale = lang as 'en' | 'fr'
    document.querySelector('html')?.setAttribute('lang', lang)
    return lang
}

export function navigatorCloseLanguage () {
    const userLanguage = navigator.language
    if (languagesAvailable.includes(userLanguage)) {
        return loadLanguageAsync(userLanguage)
    } else if (userLanguage.includes('-')) {
        const userLanguageSplit = userLanguage.split('-')
        if (languagesAvailable.includes(userLanguageSplit[0])) {
            return loadLanguageAsync(userLanguageSplit[0])
        }
    }
    return loadLanguageAsync('en')
}

export function loadLanguageAsync (lang: string) {
    if (i18n.global.locale !== lang) {
        if (!loadedLanguages.includes(lang)) {
            setI18nLanguage(lang)
        }
        return Promise.resolve(setI18nLanguage(lang))
    }
    return Promise.resolve(setI18nLanguage(lang))
}

