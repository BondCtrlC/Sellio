import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: "ตั้งค่า" };
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { SettingsForm } from './settings-form';
import { getCreatorInvoices } from '@/actions/plan';
import { stripe } from '@/lib/stripe';
import type { PlanType } from '@/types';

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
  
  // Check if subscription is scheduled for cancellation
  let cancelAtPeriodEnd = false;
  if (creator.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(creator.stripe_subscription_id);
      cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
    } catch {
      // Subscription might not exist in Stripe anymore
    }
  }

  return {
    plan: (creator.plan || 'free') as PlanType,
    hasSubscription: !!creator.stripe_subscription_id,
    planExpiresAt: creator.plan_expires_at as string | null,
    cancelAtPeriodEnd,
    invoices,
  };
}

export default async function SettingsPage() {
  const creator = await getCreator();
  const billingInfo = await getBillingInfo(creator);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">ตั้งค่า</h2>
        <p className="text-muted-foreground">จัดการโปรไฟล์และการตั้งค่าร้านค้าของคุณ</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<div>กำลังโหลด...</div>}>
            <SettingsForm creator={creator} billingInfo={billingInfo} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
