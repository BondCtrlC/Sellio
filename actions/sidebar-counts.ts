'use server';

import { createClient } from '@/lib/supabase/server';

export interface SidebarCounts {
  orders: number;      // pending_confirmation orders
  reviews: number;     // unpublished reviews
  calendar: number;    // new confirmed bookings (last 24 hours)
}

export async function getSidebarCounts(): Promise<SidebarCounts> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { orders: 0, reviews: 0, calendar: 0 };
  }

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { orders: 0, reviews: 0, calendar: 0 };
  }

  const now = new Date();

  // Get pending confirmation orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'pending_confirmation');

  // Get unpublished reviews count
  const { count: reviewsCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('is_published', false);

  // Get new confirmed bookings (last 24 hours) - booking orders that were confirmed recently
  const { count: calendarCount } = await supabase
    .from('orders')
    .select('id, product:products!inner(type)', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')
    .in('product.type', ['booking', 'live'])
    .not('booking_date', 'is', null)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

  return {
    orders: ordersCount || 0,
    reviews: reviewsCount || 0,
    calendar: calendarCount || 0,
  };
}
