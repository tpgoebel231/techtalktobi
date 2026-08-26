import { createContext, useContext, useEffect, type ReactNode } from "react";
import { t } from "@/data/copy";
import type { Locale } from "@/lib/locale";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale === "de" ? "de" : "en";
  }, [locale]);

  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useCopy() {
  return t(useLocale());
}
