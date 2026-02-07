import Link from 'next/link';
import { Store } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('StoreFront');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center px-4">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('storeNotFoundTitle')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('storeNotFoundDesc')}
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
