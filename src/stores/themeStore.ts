import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

const STORAGE_KEY_THEME = 'mandimatch_theme';

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored !== null) {
      return stored === 'dark';
    }
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  if (typeof document !== 'undefined') {
    if (initial) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isDark: initial,

    toggleTheme: () => {
      const next = !get().isDark;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY_THEME, next ? 'dark' : 'light');
      } catch {}
      set({ isDark: next });
    },

    setDark: (val: boolean) => {
      if (typeof document !== 'undefined') {
        if (val) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY_THEME, val ? 'dark' : 'light');
      } catch {}
      set({ isDark: val });
    },
  };
});
