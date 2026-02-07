'use server';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

// ============================================
// Types
// ============================================
export interface CalendarBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  product: {
    id: string;
    title: string;
    type: string;
    type_config: Record<string, unknown> | null;
  };
  fulfillment?: {
    content: Record<string, unknown>;
  } | null;
}

// ============================================
// GET CALENDAR BOOKINGS
// ============================================
export async function getCalendarBookings(
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; bookings: CalendarBooking[]; error?: string; errorCode?: string }> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, bookings: [], error: t('pleaseLogin'), errorCode: 'AUTH_REQUIRED' };
  }

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, bookings: [], error: t('creatorNotFound') };
  }

  // Build query for orders with booking info
  let query = supabase
    .from('orders')
    .select(`
      id,
      booking_date,
      booking_time,
      status,
      buyer_name,
      buyer_email,
      buyer_phone,
      product:products(id, title, type, type_config),
      fulfillment:fulfillments(content)
    `)
    .eq('creator_id', creator.id)
    .not('booking_date', 'is', null)
    .in('status', ['confirmed', 'pending_confirmation'])
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('booking_date', startDate);
  }
  if (endDate) {
    query = query.lte('booking_date', endDate);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Get calendar bookings error:', error);
    return { success: false, bookings: [], error: t('cannotFetchData') };
  }

  // Transform data
  const bookings: CalendarBooking[] = (orders || []).map((order) => {
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    const fulfillment = Array.isArray(order.fulfillment) ? order.fulfillment[0] : order.fulfillment;
    
    return {
      id: order.id,
      booking_date: order.booking_date,
      booking_time: order.booking_time,
      status: order.status,
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      buyer_phone: order.buyer_phone,
      product: product || { id: '', title: t('productDefault'), type: 'booking', type_config: null },
      fulfillment: fulfillment || null,
    };
  });

  return { success: true, bookings };
}

// ============================================
// GET BOOKINGS BY DATE
// ============================================
export async function getBookingsByDate(
  date: string
): Promise<{ success: boolean; bookings: CalendarBooking[]; error?: string; errorCode?: string }> {
  return getCalendarBookings(date, date);
}
