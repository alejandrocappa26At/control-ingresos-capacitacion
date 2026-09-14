'use client';

import { useEffect, createElement } from 'react';
import { useDataStore } from '@/store/useDataStore';

const THEME_KEY = 'capacitacion-theme';

const THEME_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_KEY}');
    var theme = stored === 'light' ? 'light' : 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useThemeEffect() {
  const theme = useDataStore((s) => s.theme);
  const setTheme = useDataStore((s) => s.setTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme('dark');
    }
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
}

export function ThemeScript() {
  return createElement('script', {
    dangerouslySetInnerHTML: { __html: THEME_SCRIPT },
  });
}