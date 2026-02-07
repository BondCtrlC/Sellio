import Link from 'next/link';
import { Package } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('ProductDetail');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center px-4">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('productNotFound')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('productNotFoundDesc')}
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
