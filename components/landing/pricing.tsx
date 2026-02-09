'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Check, X, Sparkles, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Pricing() {
  const t = useTranslations('Pricing');
  const [isYearly, setIsYearly] = useState(false);

  const proPrice = isYearly ? t('proYearlyPrice') : '3.3';
  const proMonthlyLabel = isYearly ? t('proYearlyMonthly') : t('proMonthly');
  const proCtaNote = isYearly ? t('ctaNotePro', { price: '2.4' }) : t('ctaNotePro', { price: '3.3' });

  const plans = [
    {
      name: 'Free',
      description: t('freeDesc'),
      price: '0',
      period: t('freePeriod'),
      highlight: false,
      features: [
        { text: t('featureStore'), included: true },
        { text: t('featureMax2'), included: true },
        { text: t('featureUnlimitedOrders'), included: true },
        { text: t('featurePromptPay'), included: true },
        { text: t('featureBooking'), included: true },
        { text: t('featureQuickReply'), included: true },
        { text: t('featureShareLinks'), included: true },
        { text: t('featureBasicStats'), included: true },
        { text: t('featureViewReviews'), included: true },
        { text: t('featureManageReviews'), included: false },
        { text: t('featureRemoveBranding'), included: false },
        { text: t('featureExport'), included: false },
      ],
      cta: t('ctaFree'),
      ctaVariant: 'outline' as const,
      ctaNote: t('ctaNoteFree'),
    },
    {
      name: 'Pro',
      description: t('proDesc'),
      price: proPrice,
      period: t('proPeriod'),
      monthlyPrice: proMonthlyLabel,
      highlight: true,
      features: [
        { text: t('proEverythingFree'), included: true, bold: true },
        { text: t('featureUnlimitedProducts'), included: true, bold: true },
        { text: t('featureUnlimitedOrders'), included: true },
        { text: t('featureManageReviews'), included: true, bold: true },
        { text: t('featureRemoveBranding'), included: true },
        { text: t('featureExportFull'), included: true, bold: true },
        { text: t('featurePriority'), included: true },
      ],
      cta: t('ctaPro'),
      ctaVariant: 'default' as const,
      ctaNote: proCtaNote,
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('title1')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('title2')}</span>
            {t('title3')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              {t('toggleMonthly')}
            </span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isYearly ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
              {t('toggleYearly')}
            </span>
            
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-black text-white ring-4 ring-black/10 scale-[1.02]'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    {t('recommended')}
                  </div>
                </div>
              )}

              {/* Yearly Save Badge */}
              {plan.highlight && isYearly && (
                <div className="absolute -top-4 -right-3">
                  <div className="inline-flex items-center px-4 py-1.5 bg-green-500 rounded-full text-white text-sm font-bold shadow-lg shadow-green-500/30 animate-pulse">
                    {t('proYearlySave')}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">฿</span>
                  <span className={`text-4xl sm:text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                  {(plan as { monthlyPrice?: string }).monthlyPrice && (
                    <span className="text-sm text-gray-400 ml-1">
                      ({(plan as { monthlyPrice?: string }).monthlyPrice})
                    </span>
                  )}
                </div>
                {plan.highlight && (
                  <p className="text-sm text-purple-300 mt-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {t('proCheaper')}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-green-400' : 'text-green-500'}`} />
                    ) : (
                      <X className="w-5 h-5 flex-shrink-0 text-gray-300" />
                    )}
                    <span className={`text-sm ${
                      !feature.included 
                        ? 'text-gray-400 line-through' 
                        : plan.highlight 
                          ? (feature as { bold?: boolean }).bold ? 'text-white font-medium' : 'text-gray-200'
                          : 'text-gray-600'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="space-y-2">
                <Link href="/signup" className="block">
                  <Button 
                    variant={plan.highlight ? 'secondary' : plan.ctaVariant}
                    className={`w-full ${plan.highlight ? 'bg-white text-black hover:bg-gray-100 font-semibold' : ''}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                {plan.ctaNote && (
                  <p className={`text-xs text-center ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                    {plan.ctaNote}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-4">
            <Check className="w-4 h-4 text-green-500" />
            {t('bottomNoCard')}
            <span className="text-gray-300">|</span>
            <Check className="w-4 h-4 text-green-500" />
            {t('bottomCancel')}
            <span className="text-gray-300">|</span>
            <Check className="w-4 h-4 text-green-500" />
            {t('bottomNoHidden')}
          </div>
          <p className="text-gray-500">
            {t('bottomQuestion')}{' '}
            <a href="mailto:support@sellio.me" className="text-black font-medium hover:underline">
              support@sellio.me
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
