// Shared i18n configuration - safe to import from both server and client components
export const locales = ['th', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'th';
