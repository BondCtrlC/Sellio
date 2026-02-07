'use server';

import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

// ============================================
// Types
// ============================================
export interface Notification {
  id: string;
  type: 'new_order' | 'payment_pending' | 'payment_confirmed' | 'coupon_expiring' | 'low_stock' | 'new_booking' | 'booking_cancelled' | 'booking_rescheduled' | 'new_review';
  title: string;
  message: string;
  link?: string;
  created_at: string;
  is_read: boolean;
}

// ============================================
// GET NOTIFICATIONS
// ============================================
export async function getNotifications(): Promise<{ success: boolean; notifications: Notification[] }> {
  const supabase = await createClient();
  const t = await getTranslations('Notifications');
  const tSA = await getTranslations('ServerActions');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, notifications: [] };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, notifications: [] };
  }

  const notifications: Notification[] = [];
  const now = new Date();

  // 1. Get pending confirmation orders (last 24 hours)
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, buyer_name, created_at, total')
    .eq('creator_id', creator.id)
    .eq('status', 'pending_confirmation')
    .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  pendingOrders?.forEach(order => {
    notifications.push({
      id: `pending_${order.id}`,
      type: 'payment_pending',
      title: t('paymentPendingTitle'),
      message: t('paymentPendingMessage', { name: order.buyer_name, amount: Number(order.total).toLocaleString() }),
      link: '/dashboard/orders',
      created_at: order.created_at,
      is_read: false,
    });
  });

  // 2. Get new orders (pending payment, last 12 hours)
  const { data: newOrders } = await supabase
    .from('orders')
    .select('id, buyer_name, created_at, total')
    .eq('creator_id', creator.id)
    .eq('status', 'pending_payment')
    .gte('created_at', new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  newOrders?.forEach(order => {
    notifications.push({
      id: `new_${order.id}`,
      type: 'new_order',
      title: t('newOrderTitle'),
      message: t('newOrderMessage', { name: order.buyer_name, amount: Number(order.total).toLocaleString() }),
      link: '/dashboard/orders',
      created_at: order.created_at,
      is_read: false,
    });
  });

  // 3. Get new confirmed bookings (last 24 hours)
  const { data: newBookings } = await supabase
    .from('orders')
    .select('id, buyer_name, booking_date, booking_time, updated_at, product:products!inner(title, type)')
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')
    .in('product.type', ['booking', 'live'])
    .not('booking_date', 'is', null)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order('updated_at', { ascending: false })
    .limit(5);

  newBookings?.forEach(booking => {
    const product = Array.isArray(booking.product) ? booking.product[0] : booking.product;
    const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
    const bookingTime = booking.booking_time ? booking.booking_time.slice(0, 5) : '';
    
    notifications.push({
      id: `booking_${booking.id}`,
      type: 'new_booking',
      title: t('newBookingTitle'),
      message: t('newBookingMessage', { name: booking.buyer_name, product: product?.title || tSA('productDefault'), date: bookingDate, time: bookingTime }),
      link: '/dashboard/calendar',
      created_at: booking.updated_at,
      is_read: false,
    });
  });

  // 4. Get cancelled bookings (last 24 hours)
  const { data: cancelledBookings } = await supabase
    .from('orders')
    .select('id, buyer_name, booking_date, booking_time, updated_at, product:products!inner(title, type)')
    .eq('creator_id', creator.id)
    .eq('status', 'cancelled')
    .in('product.type', ['booking', 'live'])
    .not('booking_date', 'is', null)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order('updated_at', { ascending: false })
    .limit(5);

  cancelledBookings?.forEach(booking => {
    const product = Array.isArray(booking.product) ? booking.product[0] : booking.product;
    const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
    const bookingTime = booking.booking_time ? booking.booking_time.slice(0, 5) : '';
    
    notifications.push({
      id: `cancelled_${booking.id}`,
      type: 'booking_cancelled',
      title: t('bookingCancelledTitle'),
      message: t('bookingCancelledMessage', { name: booking.buyer_name, product: product?.title || tSA('bookingDefault'), date: bookingDate, time: bookingTime }),
      link: '/dashboard/orders',
      created_at: booking.updated_at,
      is_read: false,
    });
  });

  // 5. Get rescheduled bookings (last 24 hours) - orders with reschedule_count > 0
  const { data: rescheduledBookings } = await supabase
    .from('orders')
    .select('id, buyer_name, booking_date, booking_time, updated_at, reschedule_count, product:products!inner(title, type)')
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')
    .in('product.type', ['booking', 'live'])
    .gt('reschedule_count', 0)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .order('updated_at', { ascending: false })
    .limit(5);

  rescheduledBookings?.forEach(booking => {
    const product = Array.isArray(booking.product) ? booking.product[0] : booking.product;
    const bookingDate = booking.booking_date ? new Date(booking.booking_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
    const bookingTime = booking.booking_time ? booking.booking_time.slice(0, 5) : '';
    
    notifications.push({
      id: `rescheduled_${booking.id}`,
      type: 'booking_rescheduled',
      title: t('bookingRescheduleTitle'),
      message: t('bookingRescheduleMessage', { name: booking.buyer_name, product: product?.title || tSA('bookingDefault'), date: bookingDate, time: bookingTime }),
      link: '/dashboard/orders',
      created_at: booking.updated_at,
      is_read: false,
    });
  });

  // 6. Get new reviews (last 48 hours)
  const { data: newReviews } = await supabase
    .from('reviews')
    .select('id, buyer_name, rating, comment, created_at, product:products(title)')
    .eq('creator_id', creator.id)
    .gte('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  newReviews?.forEach(review => {
    const product = Array.isArray(review.product) ? review.product[0] : review.product;
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    notifications.push({
      id: `review_${review.id}`,
      type: 'new_review',
      title: t('newReviewTitle'),
      message: t('newReviewMessage', { name: review.buyer_name, stars, product: product?.title || tSA('productDefault'), comment: review.comment ? ` - "${review.comment.slice(0, 30)}${review.comment.length > 30 ? '...' : ''}"` : '' }),
      link: '/dashboard/reviews',
      created_at: review.created_at,
      is_read: false,
    });
  });

  // 7. Check expiring coupons (next 7 days)
  const { data: expiringCoupons } = await supabase
    .from('coupons')
    .select('id, code, expires_at')
    .eq('creator_id', creator.id)
    .eq('is_active', true)
    .lte('expires_at', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .gte('expires_at', now.toISOString());

  expiringCoupons?.forEach(coupon => {
    const daysLeft = Math.ceil(
      (new Date(coupon.expires_at!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    notifications.push({
      id: `coupon_${coupon.id}`,
      type: 'coupon_expiring',
      title: t('couponExpiryTitle'),
      message: t('couponExpiryMessage', { code: coupon.code, days: daysLeft }),
      link: '/dashboard/coupons',
      created_at: coupon.expires_at!,
      is_read: false,
    });
  });

  // Sort by created_at descending
  notifications.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { success: true, notifications: notifications.slice(0, 20) };
}

// ============================================
// GET NOTIFICATION COUNT (for badge)
// ============================================
export async function getNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) return 0;

  const now = new Date();

  // Count pending confirmation orders (need to verify slip)
  const { count: pendingConfirmCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'pending_confirmation');

  // Count new orders (pending payment, last 12 hours)
  const { count: newOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'pending_payment')
    .gte('created_at', new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString());

  // Count new confirmed bookings (last 24 hours)
  const { count: newBookingCount } = await supabase
    .from('orders')
    .select('id, product:products!inner(type)', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')
    .in('product.type', ['booking', 'live'])
    .not('booking_date', 'is', null)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

  // Count cancelled bookings (last 24 hours)
  const { count: cancelledCount } = await supabase
    .from('orders')
    .select('id, product:products!inner(type)', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'cancelled')
    .in('product.type', ['booking', 'live'])
    .not('booking_date', 'is', null)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

  // Count rescheduled bookings (last 24 hours)
  const { count: rescheduledCount } = await supabase
    .from('orders')
    .select('id, product:products!inner(type)', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')
    .in('product.type', ['booking', 'live'])
    .gt('reschedule_count', 0)
    .gte('updated_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

  // Count new reviews (last 48 hours)
  const { count: newReviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .gte('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString());

  return (pendingConfirmCount || 0) + (newOrderCount || 0) + (newBookingCount || 0) + (cancelledCount || 0) + (rescheduledCount || 0) + (newReviewCount || 0);
}
