export const LOCALES = ["pt-BR", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";
export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}
