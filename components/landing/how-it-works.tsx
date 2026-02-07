'use client';

import { UserPlus, Package, Share, Banknote } from 'lucide-react';
import { useTranslations } from 'next-intl';

const stepKeys = [
  { key: 'step1', icon: UserPlus, color: 'from-purple-500 to-purple-600' },
  { key: 'step2', icon: Package, color: 'from-blue-500 to-blue-600' },
  { key: 'step3', icon: Share, color: 'from-pink-500 to-pink-600' },
  { key: 'step4', icon: Banknote, color: 'from-green-500 to-green-600' },
] as const;

export function HowItWorks() {
  const t = useTranslations('HowItWorks');

  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('title1')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('title2')}</span>
          </h2>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stepKeys.map((step, index) => (
            <div key={step.key} className="relative">
              {/* Connector Line */}
              {index < stepKeys.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}
              
              <div className="relative z-10 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t(`${step.key}Title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(`${step.key}Desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
