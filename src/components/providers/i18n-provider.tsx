"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

type Locale = 'vi' | 'en' | 'zh';
const dictionaries: Record<Locale, any> = { vi, en, zh };

type I18nContextType = {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, defaultLocale = 'vi' }: { children: React.ReactNode, defaultLocale?: string }) {
  const [locale, setLocaleState] = useState<Locale>((defaultLocale as Locale) || 'vi');
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh(); // Cập nhật Server Components
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let value = dictionaries[locale];
    for (const key of keys) {
      if (value === undefined) break;
      value = value[key];
    }
    return value || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
