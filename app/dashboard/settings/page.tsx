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
  
  // Check if subscription is scheduled for cancellation + get interval
  let cancelAtPeriodEnd = false;
  let subscriptionInterval: 'month' | 'year' = 'month';
  if (creator.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(creator.stripe_subscription_id);
      cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
      // Get billing interval from subscription items
      const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
      if (interval === 'year') subscriptionInterval = 'year';
    } catch {
      // Subscription might not exist in Stripe anymore
    }
  }

  return {
    plan: (creator.plan || 'free') as PlanType,
    hasSubscription: !!creator.stripe_subscription_id,
    planExpiresAt: creator.plan_expires_at as string | null,
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
    <div className="space-y-6 max-w-2xl">
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
