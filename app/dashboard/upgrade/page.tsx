import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UpgradeClient } from './upgrade-client';
import type { PlanType } from '@/types';

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

  return {
    plan: (creator.plan || 'free') as PlanType,
    productCount: count || 0,
    hasSubscription: !!creator.stripe_subscription_id,
    planExpiresAt: creator.plan_expires_at,
  };
}

export default async function UpgradePage() {
  const info = await getCreatorSubscriptionInfo();
  
  return <UpgradeClient {...info} />;
}
