import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAnalyticsData } from '@/actions/analytics';

export const metadata: Metadata = { title: "สถิติ" };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Percent,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { 
  RevenueChart, 
  OrdersChart, 
  StatusPieChart, 
  ProductTypePieChart,
  TopProductsTable,
  RevenueGrowthCard,
  HourlyChart,
  DayOfWeekChart,
  CustomerInsightsCard,
} from './analytics-charts';
import Link from 'next/link';
import { Crown, Lock } from 'lucide-react';
import { DateFilter } from './date-filter';

interface PageProps {
  searchParams: Promise<{ days?: string; start?: string; end?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const daysParam = params.days || '30';
  const customStart = params.start;
  const customEnd = params.end;

  // Determine filter type
  let days: number | 'all' = 30;
  if (daysParam === 'all') {
    days = 'all';
  } else if (daysParam === 'custom' && customStart && customEnd) {
    days = 30; // Will use custom dates instead
  } else {
    days = parseInt(daysParam) || 30;
  }

  const data = daysParam === 'custom' && customStart && customEnd
    ? await getAnalyticsData(days, customStart, customEnd)
    : await getAnalyticsData(days);
  
  if (!data) {
    redirect('/login');
  }

  // Generate filter description
  const getFilterDescription = () => {
    if (daysParam === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      return `${start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (daysParam === 'all') return 'ข้อมูลทั้งหมด';
    return `ข้อมูลย้อนหลัง ${days} วัน`;
  };

  const summaryCards = [
    {
      title: 'รายได้รวม',
      value: formatPrice(data.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'คำสั่งซื้อทั้งหมด',
      value: data.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'มูลค่าเฉลี่ย/ออเดอร์',
      value: formatPrice(data.averageOrderValue),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'อัตราความสำเร็จ',
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const periodCards = [
    {
      title: 'วันนี้',
      orders: data.ordersToday,
      revenue: data.revenueToday,
      icon: Calendar,
    },
    {
      title: 'สัปดาห์นี้',
      orders: data.ordersThisWeek,
      revenue: data.revenueThisWeek,
      icon: CalendarDays,
    },
    {
      title: 'เดือนนี้',
      orders: data.ordersThisMonth,
      revenue: data.revenueThisMonth,
      icon: CalendarRange,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">สถิติและรายงาน</h2>
        <p className="text-muted-foreground">{getFilterDescription()}</p>
      </div>

      {/* Date Filter */}
      <DateFilter 
        currentFilter={daysParam} 
        customStart={customStart}
        customEnd={customEnd}
      />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        {periodCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">คำสั่งซื้อ</p>
                  <p className="text-2xl font-bold">{card.orders}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">รายได้</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(card.revenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={data.dailyStats} />
        <OrdersChart data={data.dailyStats} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusPieChart data={data.statusBreakdown} />
        <ProductTypePieChart data={data.productTypeBreakdown} />
        <TopProductsTable products={data.topProducts} />
      </div>

      {/* Advanced Analytics Section */}
      {data.plan === 'pro' ? (
        <>
          {/* Pro Header */}
          <div className="flex items-center gap-2 pt-4">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-bold">สถิติขั้นสูง</h3>
            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-medium">
              PRO
            </span>
          </div>

          {/* Growth + Customer Insights */}
          {(data.revenueGrowth || data.customerInsights) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {data.revenueGrowth && <RevenueGrowthCard data={data.revenueGrowth} />}
              {data.customerInsights && <CustomerInsightsCard data={data.customerInsights} />}
            </div>
          )}

          {/* Hourly + Day of Week */}
          {(data.hourlyStats || data.dayOfWeekStats) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {data.hourlyStats && <HourlyChart data={data.hourlyStats} />}
              {data.dayOfWeekStats && <DayOfWeekChart data={data.dayOfWeekStats} />}
            </div>
          )}
        </>
      ) : (
        /* Free Plan - Show upgrade CTA */
        <div className="relative rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 text-center">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl" />
          <div className="relative space-y-4">
            <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">สถิติขั้นสูง</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                อัปเกรดเป็น Pro เพื่อดูข้อมูลเชิงลึก: การเติบโต, ช่วงเวลาขายดี, วันที่ขายดี, อัตราซื้อซ้ำ
              </p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Crown className="h-4 w-4" />
              อัปเกรดเป็น Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
