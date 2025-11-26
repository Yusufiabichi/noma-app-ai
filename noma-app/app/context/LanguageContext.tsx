// app/context/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Lang = "english" | "hausa" | "yoruba" | "igbo";

type LanguageContextType = {
  language: Lang;
  setLanguage: (l: Lang) => void;
  loading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({
  children,
  initial = "english",
}: {
  children: ReactNode;
  initial?: Lang;
}) => {
  const [language, setLanguage] = useState<Lang>(initial);
  const [loading, setLoading] = useState(true);

  // Load saved language from AsyncStorage on startup
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem("appLanguage");
        if (stored) {
          setLanguage(stored as Lang);
        }
      } catch (error) {
        console.log("Error loading language:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language whenever it changes
  useEffect(() => {
    const saveLanguage = async () => {
      try {
        await AsyncStorage.setItem("appLanguage", language);
      } catch (error) {
        console.log("Error saving language:", error);
      }
    };

    if (!loading) {
      saveLanguage();
    }
  }, [language, loading]);

  const value = useMemo(
    () => ({ language, setLanguage, loading }),
    [language, loading]
  );
    
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used inside a LanguageProvider");
  return ctx;
}
