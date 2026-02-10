'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import { 
  Crown, 
  Check, 
  Package, 
  Download, 
  Star, 
  Palette,
  BarChart3,
  Zap,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import type { PlanType } from '@/types';
import { useTranslations } from 'next-intl';

interface UpgradeClientProps {
  plan: PlanType;
  productCount: number;
  hasSubscription: boolean;
  planExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionInterval: 'month' | 'year';
}

export function UpgradeClient({ plan, productCount, hasSubscription, planExpiresAt, cancelAtPeriodEnd, subscriptionInterval }: UpgradeClientProps) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);
  const [isScheduledCancel, setIsScheduledCancel] = useState(cancelAtPeriodEnd);
  const [isYearly, setIsYearly] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');
  const t = useTranslations('Upgrade');

  const isPro = plan === 'pro';
  const isMonthly = subscriptionInterval === 'month';

  const handleSwitchToYearly = async () => {
    setSwitchingPlan(true);
    try {
      const res = await fetch('/api/stripe/switch-plan', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t('switchError'));
        setSwitchingPlan(false);
      }
    } catch {
      alert(t('switchError'));
      setSwitchingPlan(false);
    }
  };

  const PRO_FEATURES = [
    { icon: Package, label: t('proUnlimitedProducts'), description: t('proUnlimitedProductsDesc') },
    { icon: Download, label: t('proExportCSV'), description: t('proExportCSVDesc') },
    { icon: Star, label: t('proReviewMgmt'), description: t('proReviewMgmtDesc') },
    { icon: Palette, label: t('proNoBranding'), description: t('proNoBrandingDesc') },
    { icon: BarChart3, label: t('proAdvancedAnalytics'), description: t('proAdvancedAnalyticsDesc') },
    { icon: Shield, label: t('proPrioritySupport'), description: t('proPrioritySupportDesc') },
  ];

  const FREE_FEATURES = [
    t('freeMax2Products'),
    t('freeOnlineStore'),
    t('freePromptPay'),
    t('freeCoupons'),
    t('freeCalendar'),
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: isYearly ? 'year' : 'month' }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t('error'));
      }
    } catch {
      alert(t('errorRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (immediate: boolean) => {
    const msg = immediate ? t('confirmCancelImmediate') : t('confirmCancelEnd');
    
    if (!confirm(msg)) return;
    
    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.immediate) {
          window.location.reload();
        } else {
          setIsScheduledCancel(true);
        }
      } else {
        alert(data.error || t('error'));
      }
    } catch {
      alert(t('errorRetry'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        {t('backToDashboard')}
      </Link>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <p className="font-medium text-green-800">{t('upgradeSuccess')}</p>
          <p className="text-sm text-green-700 mt-1">{t('upgradeSuccessDesc')}</p>
        </div>
      )}
      
      {cancelled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <p className="font-medium text-amber-800">{t('paymentCancelled')}</p>
          <p className="text-sm text-amber-700 mt-1">{t('paymentCancelledDesc')}</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
          <Crown className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {isPro ? t('youArePro') : t('upgradeToPro')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isPro ? t('unlimitedFeatures') : t('unlockAll', { price: isYearly ? t('pricePerYear') : t('pricePerMonth') })}
        </p>

        {/* Monthly / Yearly Toggle */}
        {!isPro && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className={`text-sm font-medium transition-colors duration-300 ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('toggleMonthly')}
            </span>
            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isYearly ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t('toggleYearly')}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 bg-green-500 rounded-full text-white text-xs font-bold">
              {t('yearlySave')}
            </span>
          </div>
        )}
      </div>

      {/* Current Plan Status */}
      {isPro && (
        <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-lg">Sellio Pro</span>
                </div>
                <p className="text-sm text-muted-foreground">{subscriptionInterval === 'year' ? t('pricePerYear') : t('pricePerMonth')}</p>
                {planExpiresAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('nextRenewal', { date: new Date(planExpiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) })}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                {isScheduledCancel ? (
                  <>
                    <span className="text-sm text-amber-600 font-medium">{t('scheduledCancel')}</span>
                    <button
                      type="button"
                      onClick={() => handleCancel(true)}
                      disabled={cancelling}
                      className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                    >
                      {cancelling ? t('cancelling') : t('cancelImmediately')}
                    </button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCancel(false)}
                      disabled={cancelling}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {cancelling ? t('cancelling') : t('cancelAtPeriodEnd')}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleCancel(true)}
                      disabled={cancelling}
                      className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                    >
                      {t('cancelImmediately')}
                    </button>
                  </>
                )}
                <Link 
                  href="/dashboard/settings?tab=billing"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  {t('viewBillingHistory')}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Switch to Yearly (for monthly Pro users) */}
      {isPro && isMonthly && !isScheduledCancel && (
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-lg text-green-800">{t('switchToYearly')}</p>
                <p className="text-sm text-green-700 mt-1">{t('switchToYearlyDesc')}</p>
                <p className="text-xs text-green-600 mt-1">{t('switchToYearlyNote')}</p>
              </div>
              <Button
                onClick={handleSwitchToYearly}
                disabled={switchingPlan}
                className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap shrink-0"
              >
                {switchingPlan ? t('switchingPlan') : t('switchToYearlyBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Switch to Monthly (for yearly Pro users) */}
      {isPro && !isMonthly && !isScheduledCancel && (
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-lg text-blue-800">{t('switchToMonthly')}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {t('switchToMonthlyDesc', { date: planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' })}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm(t('switchToMonthlyConfirm'))) {
                    handleCancel(false);
                  }
                }}
                disabled={cancelling}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 whitespace-nowrap shrink-0"
              >
                {cancelling ? t('cancelling') : t('switchToMonthlyBtn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Free Plan */}
        <Card className={`relative ${!isPro ? 'border-primary ring-1 ring-primary' : ''}`}>
          {!isPro && (
            <div className="absolute -top-3 left-4">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                {t('currentPlan')}
              </span>
            </div>
          )}
          <CardContent className="pt-8">
            <h3 className="text-xl font-bold mb-1">Free</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">0</span>
              <span className="text-muted-foreground ml-1">{t('perMonth')}</span>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative ${isPro ? 'border-amber-400 ring-2 ring-amber-400' : 'border-amber-200'}`}>
          {isPro && (
            <div className="absolute -top-3 left-4">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                {t('currentPlan')}
              </span>
            </div>
          )}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              {t('recommended')}
            </span>
          </div>
          {/* Yearly Save Badge */}
          {isYearly && !isPro && (
            <div className="absolute -top-4 -right-3">
              <div className="inline-flex items-center px-5 py-2 bg-green-500 rounded-full text-white text-base font-bold shadow-xl shadow-green-500/30">
                {t('yearlySave')}
              </div>
            </div>
          )}
          <CardContent className="pt-8">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Pro
            </h3>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm">฿</span>
              <span className="text-3xl font-bold">{isYearly ? '2.4' : '3.3'}</span>
              <span className="text-muted-foreground">{t('perDayUnit')}</span>
              <span className="text-sm text-muted-foreground ml-1">({isYearly ? t('pricePerYear') : t('pricePerMonth')})</span>
            </div>
            
            <ul className="space-y-3 mb-6">
              {PRO_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{feature.label}</span>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {!isPro && (
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    t('openingPayment')
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {t('upgradeNow')}
                    </>
                  )}
                </Button>
                <p className="text-sm font-medium text-center text-muted-foreground">
                  {t('upgradeNote')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">{t('faq')}</h2>
        <div className="space-y-3">
          <details className="p-4 border rounded-lg group">
            <summary className="font-medium cursor-pointer">{t('faqChangePlan')}</summary>
            <p className="text-sm text-muted-foreground mt-2">{t('faqChangePlanAnswer')}</p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">{t('faqCancelProducts')}</summary>
            <p className="text-sm text-muted-foreground mt-2">{t('faqCancelProductsAnswer')}</p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">{t('faqPayment')}</summary>
            <p className="text-sm text-muted-foreground mt-2">{t('faqPaymentAnswer')}</p>
          </details>
        </div>
      </div>
    </div>
  );
}
