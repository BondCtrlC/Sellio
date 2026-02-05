import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductsList } from './products-list';

async function getProducts() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
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

  return { products: products || [], creatorId: creator.id };
}

export default async function ProductsPage() {
  const { products } = await getProducts();

  return <ProductsList initialProducts={products} />;
}
