'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// Types
// ============================================
export interface Review {
  id: string;
  product_id: string;
  order_id: string;
  creator_id: string;
  buyer_name: string;
  buyer_email: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  is_featured: boolean;
  response: string | null;
  response_at: string | null;
  created_at: string;
  product?: {
    title: string;
    image_url: string | null;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============================================
// CREATE REVIEW (for buyers after purchase)
// ============================================
export async function createReview(
  orderId: string,
  rating: number,
  comment?: string
) {
  const supabase = await createClient();

  // Validate rating
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'คะแนนต้องอยู่ระหว่าง 1-5' };
  }

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, product_id, creator_id, buyer_name, buyer_email, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  // Only allow review for confirmed orders
  if (order.status !== 'confirmed') {
    return { success: false, error: 'สามารถรีวิวได้เฉพาะคำสั่งซื้อที่สำเร็จแล้วเท่านั้น' };
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (existingReview) {
    return { success: false, error: 'คุณได้รีวิวคำสั่งซื้อนี้แล้ว' };
  }

  // Create review
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      product_id: order.product_id,
      order_id: orderId,
      creator_id: order.creator_id,
      buyer_name: order.buyer_name,
      buyer_email: order.buyer_email,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create review error:', error);
    return { success: false, error: 'ไม่สามารถสร้างรีวิวได้' };
  }

  return { success: true, review };
}

// ============================================
// GET PRODUCT REVIEWS (public)
// ============================================
export async function getProductReviews(productId: string) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get reviews error:', error);
    return { success: false, reviews: [], stats: null };
  }

  // Calculate stats
  const stats: ReviewStats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    ratingBreakdown: {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    },
  };

  return { success: true, reviews: reviews as Review[], stats };
}

// ============================================
// GET CREATOR REVIEWS (for dashboard)
// ============================================
export async function getCreatorReviews() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ', reviews: [] };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator', reviews: [] };
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      product:products(title, image_url)
    `)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get creator reviews error:', error);
    return { success: false, error: 'ไม่สามารถโหลดรีวิวได้', reviews: [] };
  }

  // Process product relation
  const processedReviews = (reviews || []).map(review => ({
    ...review,
    product: Array.isArray(review.product) ? review.product[0] : review.product,
  }));

  return { success: true, reviews: processedReviews as Review[] };
}

// ============================================
// TOGGLE REVIEW PUBLISHED
// ============================================
export async function toggleReviewPublished(reviewId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  // Get current status
  const { data: review } = await supabase
    .from('reviews')
    .select('is_published, product_id')
    .eq('id', reviewId)
    .eq('creator_id', creator.id)
    .single();

  if (!review) {
    return { success: false, error: 'ไม่พบรีวิว' };
  }

  const { error } = await supabase
    .from('reviews')
    .update({ 
      is_published: !review.is_published,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId);

  if (error) {
    console.error('Toggle review error:', error);
    return { success: false, error: 'ไม่สามารถเปลี่ยนสถานะได้' };
  }

  revalidatePath('/dashboard/reviews');
  return { success: true, is_published: !review.is_published };
}

// ============================================
// TOGGLE REVIEW FEATURED
// ============================================
export async function toggleReviewFeatured(reviewId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  const { data: review } = await supabase
    .from('reviews')
    .select('is_featured')
    .eq('id', reviewId)
    .eq('creator_id', creator.id)
    .single();

  if (!review) {
    return { success: false, error: 'ไม่พบรีวิว' };
  }

  const { error } = await supabase
    .from('reviews')
    .update({ 
      is_featured: !review.is_featured,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId);

  if (error) {
    return { success: false, error: 'ไม่สามารถเปลี่ยนสถานะได้' };
  }

  revalidatePath('/dashboard/reviews');
  return { success: true, is_featured: !review.is_featured };
}

// ============================================
// ADD CREATOR RESPONSE
// ============================================
export async function addReviewResponse(reviewId: string, response: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  const { error } = await supabase
    .from('reviews')
    .update({ 
      response: response || null,
      response_at: response ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .eq('creator_id', creator.id);

  if (error) {
    console.error('Add response error:', error);
    return { success: false, error: 'ไม่สามารถบันทึกการตอบกลับได้' };
  }

  revalidatePath('/dashboard/reviews');
  return { success: true };
}

// ============================================
// CHECK IF ORDER CAN BE REVIEWED
// ============================================
export async function canReviewOrder(orderId: string) {
  const supabase = await createClient();

  // Check order status
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (!order || order.status !== 'confirmed') {
    return { canReview: false, reason: 'คำสั่งซื้อยังไม่สำเร็จ' };
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (existingReview) {
    return { canReview: false, reason: 'รีวิวแล้ว' };
  }

  return { canReview: true };
}
