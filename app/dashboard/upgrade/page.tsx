import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { UpgradeClient } from './upgrade-client';
import { getTranslations } from 'next-intl/server';
import type { PlanType } from '@/types';

// Force dynamic rendering to prevent stale Stripe data
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Upgrade');
  return { title: t('metaTitle') };
}

async function getCreatorSubscriptionInfo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan, stripe_customer_id, stripe_subscription_id, plan_expires_at')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  // Count products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  // Check if subscription is scheduled for cancellation + get interval + period end
  let cancelAtPeriodEnd = false;
  let subscriptionInterval: 'month' | 'year' = 'month';
  let planExpiresAt: string | null = creator.plan_expires_at;
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
    productCount: count || 0,
    hasSubscription: !!creator.stripe_subscription_id,
    planExpiresAt,
    cancelAtPeriodEnd,
    subscriptionInterval,
  };
}

export default async function UpgradePage() {
  const info = await getCreatorSubscriptionInfo();
  
  return <UpgradeClient {...info} />;
}
