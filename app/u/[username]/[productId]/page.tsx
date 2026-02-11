import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ProductDetail } from './product-detail';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ username: string; productId: string }>;
}

async function getCreatorByUsername(username: string) {
  const supabase = await createClient();
  
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, username, avatar_url, promptpay_id')
    .eq('username', username)
    .single();

  return creator;
}

async function getProduct(productId: string, creatorId: string) {
  const supabase = await createClient();
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .eq('is_published', true)
    .single();

  return product;
}

async function getAvailableSlots(productId: string) {
  const supabase = await createClient();
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data: slots } = await supabase
    .from('booking_slots')
    .select('id, slot_date, start_time, end_time, max_bookings, current_bookings')
    .eq('product_id', productId)
    .eq('is_available', true)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return slots || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, productId } = await params;
  const creator = await getCreatorByUsername(username);
  
  const t = await getTranslations('ProductDetail');

  if (!creator) {
    return { title: t('productNotFound') };
  }

  const product = await getProduct(productId, creator.id);
  
  if (!product) {
    return { title: t('productNotFound') };
  }

  return {
    title: `${product.title} | ${creator.display_name || creator.username}`,
    description: product.description || t('productOf', { name: creator.display_name || creator.username }),
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { username, productId } = await params;
  const creator = await getCreatorByUsername(username);

  if (!creator) {
    notFound();
  }

  const product = await getProduct(productId, creator.id);

  if (!product) {
    notFound();
  }

  // Get available slots for booking/live products
  let availableSlots: { id: string; slot_date: string; start_time: string; end_time: string; max_bookings: number; current_bookings: number }[] = [];
  if (product.type === 'booking' || product.type === 'live') {
    availableSlots = await getAvailableSlots(productId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ProductDetail 
        product={product as {
          id: string;
          title: string;
          description: string | null;
          type: 'digital' | 'booking' | 'live' | 'link';
          price: number;
          image_url: string | null;
          type_config: Record<string, unknown> | null;
        }} 
        creator={creator}
        availableSlots={availableSlots}
      />
    </div>
  );
}
