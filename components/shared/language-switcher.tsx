'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/actions/locale';
import { Globe } from 'lucide-react';
import { locales } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('LanguageSwitcher');
  const [isPending, startTransition] = useTransition();

  function handleChange(newLocale: string) {
    if (newLocale === locale) return;
    startTransition(async () => {
      await setLocale(newLocale);
      // Reload to apply new locale
      window.location.reload();
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe className="h-4 w-4 text-muted-foreground absolute left-2 pointer-events-none" />
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="appearance-none bg-transparent border border-border rounded-lg pl-7 pr-6 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        aria-label="Change language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
      <svg
        className="h-3 w-3 text-muted-foreground absolute right-1.5 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
