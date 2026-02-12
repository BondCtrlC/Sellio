import type { PlanType } from '@/types';

// ============================================
// PLAN CONFIGURATION
// ============================================

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      max_products: 2,
    },
    features: {
      store_page: true,
      promptpay: true,
      bank_transfer: true,
      coupons: true,
      calendar: true,
      export_csv: false,
      review_management: false,
      remove_branding: false,
      advanced_analytics: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 99, // THB/month
    limits: {
      max_products: 999999, // Effectively unlimited (avoids JSON.stringify(Infinity) → null)
    },
    features: {
      store_page: true,
      promptpay: true,
      bank_transfer: true,
      coupons: true,
      calendar: true,
      export_csv: true,
      review_management: true,
      remove_branding: true,
      advanced_analytics: true,
    },
  },
} as const;

export type PlanFeature = keyof typeof PLAN_CONFIG.free.features;

// ============================================
// PLAN HELPERS
// ============================================

export function getPlanConfig(plan: PlanType) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.free;
}

export function getPlanLimits(plan: PlanType) {
  return getPlanConfig(plan).limits;
}

export function getPlanFeatures(plan: PlanType) {
  return getPlanConfig(plan).features;
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeature(plan: PlanType, feature: PlanFeature): boolean {
  return getPlanFeatures(plan)[feature] ?? false;
}

/**
 * Check if creator can create more products
 */
export function canCreateProduct(plan: PlanType, currentProductCount: number): boolean {
  const limits = getPlanLimits(plan);
  return currentProductCount < limits.max_products;
}

/**
 * Get remaining product slots
 */
export function getRemainingProductSlots(plan: PlanType, currentProductCount: number): number {
  const limits = getPlanLimits(plan);
  if (limits.max_products >= 999999) return 999999;
  return Math.max(0, limits.max_products - currentProductCount);
}
