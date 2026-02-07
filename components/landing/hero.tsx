'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Play, CheckCircle, Star, Instagram, MessageCircle, Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('badge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            {t('headline1')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {t('headline2')}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('subheadline')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-base gap-2 shadow-lg shadow-black/10">
                {t('ctaStart')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base gap-2">
                <Play className="w-5 h-5" />
                {t('ctaDemo')}
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>{t('trustFree')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>{t('trustNoCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>{t('trustQuick')}</span>
            </div>
          </div>
        </div>

        {/* Phone Mockup with Store Preview */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl flex items-center justify-center">
            
            {/* Left Floating Cards - staggered positions */}
            <div className="absolute left-0 top-0 bottom-0 hidden lg:block">
              {/* ยอดขายวันนี้ */}
              <div className="absolute -left-6 top-[8%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('floatSalesToday')}</p>
                    <p className="text-lg font-bold text-green-600">฿12,450</p>
                  </div>
                </div>
              </div>

              {/* รีวิว */}
              <div className="absolute left-6 top-[45%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float animation-delay-2000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('floatNewReview')}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(4.9)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-[52px]">{t('floatReviewText')}</p>
              </div>

              {/* Conversion Rate */}
              <div className="absolute -left-2 top-[78%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float animation-delay-4000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('floatConversion')}</p>
                    <p className="text-lg font-bold text-blue-600">12.8%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Frame */}
            <div className="relative w-[280px] sm:w-[320px] flex-shrink-0">
              {/* Phone outer frame */}
              <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-gray-400/30">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
                
                {/* Screen */}
                <div className="bg-white rounded-[2.25rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-gray-900">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1.5 bg-gray-900 rounded-sm" />
                        <div className="w-1 h-2 bg-gray-900 rounded-sm" />
                        <div className="w-1 h-2.5 bg-gray-900 rounded-sm" />
                        <div className="w-1 h-3 bg-gray-900 rounded-sm" />
                      </div>
                      <span className="ml-1">5G</span>
                    </div>
                  </div>

                  {/* Store Preview Content */}
                  <div className="px-0">
                    {/* Cover / Header */}
                    <div className="relative h-36 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex flex-col items-center justify-center text-white">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center mb-2 overflow-hidden">
                        <span className="text-2xl">👩‍🎨</span>
                      </div>
                      <h3 className="font-bold text-sm">{t('mockupName')}</h3>
                      <p className="text-[10px] text-white/80 mt-0.5">{t('mockupBio')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Instagram className="w-3 h-3 text-white" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <MessageCircle className="w-3 h-3 text-white" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Mail className="w-3 h-3 text-white" />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Phone className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="px-4 py-3 space-y-2.5">
                      {/* Product 1 */}
                      <div className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🎨</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">Lightroom Preset Pack</p>
                          <p className="text-[10px] text-green-600 font-bold">฿299</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>

                      {/* Product 2 */}
                      <div className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📐</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">Canva Template Bundle</p>
                          <p className="text-[10px] text-green-600 font-bold">฿199</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>

                      {/* Product 3 */}
                      <div className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📸</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">1-on-1 Photo Review</p>
                          <p className="text-[10px] text-green-600 font-bold">฿500</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>

                      {/* Product 4 */}
                      <div className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">E-Book: สอนแต่งรูป</p>
                          <p className="text-[10px] text-green-600 font-bold">฿149</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>

                      {/* Powered by */}
                      <div className="text-center pt-1 pb-2">
                        <span className="text-[9px] text-gray-300">Powered by Sellio</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Right Floating Cards - staggered positions */}
            <div className="absolute right-0 top-0 bottom-0 hidden lg:block">
              {/* คำสั่งซื้อใหม่ */}
              <div className="absolute right-4 top-[15%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float animation-delay-1000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('floatNewOrders')}</p>
                    <p className="text-lg font-bold text-purple-600">{t('floatNewOrdersValue')}</p>
                  </div>
                </div>
              </div>

              {/* ลูกค้าใหม่ */}
              <div className="absolute right-12 top-[52%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float animation-delay-3000 min-w-[180px] lg:min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{t('floatNewCustomers')}</p>
                    <p className="text-lg font-bold text-pink-600">{t('floatNewCustomersValue')}</p>
                  </div>
                </div>
              </div>

              {/* PromptPay */}
              <div className="absolute right-8 top-[82%] bg-white rounded-xl shadow-lg p-4 border border-gray-100 animate-float animation-delay-5000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('floatPromptPay')}</p>
                    <p className="text-xs text-gray-500">{t('floatPromptPayDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
