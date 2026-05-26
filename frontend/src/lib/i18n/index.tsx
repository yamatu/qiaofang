'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import zh from './zh.json';
import en from './en.json';

type Locale = 'zh' | 'en';
type Messages = typeof zh;

const messages: Record<Locale, Messages> = { zh, en };

interface I18nContextType {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  t: zh,
  setLocale: () => {},
  toggleLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('locale') as Locale) || 'zh';
    }
    return 'zh';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
  }, []);

  const toggleLocale = useCallback(() => {
    const next = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider value={{ locale, t: messages[locale], setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
