'use server';

import { createClient } from '@/lib/supabase/server';
import type { PlanType } from '@/types';

// ============================================
// Types
// ============================================
export interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

export interface ProductStats {
  id: string;
  title: string;
  type: string;
  orders: number;
  revenue: number;
}

export interface HourlyStats {
  hour: number;
  orders: number;
  revenue: number;
}

export interface DayOfWeekStats {
  day: number; // 0=Sun, 6=Sat
  dayName: string;
  orders: number;
  revenue: number;
}

export interface CustomerInsights {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  averageOrdersPerCustomer: number;
}

export interface RevenueGrowth {
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  growthPercent: number;
  currentPeriodOrders: number;
  previousPeriodOrders: number;
  ordersGrowthPercent: number;
}

export interface AnalyticsData {
  // Summary stats
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  
  // Period comparison
  ordersToday: number;
  revenueToday: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  
  // Charts data
  dailyStats: DailyStats[];
  
  // Top products
  topProducts: ProductStats[];
  
  // Status breakdown
  statusBreakdown: {
    pending_payment: number;
    pending_confirmation: number;
    confirmed: number;
    cancelled: number;
    refunded: number;
  };
  
  // Product type breakdown
  productTypeBreakdown: {
    digital: number;
    booking: number;
    live: number;
    link: number;
  };

  // Advanced Analytics (Pro)
  plan: PlanType;
  hourlyStats?: HourlyStats[];
  dayOfWeekStats?: DayOfWeekStats[];
  customerInsights?: CustomerInsights;
  revenueGrowth?: RevenueGrowth;
}

