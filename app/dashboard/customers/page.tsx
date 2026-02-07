import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomers } from '@/actions/customers';
import { CustomersList } from './customers-list';
import { getTranslations } from 'next-intl/server';
import type { PlanType } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Customers');
  return { title: t('metaTitle') };
}

async function getCreatorPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'free' as PlanType;
  
  const { data: creator } = await supabase
    .from('creators')
    .select('plan')
    .eq('user_id', user.id)
    .single();
  
  return (creator?.plan || 'free') as PlanType;
}

export default async function CustomersPage() {
  const [result, plan] = await Promise.all([
    getCustomers(),
    getCreatorPlan(),
  ]);
  
  if (!result.success && (result as any).errorCode === 'AUTH_REQUIRED') {
    redirect('/login');
  }

  return <CustomersList initialCustomers={result.customers} plan={plan} />;
}
