'use server';

import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/plan';
import type { PlanType } from '@/types';
import { getTranslations } from 'next-intl/server';

// ============================================
// Types
// ============================================
export interface CustomerOrder {
  id: string;
  product_title: string;
  total: number;
  status: string;
  created_at: string;
}

export interface Customer {
  email: string;
  name: string;
  phone: string | null;
  promptpay: string | null;
  total_orders: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
  products_bought: string[];
  orders: CustomerOrder[];
}

export interface CustomerDetails {
  email: string;
  name: string;
  phone: string | null;
  orders: {
    id: string;
    status: string;
    total: number;
    created_at: string;
    product_title: string;
    product_type: string;
  }[];
  stats: {
    total_orders: number;
    total_spent: number;
    first_order_at: string;
    last_order_at: string;
  };
}

// ============================================
// GET CUSTOMERS LIST
// ============================================
export async function getCustomers() {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin'), errorCode: 'AUTH_REQUIRED', customers: [] };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: t('creatorNotFound'), customers: [] };
  }

  // Get all orders with buyer info and product info
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_email,
      buyer_name,
      buyer_phone,
      refund_promptpay,
      created_at,
      product:products(title)
    `)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get customers error:', error);
    return { success: false, error: t('cannotLoadCustomers'), customers: [] };
  }

  // Aggregate by email
  const customerMap = new Map<string, Customer>();

  orders?.forEach(order => {
    const email = order.buyer_email.toLowerCase();
    const existing = customerMap.get(email);
    const product = order.product as { title?: string } | { title?: string }[] | null;
    const productTitle = Array.isArray(product) 
      ? product[0]?.title 
      : product?.title;
    const isConfirmed = order.status === 'confirmed';

    const orderInfo: CustomerOrder = {
      id: order.id,
      product_title: productTitle || '-',
      total: Number(order.total),
      status: order.status,
      created_at: order.created_at,
    };

    if (existing) {
      existing.total_orders += 1;
      existing.orders.push(orderInfo);
      if (isConfirmed) {
        existing.total_spent += Number(order.total);
      }
      if (new Date(order.created_at) < new Date(existing.first_order_at)) {
        existing.first_order_at = order.created_at;
      }
      if (new Date(order.created_at) > new Date(existing.last_order_at)) {
        existing.last_order_at = order.created_at;
        existing.name = order.buyer_name; // Use latest name
        existing.phone = order.buyer_phone;
      }
      // Keep the latest non-null promptpay
      if (order.refund_promptpay && !existing.promptpay) {
        existing.promptpay = order.refund_promptpay;
      }
      if (productTitle && !existing.products_bought.includes(productTitle)) {
        existing.products_bought.push(productTitle);
      }
    } else {
      customerMap.set(email, {
        email,
        name: order.buyer_name,
        phone: order.buyer_phone,
        promptpay: order.refund_promptpay || null,
        total_orders: 1,
        total_spent: isConfirmed ? Number(order.total) : 0,
        first_order_at: order.created_at,
        last_order_at: order.created_at,
        products_bought: productTitle ? [productTitle] : [],
        orders: [orderInfo],
      });
    }
  });

  // Sort by total spent
  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.total_spent - a.total_spent);

  return { success: true, customers };
}

// ============================================
// GET CUSTOMER DETAILS
// ============================================
export async function getCustomerDetails(email: string): Promise<CustomerDetails | null> {
  const supabase = await createClient();
  const t = await getTranslations('ServerActions');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return null;
  }

  // Get all orders for this customer
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_email,
      buyer_name,
      buyer_phone,
      created_at,
      product:products(title, type)
    `)
    .eq('creator_id', creator.id)
    .ilike('buyer_email', email)
    .order('created_at', { ascending: false });

  if (error || !orders || orders.length === 0) {
    return null;
  }

  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  
  return {
    email: orders[0].buyer_email,
    name: orders[0].buyer_name,
    phone: orders[0].buyer_phone,
    orders: orders.map(order => {
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      return {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        created_at: order.created_at,
        product_title: product?.title || t('productDefault'),
        product_type: product?.type || 'unknown',
      };
    }),
    stats: {
      total_orders: orders.length,
      total_spent: confirmedOrders.reduce((sum, o) => sum + Number(o.total), 0),
      first_order_at: orders[orders.length - 1].created_at,
      last_order_at: orders[0].created_at,
    },
  };
}

// ============================================
// EXPORT CUSTOMERS (CSV format)
// ============================================
export async function exportCustomers() {
  const t = await getTranslations('ServerActions');

  // Check plan permission server-side
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin'), errorCode: 'AUTH_REQUIRED' };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  const plan = (creator?.plan || 'free') as PlanType;
  if (!hasFeature(plan, 'export_csv')) {
    return { success: false, error: t('exportProOnly') };
  }

  const result = await getCustomers();
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const headers = [t('csvEmail'), t('csvName'), t('csvPhone'), t('csvOrderCount'), t('csvTotalSpent'), t('csvProducts')];
  const rows = result.customers.map(c => [
    c.email,
    c.name,
    c.phone || '-',
    c.total_orders.toString(),
    c.total_spent.toString(),
    c.products_bought.join(', '),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return { success: true, csv };
}
