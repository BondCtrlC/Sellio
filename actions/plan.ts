'use server';

import { createClient } from '@/lib/supabase/server';
import type { PlanType } from '@/types';

export interface CreatorPlanInfo {
  plan: PlanType;
  productCount: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_expires_at: string | null;
}

export async function getCreatorPlanInfo(): Promise<CreatorPlanInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan, stripe_customer_id, stripe_subscription_id, plan_expires_at')
    .eq('user_id', user.id)
    .single();

  if (!creator) return null;

  // Count products
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  return {
    plan: (creator.plan || 'free') as PlanType,
    productCount: count || 0,
    stripe_customer_id: creator.stripe_customer_id,
    stripe_subscription_id: creator.stripe_subscription_id,
    plan_expires_at: creator.plan_expires_at,
  };
}
