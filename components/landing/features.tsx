'use client';

import { 
  ShoppingBag, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  Tag, 
  Star, 
  Link as LinkIcon, 
  FileDown,
  Users,
  Bell,
  Palette,
  Share2
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const featureKeys = [
  { key: 'sellAnything', icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
  { key: 'booking', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  { key: 'easyPayment', icon: CreditCard, color: 'bg-green-100 text-green-600' },
  { key: 'analytics', icon: BarChart3, color: 'bg-orange-100 text-orange-600' },
  { key: 'coupons', icon: Tag, color: 'bg-pink-100 text-pink-600' },
  { key: 'reviews', icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  { key: 'affiliate', icon: LinkIcon, color: 'bg-indigo-100 text-indigo-600' },
  { key: 'secureDelivery', icon: FileDown, color: 'bg-cyan-100 text-cyan-600' },
  { key: 'customers', icon: Users, color: 'bg-rose-100 text-rose-600' },
  { key: 'notifications', icon: Bell, color: 'bg-amber-100 text-amber-600' },
  { key: 'customizeStore', icon: Palette, color: 'bg-teal-100 text-teal-600' },
  { key: 'socialShare', icon: Share2, color: 'bg-violet-100 text-violet-600' },
] as const;

export function Features() {
  const t = useTranslations('Features');

  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(feature.key)}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t(`${feature.key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
