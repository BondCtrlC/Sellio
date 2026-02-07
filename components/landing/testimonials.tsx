'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

const testimonialKeys = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;
const avatars = ['👩‍🎨', '👨‍🏫', '📱', '🎨', '📸', '🎵'];

export function Testimonials() {
  const t = useTranslations('Testimonials');

  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-gray-50">
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

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonialKeys.map((key, index) => (
            <div
              key={key}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                &ldquo;{t(`${key}Content`)}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {avatars[index]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {t(`${key}Name`)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t(`${key}Role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '1,000+', labelKey: 'statCreators' },
            { value: '50,000+', labelKey: 'statProducts' },
            { value: '฿10M+', labelKey: 'statRevenue' },
            { value: '4.9/5', labelKey: 'statRating' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-500">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
