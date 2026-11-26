import React, { useCallback, useEffect, useState } from 'react';
import { LanguageContext } from './LanguageContext';
import {
  TRANSLATIONS,
  formatPluralCount,
  translateServerError,
} from '../i18n/translations';

const STORAGE_KEY = 'foundry_lang';

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.title =
      lang === 'ar'
        ? 'Foundry — منصة التعليم الهندسي والتقني'
        : 'Foundry — Engineering & Technical Learning';
  }, [lang, isRtl]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;
      let text = dict[key] ?? TRANSLATIONS.en[key] ?? key;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replaceAll(`{{${paramKey}}}`, String(paramValue));
      });
      return text;
    },
    [lang]
  );

  const formatCount = useCallback(
    (count, noun) => formatPluralCount(count, noun, lang),
    [lang]
  );

  const tServer = useCallback(
    (message, fallbackKey) => translateServerError(message, lang, fallbackKey),
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggleLanguage, isRtl, t, formatCount, tServer }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
