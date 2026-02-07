import type { Metadata } from 'next';
import { getStoreLayout } from '@/actions/store-layout';
import { redirect } from 'next/navigation';
import { MyStoreClient } from './my-store-client';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('MyStore');
  return { title: t('metaTitle') };
}

export default async function MyStorePage() {
  const result = await getStoreLayout();

  if (!result.success || !result.data) {
    redirect('/login');
  }

  const { creator, sections, unsectionedItems } = result.data;

  return (
    <MyStoreClient
      creator={creator}
      sections={sections}
      unsectionedItems={unsectionedItems}
    />
  );
}
