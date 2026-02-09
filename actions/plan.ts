'use server';

import { createClient } from '@/lib/supabase/server';
import { stripe, formatStripeAmountToDisplay } from '@/lib/stripe';
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

// ============================================
// GET CREATOR INVOICES
// ============================================
export interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
}

export async function getCreatorInvoices(): Promise<InvoiceItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data: creator } = await supabase
    .from('creators')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!creator?.stripe_customer_id) {
    console.log('No stripe_customer_id found for invoices');
    return [];
  }

  try {
    console.log('Fetching invoices for customer:', creator.stripe_customer_id);
    const invoices = await stripe.invoices.list({
      customer: creator.stripe_customer_id,
      limit: 24,
    });

    console.log('Found', invoices.data.length, 'invoices');

    return invoices.data
      .filter((inv: any) => inv.status !== 'draft') // Skip draft invoices
      .map((inv: any) => ({
        id: inv.id,
        date: new Date((inv.created || 0) * 1000).toISOString(),
        amount: formatStripeAmountToDisplay(inv.amount_paid || inv.total || 0, inv.currency || 'thb'),
        currency: inv.currency || 'thb',
        status: inv.status || 'unknown',
        invoice_pdf: inv.invoice_pdf || null,
      }));
  } catch (error) {
    console.error('Failed to fetch invoices for customer', creator.stripe_customer_id, ':', error);
    return [];
  }
}
