import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CalendarPage');
  return { title: t('metaTitle') };
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
