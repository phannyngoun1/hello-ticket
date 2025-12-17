import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { APP_CONFIG, STORAGE_KEYS } from '@truths/config'
import { storage } from '@truths/utils'
import en from './locales/en.json'
import fr from './locales/fr.json'
import es from './locales/es.json'

const resources = {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: storage.get<string>(STORAGE_KEYS.LOCALE) || APP_CONFIG.DEFAULT_LOCALE,
        fallbackLng: APP_CONFIG.DEFAULT_LOCALE,
        interpolation: {
            escapeValue: false,
        },
    })

export default i18n

