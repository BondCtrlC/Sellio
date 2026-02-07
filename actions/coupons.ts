'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

// ============================================
// Types
// ============================================
export interface Coupon {
  id: string;
  creator_id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  product_ids: string[] | null;
  product_types: string[] | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Validation Schema
// ============================================
const couponSchema = z.object({
  code: z.string().min(3, 'รหัสต้องมีอย่างน้อย 3 ตัวอักษร').max(50),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('ส่วนลดต้องมากกว่า 0'),
  min_purchase: z.number().min(0).optional().nullable(),
  max_discount: z.number().positive().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  per_user_limit: z.number().int().positive().optional().nullable(),
  product_ids: z.array(z.string()).optional().nullable(),
  product_types: z.array(z.string()).optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;

// ============================================
// GET COUPONS
// ============================================
export async function getCoupons() {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin'), coupons: [] };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound'), coupons: [] };
  }

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get coupons error:', error);
    return { success: false, error: t('cannotLoadCoupons'), coupons: [] };
  }

  return { success: true, coupons: coupons as Coupon[] };
}

// ============================================
// CREATE COUPON
// ============================================
export async function createCoupon(input: CouponInput) {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  // Validate input
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || t('invalidData') };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound') };
  }

  // Check for duplicate code
  const { data: existing } = await supabase
    .from('coupons')
    .select('id')
    .eq('creator_id', creator.id)
    .ilike('code', parsed.data.code)
    .single();

  if (existing) {
    return { success: false, error: t('couponCodeExists') };
  }

  // Validate percentage discount
  if (parsed.data.discount_type === 'percentage' && parsed.data.discount_value > 100) {
    return { success: false, error: t('percentMax100') };
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      creator_id: creator.id,
      code: parsed.data.code,
      name: parsed.data.name || null,
      description: parsed.data.description || null,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      min_purchase: parsed.data.min_purchase || 0,
      max_discount: parsed.data.max_discount || null,
      usage_limit: parsed.data.usage_limit || null,
      per_user_limit: parsed.data.per_user_limit || 1,
      product_ids: parsed.data.product_ids || null,
      product_types: parsed.data.product_types || null,
      starts_at: parsed.data.starts_at || null,
      expires_at: parsed.data.expires_at || null,
      is_active: parsed.data.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Create coupon error:', error);
    return { success: false, error: t('cannotCreateCoupon') };
  }

  revalidatePath('/dashboard/coupons');
  return { success: true, coupon };
}

// ============================================
// UPDATE COUPON
// ============================================
export async function updateCoupon(couponId: string, input: Partial<CouponInput>) {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound') };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('coupons')
    .select('id')
    .eq('id', couponId)
    .eq('creator_id', creator.id)
    .single();

  if (!existing) {
    return { success: false, error: t('couponNotFound') };
  }

  // Check for duplicate code if code is being updated
  if (input.code) {
    const { data: duplicate } = await supabase
      .from('coupons')
      .select('id')
      .eq('creator_id', creator.id)
      .ilike('code', input.code)
      .neq('id', couponId)
      .single();

    if (duplicate) {
      return { success: false, error: t('couponCodeExists') };
    }
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  if (input.code !== undefined) updateData.code = input.code.toUpperCase();
  if (input.name !== undefined) updateData.name = input.name || null;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.discount_type !== undefined) updateData.discount_type = input.discount_type;
  if (input.discount_value !== undefined) updateData.discount_value = input.discount_value;
  if (input.min_purchase !== undefined) updateData.min_purchase = input.min_purchase;
  if (input.max_discount !== undefined) updateData.max_discount = input.max_discount;
  if (input.usage_limit !== undefined) updateData.usage_limit = input.usage_limit;
  if (input.per_user_limit !== undefined) updateData.per_user_limit = input.per_user_limit;
  if (input.product_ids !== undefined) updateData.product_ids = input.product_ids;
  if (input.product_types !== undefined) updateData.product_types = input.product_types;
  if (input.starts_at !== undefined) updateData.starts_at = input.starts_at;
  if (input.expires_at !== undefined) updateData.expires_at = input.expires_at;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { error } = await supabase
    .from('coupons')
    .update(updateData)
    .eq('id', couponId);

  if (error) {
    console.error('Update coupon error:', error);
    return { success: false, error: t('cannotUpdateCoupon') };
  }

  revalidatePath('/dashboard/coupons');
  return { success: true };
}

// ============================================
// DELETE COUPON
// ============================================
export async function deleteCoupon(couponId: string) {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound') };
  }

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId)
    .eq('creator_id', creator.id);

  if (error) {
    console.error('Delete coupon error:', error);
    return { success: false, error: t('cannotDeleteCoupon') };
  }

  revalidatePath('/dashboard/coupons');
  return { success: true };
}

// ============================================
// TOGGLE COUPON ACTIVE STATUS
// ============================================
export async function toggleCouponActive(couponId: string) {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound') };
  }

  // Get current status
  const { data: coupon } = await supabase
    .from('coupons')
    .select('is_active')
    .eq('id', couponId)
    .eq('creator_id', creator.id)
    .single();

  if (!coupon) {
    return { success: false, error: t('couponNotFound') };
  }

  const { error } = await supabase
    .from('coupons')
    .update({ 
      is_active: !coupon.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', couponId);

  if (error) {
    console.error('Toggle coupon error:', error);
    return { success: false, error: t('cannotToggleStatus') };
  }

  revalidatePath('/dashboard/coupons');
  return { success: true, is_active: !coupon.is_active };
}

// ============================================
// VALIDATE COUPON (for checkout)
// ============================================
export async function validateCoupon(
  code: string, 
  creatorId: string, 
  productId: string,
  productType: string,
  totalAmount: number,
  buyerEmail: string
) {
  const t = await getTranslations('ServerActions');
  const supabase = await createClient();

  // Find coupon
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('creator_id', creatorId)
    .ilike('code', code)
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { success: false, error: t('couponNotFound') };
  }

  // Check validity period
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { success: false, error: t('couponNotStarted') };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { success: false, error: t('couponExpired') };
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { success: false, error: t('couponUsedUp') };
  }

  // Check per user limit
  const { count: userUsage } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('buyer_email', buyerEmail.toLowerCase());

  if (userUsage && coupon.per_user_limit && userUsage >= coupon.per_user_limit) {
    return { success: false, error: t('couponPersonalLimit') };
  }

  // Check min purchase
  if (coupon.min_purchase && totalAmount < coupon.min_purchase) {
    return { 
      success: false, 
      error: t('couponMinPurchase', { amount: coupon.min_purchase.toLocaleString() }) 
    };
  }

  // Check product restrictions
  if (coupon.product_ids && coupon.product_ids.length > 0) {
    if (!coupon.product_ids.includes(productId)) {
      return { success: false, error: t('couponNotForProduct') };
    }
  }

  if (coupon.product_types && coupon.product_types.length > 0) {
    if (!coupon.product_types.includes(productType)) {
      return { success: false, error: t('couponNotForType') };
    }
  }

  // Calculate discount
  let discountAmount: number;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (totalAmount * coupon.discount_value) / 100;
    // Apply max discount if set
    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  // Discount cannot exceed total
  if (discountAmount > totalAmount) {
    discountAmount = totalAmount;
  }

  return { 
    success: true, 
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    },
    discount_amount: discountAmount,
    final_amount: totalAmount - discountAmount,
  };
}
