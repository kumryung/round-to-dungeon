import { KO } from './locales/ko.js';
import { EN } from './locales/en.js';
import { JA } from './locales/ja.js';
import { getState, saveState } from './gameState.js';

const LOCALES = {
    ko: KO,
    en: EN,
    ja: JA,
};

let currentLang = 'ko';

/**
 * Initialize I18n with the language from game state.
 */
export function initI18n() {
    const state = getState();
    if (state.language && LOCALES[state.language]) {
        currentLang = state.language;
    } else {
        currentLang = 'ko';
        // Ensure state has the default
        if (!state.language) {
            state.language = 'ko';
            saveState();
        }
    }
    console.log(`[I18n] Initialized with language: ${currentLang}`);
}

/**
 * Change the current language and save to state.
 * @param {string} langCode - 'ko', 'en', or 'ja'
 */
export function setLanguage(langCode) {
    if (LOCALES[langCode]) {
        currentLang = langCode;
        const state = getState();
        state.language = langCode;
        saveState();
        console.log(`[I18n] Language switched to: ${currentLang}`);
    } else {
        console.warn(`[I18n] Unsupported language: ${langCode}`);
    }
}

/**
 * Get translation for a key.
 * @param {string} key - Dot notation key (e.g. 'ui.town.title')
 * @param {object} [params] - Replacement parameters (e.g. { amount: 100 })
 * @returns {string} Translated text or the key itself if not found.
 */
export function t(key, params = {}) {
    const dict = LOCALES[currentLang] || KO;

    // Navigate the object using the dot notation key
    const keys = key.split('.');
    let value = dict;

    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            // Fallback to Korean if missing in current lang
            if (currentLang !== 'ko') {
                let fallback = KO;
                for (const fk of keys) {
                    if (fallback && fallback[fk] !== undefined) {
                        fallback = fallback[fk];
                    } else {
                        return key; // Totally missing
                    }
                }
                value = fallback;
            } else {
                return key; // Missing in KO too
            }
        }
    }

    if (typeof value !== 'string') {
        return key; // Key likely points to an object, not a string
    }

    // Replace params
    return value.replace(/{(\w+)}/g, (_, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : `{${paramKey}}`;
    });
}

/**
 * Get the current language code.
 */
export function getLanguage() {
    return currentLang;
}
