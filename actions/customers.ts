'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================
export interface Customer {
  email: string;
  name: string;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
  products_bought: string[];
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ', customers: [] };
  }

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator', customers: [] };
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
      created_at,
      product:products(title)
    `)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get customers error:', error);
    return { success: false, error: 'ไม่สามารถโหลดข้อมูลลูกค้าได้', customers: [] };
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

    if (existing) {
      existing.total_orders += 1;
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
      if (productTitle && !existing.products_bought.includes(productTitle)) {
        existing.products_bought.push(productTitle);
      }
    } else {
      customerMap.set(email, {
        email,
        name: order.buyer_name,
        phone: order.buyer_phone,
        total_orders: 1,
        total_spent: isConfirmed ? Number(order.total) : 0,
        first_order_at: order.created_at,
        last_order_at: order.created_at,
        products_bought: productTitle ? [productTitle] : [],
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
        product_title: product?.title || 'สินค้า',
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
  const result = await getCustomers();
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const headers = ['อีเมล', 'ชื่อ', 'เบอร์โทร', 'จำนวนออเดอร์', 'ยอดซื้อรวม', 'สินค้าที่ซื้อ'];
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
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return { success: true, csv };
}
