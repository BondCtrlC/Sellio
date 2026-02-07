import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductsList } from './products-list';
import type { PlanType } from '@/types';

export const metadata: Metadata = { title: "สินค้า" };

async function getProducts() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get creator with plan
  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  // Get products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('creator_id', creator.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return { 
    products: products || [], 
    creatorId: creator.id,
    plan: (creator.plan || 'free') as PlanType,
  };
}

export default async function ProductsPage() {
  const { products, plan } = await getProducts();

  return <ProductsList initialProducts={products} plan={plan} />;
}
