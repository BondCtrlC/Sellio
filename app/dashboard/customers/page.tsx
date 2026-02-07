import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomers } from '@/actions/customers';
import { CustomersList } from './customers-list';

export const metadata: Metadata = { title: "ลูกค้า" };
import type { PlanType } from '@/types';

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
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return <CustomersList initialCustomers={result.customers} plan={plan} />;
}
