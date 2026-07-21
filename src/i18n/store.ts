import { create } from 'zustand';
import vi from './dictionaries/vi.json';
import en from './dictionaries/en.json';
import zh from './dictionaries/zh.json';

type Language = 'vi' | 'en' | 'zh';

const dictionaries = {
  vi,
  en,
  zh
};

type I18nStore = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

export const useI18nStore = create<I18nStore>((set, get) => ({
  language: 'vi', // Mặc định tiếng Việt
  setLanguage: (lang) => set({ language: lang }),
  t: (keyPath) => {
    const { language } = get();
    const dict = dictionaries[language];
    
    // Tách keyPath (VD: 'login.title') thành mảng ['login', 'title']
    const keys = keyPath.split('.');
    let value: any = dict;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return keyPath; // Trả về key nếu không tìm thấy translation
      }
    }
    
    return typeof value === 'string' ? value : keyPath;
  }
}));
