'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CTA() {
  const t = useTranslations('CTA');

  return (
    <section className="py-20 lg:py-32 bg-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          {t('badge')}
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          {t('headline1')}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {t('headline2')}
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          {t('subheadline')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button 
              size="lg" 
              className="h-14 px-8 text-base bg-white text-black hover:bg-gray-100 gap-2 shadow-lg"
            >
              {t('ctaCreate')}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 text-base border-white/40 text-white hover:bg-white/15 bg-white/10"
            >
              {t('ctaDemo')}
            </Button>
          </Link>
        </div>

        {/* Trust Text */}
        <p className="mt-8 text-sm text-gray-400">
          {t('trustText')}
        </p>
      </div>
    </section>
  );
}
