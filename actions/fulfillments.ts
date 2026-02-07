'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

// ============================================
// Types
// ============================================
interface DigitalFulfillmentContent {
  // Delivery type
  delivery_type: 'file' | 'redirect';
  
  // File delivery
  file_url?: string;
  file_name?: string;
  download_count?: number;
  max_downloads?: number;
  
  // Redirect delivery
  redirect_url?: string;
  redirect_name?: string;
}

interface BookingFulfillmentContent {
  meeting_type: 'online' | 'offline';
  meeting_url?: string;
  meeting_platform?: string;
  location?: string;
  notes?: string;
}

interface LiveFulfillmentContent {
  platform: string;
  access_url: string;
  access_code?: string;
  notes?: string;
}

type FulfillmentContent = DigitalFulfillmentContent | BookingFulfillmentContent | LiveFulfillmentContent;

export interface Fulfillment {
  id: string;
  order_id: string;
  type: 'download' | 'booking_details' | 'live_access';
  content: FulfillmentContent;
  access_token: string;
  access_until: string | null;
  is_accessed: boolean;
  accessed_at: string | null;
  created_at: string;
}

// ============================================
// CREATE FULFILLMENT (Auto or Manual)
// ============================================
export async function createFulfillment(
  orderId: string,
  type: 'download' | 'booking_details' | 'live_access',
  content: FulfillmentContent
): Promise<{ success: boolean; error?: string; fulfillment?: Fulfillment }> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  // Check if fulfillment already exists
  const { data: existing } = await supabase
    .from('fulfillments')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (existing) {
    return { success: false, error: 'Fulfillment already exists for this order' };
  }

  const { data, error } = await supabase
    .from('fulfillments')
    .insert({
      order_id: orderId,
      type,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Create fulfillment error:', error);
    return { success: false, error: t('cannotCreateFulfillment') };
  }

  revalidatePath(`/checkout/${orderId}/success`);
  return { success: true, fulfillment: data };
}

// ============================================
// GET FULFILLMENT BY ORDER ID
// ============================================
export async function getFulfillmentByOrderId(orderId: string): Promise<Fulfillment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fulfillments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// ============================================
// GET FULFILLMENT BY ACCESS TOKEN (for public access)
// ============================================
export async function getFulfillmentByToken(token: string): Promise<{
  fulfillment: Fulfillment | null;
  order: {
    buyer_name: string;
    buyer_email: string;
    product_title: string;
  } | null;
}> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  const { data, error } = await supabase
    .from('fulfillments')
    .select(`
      *,
      order:orders(
        buyer_name,
        buyer_email,
        product:products(title)
      )
    `)
    .eq('access_token', token)
    .single();

  if (error || !data) {
    return { fulfillment: null, order: null };
  }

  const order = data.order as any;
  return {
    fulfillment: {
      id: data.id,
      order_id: data.order_id,
      type: data.type,
      content: data.content,
      access_token: data.access_token,
      access_until: data.access_until,
      is_accessed: data.is_accessed,
      accessed_at: data.accessed_at,
      created_at: data.created_at,
    },
    order: order ? {
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      product_title: (order.product as { title?: string } | null)?.title || t('productDefault'),
    } : null,
  };
}

// ============================================
// UPDATE FULFILLMENT (for booking/live details)
// ============================================
export async function updateFulfillment(
  orderId: string,
  content: Partial<FulfillmentContent>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  // Verify order belongs to this creator
  const { data: order } = await supabase
    .from('orders')
    .select('id, creator_id, creator:creators(user_id)')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { success: false, error: t('orderNotFound') };
  }

  const creator = order.creator as any;
  if (creator?.user_id !== user.id) {
    return { success: false, error: t('noPermission') };
  }

  // Get existing fulfillment
  const { data: fulfillment } = await supabase
    .from('fulfillments')
    .select('id, content')
    .eq('order_id', orderId)
    .single();

  if (!fulfillment) {
    return { success: false, error: t('fulfillmentNotFound') };
  }

  // Merge content
  const updatedContent = {
    ...(fulfillment.content as object),
    ...content,
  };

  const { error } = await supabase
    .from('fulfillments')
    .update({ content: updatedContent })
    .eq('id', fulfillment.id);

  if (error) {
    console.error('Update fulfillment error:', error);
    return { success: false, error: t('cannotUpdate') };
  }

  revalidatePath(`/checkout/${orderId}/success`);
  revalidatePath('/dashboard/orders');
  return { success: true };
}

// ============================================
// RECORD DOWNLOAD (increment count + mark accessed)
// ============================================
export async function recordDownload(token: string): Promise<{ success: boolean; error?: string; url?: string }> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  const { data: fulfillment, error: fetchError } = await supabase
    .from('fulfillments')
    .select('*')
    .eq('access_token', token)
    .eq('type', 'download')
    .single();

  if (fetchError || !fulfillment) {
    return { success: false, error: t('downloadLinkNotFound') };
  }

  // Check access expiry
  if (fulfillment.access_until && new Date(fulfillment.access_until) < new Date()) {
    return { success: false, error: t('downloadLinkExpired') };
  }

  const content = fulfillment.content as DigitalFulfillmentContent;

  // For redirect type, just return the redirect URL
  if (content.delivery_type === 'redirect') {
    // Mark as accessed
    await supabase
      .from('fulfillments')
      .update({
        is_accessed: true,
        accessed_at: fulfillment.accessed_at || new Date().toISOString(),
      })
      .eq('id', fulfillment.id);

    return { success: true, url: content.redirect_url };
  }

  // For file type, check max downloads
  if (content.max_downloads && (content.download_count || 0) >= content.max_downloads) {
    return { success: false, error: t('downloadLimitReached') };
  }

  // Update download count
  const { error: updateError } = await supabase
    .from('fulfillments')
    .update({
      content: {
        ...content,
        download_count: (content.download_count || 0) + 1,
      },
      is_accessed: true,
      accessed_at: fulfillment.accessed_at || new Date().toISOString(),
    })
    .eq('id', fulfillment.id);

  if (updateError) {
    console.error('Update download count error:', updateError);
  }

  return { success: true, url: content.file_url };
}

// ============================================
// GET REDIRECT URL (for redirect delivery type)
// ============================================
export async function getRedirectUrl(token: string): Promise<{ success: boolean; error?: string; url?: string; name?: string }> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  const { data: fulfillment, error: fetchError } = await supabase
    .from('fulfillments')
    .select('*')
    .eq('access_token', token)
    .eq('type', 'download')
    .single();

  if (fetchError || !fulfillment) {
    return { success: false, error: t('linkNotFound') };
  }

  // Check access expiry
  if (fulfillment.access_until && new Date(fulfillment.access_until) < new Date()) {
    return { success: false, error: t('linkExpired') };
  }

  const content = fulfillment.content as DigitalFulfillmentContent;

  if (content.delivery_type !== 'redirect') {
    return { success: false, error: t('notRedirectLink') };
  }

  // Mark as accessed
  await supabase
    .from('fulfillments')
    .update({
      is_accessed: true,
      accessed_at: fulfillment.accessed_at || new Date().toISOString(),
    })
    .eq('id', fulfillment.id);

  return { 
    success: true, 
    url: content.redirect_url,
    name: content.redirect_name || undefined
  };
}
