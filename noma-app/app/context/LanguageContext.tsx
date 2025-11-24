
// app/context/LanguageContext.tsx
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type Lang = 'english' | 'hausa' | 'yoruba' | 'igbo'; 

type LanguageContextType = {
  language: Lang;
  setLanguage: (l: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children, initial = 'english' }: { children: ReactNode; initial?: Lang }) => {
  const [language, setLanguage] = useState<Lang>(initial);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider');
  return ctx;
}
