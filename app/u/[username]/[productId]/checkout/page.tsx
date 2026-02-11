import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { CheckoutForm } from './checkout-form';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Checkout');
  return { title: t('metaTitle') };
}

interface PageProps {
  params: Promise<{ username: string; productId: string }>;
  searchParams: Promise<{ slot?: string }>;
}

async function getProductAndCreator(username: string, productId: string) {
  const supabase = await createClient();

  // Get creator
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      promptpay_id,
      promptpay_name
    `)
    .eq('username', username)
    .eq('is_published', true)
    .single();

  if (creatorError || !creator) {
    return null;
  }

  // Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      type,
      price,
      image_url,
      type_config
    `)
    .eq('id', productId)
    .eq('creator_id', creator.id)
    .eq('is_published', true)
    .single();

  if (productError || !product) {
    return null;
  }

  return { creator, product };
}

async function getSlotInfo(slotId: string, productId: string) {
  const supabase = await createClient();

  const { data: slot } = await supabase
    .from('booking_slots')
    .select('id, slot_date, start_time, end_time, is_available, is_booked')
    .eq('id', slotId)
    .eq('product_id', productId)
    .single();

  return slot;
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { username, productId } = await params;
  const { slot: slotId } = await searchParams;

  const data = await getProductAndCreator(username, productId);

  if (!data) {
    notFound();
  }

  const { creator, product } = data;

  // Check if creator has PromptPay setup
  const hasPaymentMethod = !!creator.promptpay_id;
  if (!hasPaymentMethod) {
    // Redirect back with error
    redirect(`/u/${username}/${productId}?error=payment_not_setup`);
  }

  // For booking/live products, slot is required
  let slotInfo = null;
  if ((product.type === 'booking' || product.type === 'live') && slotId) {
    slotInfo = await getSlotInfo(slotId, productId);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutForm
        product={product}
        creator={creator}
        slotId={slotId}
        slotInfo={slotInfo}
      />
    </div>
  );
}
