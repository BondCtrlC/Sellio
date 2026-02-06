import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, DollarSign, Clock, ExternalLink, Store, TrendingUp, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  buyer_name: string;
  created_at: string;
  product: {
    title: string;
    type: string;
  } | null;
}

async function getCreatorWithStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get creator profile
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  // Get stats
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  const { data: orders } = await supabase
    .from('orders')
    .select('status, total, created_at')
    .eq('creator_id', creator.id);

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending_confirmation').length || 0;
  const confirmedOrders = orders?.filter(o => o.status === 'confirmed') || [];
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders?.filter(o => new Date(o.created_at) >= today).length || 0;
  const revenueToday = orders
    ?.filter(o => o.status === 'confirmed' && new Date(o.created_at) >= today)
    .reduce((sum, o) => sum + Number(o.total), 0) || 0;

  // Calculate this week's stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const ordersThisWeek = orders?.filter(o => new Date(o.created_at) >= weekStart).length || 0;
  const revenueThisWeek = orders
    ?.filter(o => o.status === 'confirmed' && new Date(o.created_at) >= weekStart)
    .reduce((sum, o) => sum + Number(o.total), 0) || 0;

  // Get recent orders with product info
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_name,
      created_at,
      product:products(title, type)
    `)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    creator,
    stats: {
      totalProducts: totalProducts || 0,
      totalOrders,
      pendingOrders,
      totalRevenue,
      ordersToday,
      revenueToday,
      ordersThisWeek,
      revenueThisWeek,
      confirmedCount: confirmedOrders.length,
    },
    recentOrders: (recentOrders || []).map(order => ({
      ...order,
      product: Array.isArray(order.product) ? order.product[0] : order.product,
    })) as RecentOrder[],
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  pending_payment: { label: 'รอชำระเงิน', variant: 'outline' },
  pending_confirmation: { label: 'รอยืนยัน', variant: 'warning' },
  confirmed: { label: 'สำเร็จ', variant: 'success' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
  refunded: { label: 'คืนเงินแล้ว', variant: 'secondary' },
};

const productTypeLabels: Record<string, string> = {
  digital: 'Digital',
  booking: 'Booking',
  live: 'Live',
  link: 'Link',
};

export default async function DashboardPage() {
  const { creator, stats, recentOrders } = await getCreatorWithStats();

  const statCards = [
    {
      title: 'สินค้าทั้งหมด',
      value: stats.totalProducts,
      icon: Package,
      href: '/dashboard/products',
    },
    {
      title: 'คำสั่งซื้อทั้งหมด',
      value: stats.totalOrders,
      icon: ShoppingCart,
      href: '/dashboard/orders',
    },
    {
      title: 'รอยืนยัน',
      value: stats.pendingOrders,
      icon: Clock,
      href: '/dashboard/orders?status=pending_confirmation',
      highlight: stats.pendingOrders > 0,
    },
    {
      title: 'รายได้รวม',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      href: '/dashboard/orders',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">สวัสดี, {creator.display_name}!</h2>
          <p className="text-muted-foreground">
            {creator.is_published 
              ? 'ร้านค้าของคุณเปิดให้บริการอยู่' 
              : 'ร้านค้าของคุณยังไม่เปิดให้บริการ'}
          </p>
        </div>
        
        {/* View Store Button */}
        {creator.username && (
          <a
            href={`/u/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Store className="h-4 w-4" />
            <span>ดูหน้าร้าน</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow ${stat.highlight ? 'border-warning' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.highlight ? 'bg-warning/10' : 'bg-muted'}`}>
                  <stat.icon className={`h-4 w-4 ${stat.highlight ? 'text-warning' : 'text-muted-foreground'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.highlight ? 'text-warning' : ''}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today & This Week Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">วันนี้</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">คำสั่งซื้อ</p>
                <p className="text-2xl font-bold">{stats.ordersToday}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">รายได้</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats.revenueToday)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">สัปดาห์นี้</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">คำสั่งซื้อ</p>
                <p className="text-2xl font-bold">{stats.ordersThisWeek}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">รายได้</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats.revenueThisWeek)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>คำสั่งซื้อล่าสุด</CardTitle>
          <Link 
            href="/dashboard/orders" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            ดูทั้งหมด
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>ยังไม่มีคำสั่งซื้อ</p>
              <p className="text-sm mt-1">เมื่อมีลูกค้าสั่งซื้อ จะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status] || { label: order.status, variant: 'outline' as const };
                return (
                  <Link
                    key={order.id}
                    href="/dashboard/orders"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{order.buyer_name}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.product?.title || 'สินค้า'} 
                        {order.product?.type && (
                          <span className="text-xs ml-1">
                            ({productTypeLabels[order.product.type] || order.product.type})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - show only if there are setup tasks */}
      {((!creator.promptpay_id && !creator.bank_name) || stats.totalProducts === 0 || !creator.is_published) && (
        <Card>
          <CardHeader>
            <CardTitle>เริ่มต้นใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {!creator.promptpay_id && !creator.bank_name && (
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">ตั้งค่าการรับชำระเงิน</p>
                    <p className="text-sm text-muted-foreground">PromptPay หรือ บัญชีธนาคาร</p>
                  </div>
                </Link>
              )}
              
              {stats.totalProducts === 0 && (
                <Link
                  href="/dashboard/products/new"
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">เพิ่มสินค้าแรก</p>
                    <p className="text-sm text-muted-foreground">สร้างสินค้าใหม่</p>
                  </div>
                </Link>
              )}

              {!creator.is_published && (
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="p-3 rounded-xl bg-secondary/10">
                    <Package className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">เปิดร้านค้า</p>
                    <p className="text-sm text-muted-foreground">Publish หน้าร้าน</p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
