import { create } from 'zustand';
import { Language } from '../types';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import kn from '../locales/kn.json';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
}

const STORAGE_KEY_LANG = 'mandimatch_language';

const translations: Record<Language, any> = {
  en,
  hi,
  kn,
};

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANG) as Language;
    if (stored && (stored === 'en' || stored === 'hi' || stored === 'kn')) {
      return stored;
    }
  } catch {}
  return 'en';
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {}
    set({ language: lang });
  },

  t: (path: string, fallback?: string): string => {
    const lang = get().language;
    const currentDict = translations[lang] || translations.en;
    const parts = path.split('.');

    let current = currentDict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English
        let enCurrent: any = translations.en;
        for (const enPart of parts) {
          if (enCurrent && typeof enCurrent === 'object' && enPart in enCurrent) {
            enCurrent = enCurrent[enPart];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  },
}));
