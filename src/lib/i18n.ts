import { cookies } from 'next/headers';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

type Locale = 'vi' | 'en' | 'zh';
const dictionaries: Record<Locale, any> = { vi, en, zh };

export async function getDictionary() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'vi') as Locale;
  
  const dict = dictionaries[locale] || dictionaries.vi;

  const t = (path: string): string => {
    const keys = path.split('.');
    let value = dict;
    for (const key of keys) {
      if (value === undefined) break;
      value = value[key];
    }
    return value || path;
  };

  return { t, locale };
}