// ============================================
// GET ANALYTICS DATA
// ============================================
export async function getAnalyticsData(
  days: number | 'all' = 30,
  customStart?: string,
  customEnd?: string
): Promise<AnalyticsData | null> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return null;
  }

  const plan = (creator.plan || 'free') as PlanType;

  // Build query based on date filter
  let query = supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      created_at,
      product:products(id, title, type)
    `)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: true });

  // Apply date filter
  if (customStart && customEnd) {
    // Custom date range
    query = query
      .gte('created_at', new Date(customStart).toISOString())
      .lte('created_at', new Date(customEnd + 'T23:59:59').toISOString());
  } else if (days !== 'all') {
    // Last N days
    query = query.gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
  }
  // If 'all', no date filter applied

  const { data: orders } = await query;

  if (!orders) {
    return getEmptyAnalytics();
  }

  // Calculate date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Summary stats
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const totalOrders = orders.length;
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrderValue = confirmedOrders.length > 0 
    ? totalRevenue / confirmedOrders.length 
    : 0;

  // Period stats
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today).length;
  const revenueToday = orders
    .filter(o => o.status === 'confirmed' && new Date(o.created_at) >= today)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersThisWeek = orders.filter(o => new Date(o.created_at) >= weekStart).length;
  const revenueThisWeek = orders
    .filter(o => o.status === 'confirmed' && new Date(o.created_at) >= weekStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersThisMonth = orders.filter(o => new Date(o.created_at) >= monthStart).length;
  const revenueThisMonth = orders
    .filter(o => o.status === 'confirmed' && new Date(o.created_at) >= monthStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Daily stats for chart
  const dailyStatsMap = new Map<string, { orders: number; revenue: number }>();
  
  // Determine date range for chart
  let chartStartDate: Date;
  let chartEndDate: Date = new Date(now);
  
  if (customStart && customEnd) {
    chartStartDate = new Date(customStart);
    chartEndDate = new Date(customEnd);
  } else if (days === 'all' && orders.length > 0) {
    // For all-time, start from first order
    chartStartDate = new Date(orders[0].created_at);
  } else {
    const numDays = typeof days === 'number' ? days : 30;
    chartStartDate = new Date(now);
    chartStartDate.setDate(chartStartDate.getDate() - numDays + 1);
  }
  
  // Initialize all days in range
  const currentDate = new Date(chartStartDate);
  while (currentDate <= chartEndDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dailyStatsMap.set(dateStr, { orders: 0, revenue: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill in actual data
  orders.forEach(order => {
    const dateStr = new Date(order.created_at).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(dateStr);
    if (existing) {
      existing.orders += 1;
      if (order.status === 'confirmed') {
        existing.revenue += Number(order.total);
      }
    } else {
      // For data outside initialized range (shouldn't happen normally)
      dailyStatsMap.set(dateStr, {
        orders: 1,
        revenue: order.status === 'confirmed' ? Number(order.total) : 0,
      });
    }
  });

  // Sort by date and convert to array
  const dailyStats: DailyStats[] = Array.from(dailyStatsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, stats]) => ({
      date,
      ...stats,
    }));

  // Top products
  const productStatsMap = new Map<string, ProductStats>();
  orders.forEach(order => {
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    if (!product) return;
    
    const existing = productStatsMap.get(product.id);
    if (existing) {
      existing.orders += 1;
      if (order.status === 'confirmed') {
        existing.revenue += Number(order.total);
      }
    } else {
      productStatsMap.set(product.id, {
        id: product.id,
        title: product.title,
        type: product.type,
        orders: 1,
        revenue: order.status === 'confirmed' ? Number(order.total) : 0,
      });
    }
  });

  const topProducts = Array.from(productStatsMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Status breakdown
  const statusBreakdown = {
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    pending_confirmation: orders.filter(o => o.status === 'pending_confirmation').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
  };

  // Product type breakdown
  const productTypeBreakdown = {
    digital: 0,
    booking: 0,
    live: 0,
    link: 0,
  };

  orders.forEach(order => {
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    if (product?.type && product.type in productTypeBreakdown) {
      productTypeBreakdown[product.type as keyof typeof productTypeBreakdown] += 1;
    }
  });

  // ============================================
  // ADVANCED ANALYTICS (Pro only)
  // ============================================
  let hourlyStats: HourlyStats[] | undefined;
  let dayOfWeekStats: DayOfWeekStats[] | undefined;
  let customerInsights: CustomerInsights | undefined;
  let revenueGrowth: RevenueGrowth | undefined;

  if (plan === 'pro') {
    // Hourly stats - best selling hours
    const hourlyMap = new Map<number, { orders: number; revenue: number }>();
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { orders: 0, revenue: 0 });
    }
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      const existing = hourlyMap.get(hour)!;
      existing.orders += 1;
      if (order.status === 'confirmed') {
        existing.revenue += Number(order.total);
      }
    });
    hourlyStats = Array.from(hourlyMap.entries()).map(([hour, stats]) => ({
      hour,
      ...stats,
    }));

    // Day of week stats
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    const dayMap = new Map<number, { orders: number; revenue: number }>();
    for (let d = 0; d < 7; d++) {
      dayMap.set(d, { orders: 0, revenue: 0 });
    }
    orders.forEach(order => {
      const day = new Date(order.created_at).getDay();
      const existing = dayMap.get(day)!;
      existing.orders += 1;
      if (order.status === 'confirmed') {
        existing.revenue += Number(order.total);
      }
    });
    dayOfWeekStats = Array.from(dayMap.entries()).map(([day, stats]) => ({
      day,
      dayName: dayNames[day],
      ...stats,
    }));

    // Customer insights
    const customerOrderMap = new Map<string, number>();
    orders.forEach(order => {
      if ('buyer_email' in order) {
        const email = (order as { buyer_email?: string }).buyer_email?.toLowerCase() || 'unknown';
        customerOrderMap.set(email, (customerOrderMap.get(email) || 0) + 1);
      }
    });
    
    // If buyer_email is not in the select, let's fetch it
    const { data: ordersWithEmail } = await supabase
      .from('orders')
      .select('buyer_email')
      .eq('creator_id', creator.id);
    
    const emailMap = new Map<string, number>();
    ordersWithEmail?.forEach(o => {
      const email = o.buyer_email.toLowerCase();
      emailMap.set(email, (emailMap.get(email) || 0) + 1);
    });
    
    const totalCustomers = emailMap.size;
    const repeatCustomers = Array.from(emailMap.values()).filter(count => count > 1).length;
    
    customerInsights = {
      totalCustomers,
      repeatCustomers,
      repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
      averageOrdersPerCustomer: totalCustomers > 0 ? (ordersWithEmail?.length || 0) / totalCustomers : 0,
    };

    // Revenue growth (current period vs previous period)
    const numDays = typeof days === 'number' ? days : 30;
    const currentPeriodStart = new Date(Date.now() - numDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(Date.now() - numDays * 2 * 24 * 60 * 60 * 1000);

    const { data: prevOrders } = await supabase
      .from('orders')
      .select('status, total')
      .eq('creator_id', creator.id)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    const prevConfirmed = prevOrders?.filter(o => o.status === 'confirmed') || [];
    const previousPeriodRevenue = prevConfirmed.reduce((sum, o) => sum + Number(o.total), 0);
    const currentPeriodRevenue = totalRevenue;
    const previousPeriodOrders = prevOrders?.length || 0;
    const currentPeriodOrders = totalOrders;

    revenueGrowth = {
      currentPeriodRevenue,
      previousPeriodRevenue,
      growthPercent: previousPeriodRevenue > 0 
        ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : currentPeriodRevenue > 0 ? 100 : 0,
      currentPeriodOrders,
      previousPeriodOrders,
      ordersGrowthPercent: previousPeriodOrders > 0
        ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100
        : currentPeriodOrders > 0 ? 100 : 0,
    };
  }

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    conversionRate: totalOrders > 0 ? (confirmedOrders.length / totalOrders) * 100 : 0,
    ordersToday,
    revenueToday,
    ordersThisWeek,
    revenueThisWeek,
    ordersThisMonth,
    revenueThisMonth,
    dailyStats,
    topProducts,
    statusBreakdown,
    productTypeBreakdown,
    plan,
    hourlyStats,
    dayOfWeekStats,
    customerInsights,
    revenueGrowth,
  };
}

function getEmptyAnalytics(): AnalyticsData {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    ordersToday: 0,
    revenueToday: 0,
    ordersThisWeek: 0,
    revenueThisWeek: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    dailyStats: [],
    topProducts: [],
    statusBreakdown: {
      pending_payment: 0,
      pending_confirmation: 0,
      confirmed: 0,
      cancelled: 0,
      refunded: 0,
    },
    productTypeBreakdown: {
      digital: 0,
      booking: 0,
      live: 0,
      link: 0,
    },
    plan: 'free',
  };
}
