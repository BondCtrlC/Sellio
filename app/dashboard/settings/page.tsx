import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { SettingsForm } from './settings-form';
import { getCreatorInvoices } from '@/actions/plan';
import { stripe } from '@/lib/stripe';
import { getTranslations } from 'next-intl/server';
import type { PlanType } from '@/types';

// Force dynamic rendering to prevent stale Stripe data
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings');
  return { title: t('metaTitle') };
}

async function getCreator() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  return creator;
}

async function getBillingInfo(creator: any) {
  const invoices = await getCreatorInvoices();
  
  // Check if subscription is scheduled for cancellation + get interval + period end
  let cancelAtPeriodEnd = false;
  let subscriptionInterval: 'month' | 'year' = 'month';
  let planExpiresAt: string | null = creator.plan_expires_at as string | null;
  if (creator.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(creator.stripe_subscription_id);
      cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
      // Get billing interval and period end from subscription items
      // Note: Since Stripe API 2025-03-31 (basil), current_period_end is on item level, not subscription level
      const firstItem = subscription.items?.data?.[0];
      const interval = firstItem?.price?.recurring?.interval;
      if (interval === 'year') subscriptionInterval = 'year';
      // Get period end from subscription item (new Stripe API location)
      const itemAny = firstItem as unknown as Record<string, unknown> | undefined;
      const periodEnd = itemAny?.current_period_end as number | undefined;
      if (periodEnd) {
        planExpiresAt = new Date(periodEnd * 1000).toISOString();
      }
    } catch {
      // Subscription might not exist in Stripe anymore
    }
  }

  return {
    plan: (creator.plan || 'free') as PlanType,
    hasSubscription: !!creator.stripe_subscription_id,
    planExpiresAt,
    cancelAtPeriodEnd,
    subscriptionInterval,
    invoices,
  };
}

export default async function SettingsPage() {
  const t = await getTranslations('Settings');
  const creator = await getCreator();
  const billingInfo = await getBillingInfo(creator);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<div>{t('loading')}</div>}>
            <SettingsForm creator={creator} billingInfo={billingInfo} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
