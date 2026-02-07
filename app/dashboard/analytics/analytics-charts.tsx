'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Repeat, Clock } from 'lucide-react';
import type { DailyStats, ProductStats, HourlyStats, DayOfWeekStats, CustomerInsights, RevenueGrowth } from '@/actions/analytics';

// ============================================
// Revenue Chart
// ============================================
interface RevenueChartProps {
  data: DailyStats[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const formatTooltipValue = (value: number) => {
    return formatPrice(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายได้รายวัน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                tickFormatter={(value) => `฿${value.toLocaleString()}`}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                formatter={(value) => [formatTooltipValue(Number(value) || 0), 'รายได้']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Orders Chart
// ============================================
interface OrdersChartProps {
  data: DailyStats[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>คำสั่งซื้อรายวัน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [Number(value) || 0, 'คำสั่งซื้อ']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="orders" 
                fill="#6366f1" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Status Pie Chart
// ============================================
interface StatusPieChartProps {
  data: {
    pending_payment: number;
    pending_confirmation: number;
    confirmed: number;
    cancelled: number;
    refunded: number;
  };
}

const STATUS_COLORS = {
  pending_payment: '#f59e0b',
  pending_confirmation: '#eab308',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

const STATUS_LABELS = {
  pending_payment: 'รอชำระเงิน',
  pending_confirmation: 'รอยืนยัน',
  confirmed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
  refunded: 'คืนเงิน',
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
      value,
      color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>สถานะคำสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            ยังไม่มีข้อมูล
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สถานะคำสั่งซื้อ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [Number(value) || 0, 'รายการ']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Product Type Pie Chart
// ============================================
interface ProductTypePieChartProps {
  data: {
    digital: number;
    booking: number;
    live: number;
    link: number;
  };
}

const TYPE_COLORS = {
  digital: '#6366f1',
  booking: '#10b981',
  live: '#f59e0b',
  link: '#8b5cf6',
};

const TYPE_LABELS = {
  digital: 'Digital',
  booking: 'Booking',
  live: 'Live',
  link: 'Link',
};

export function ProductTypePieChart({ data }: ProductTypePieChartProps) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: TYPE_LABELS[key as keyof typeof TYPE_LABELS],
      value,
      color: TYPE_COLORS[key as keyof typeof TYPE_COLORS],
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ประเภทสินค้าที่ขายได้</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            ยังไม่มีข้อมูล
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ประเภทสินค้าที่ขายได้</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [Number(value) || 0, 'รายการ']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Top Products Table
// ============================================
interface TopProductsTableProps {
  products: ProductStats[];
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  digital: 'Digital',
  booking: 'Booking',
  live: 'Live',
  link: 'Link',
};

export function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>สินค้าขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            ยังไม่มีข้อมูลการขาย
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สินค้าขายดี Top 5</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {PRODUCT_TYPE_LABELS[product.type] || product.type} • {product.orders} ออเดอร์
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">{formatPrice(product.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADVANCED: Revenue Growth Card
// ============================================
interface RevenueGrowthCardProps {
  data: RevenueGrowth;
}

export function RevenueGrowthCard({ data }: RevenueGrowthCardProps) {
  const isPositive = data.growthPercent >= 0;
  const isOrdersPositive = data.ordersGrowthPercent >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          การเติบโต
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">รายได้ช่วงนี้</p>
            <p className="text-xl font-bold">{formatPrice(data.currentPeriodRevenue)}</p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isPositive ? '+' : ''}{data.growthPercent.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">คำสั่งซื้อช่วงนี้</p>
            <p className="text-xl font-bold">{data.currentPeriodOrders}</p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${
            isOrdersPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isOrdersPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isOrdersPositive ? '+' : ''}{data.ordersGrowthPercent.toFixed(1)}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          เทียบกับช่วงก่อนหน้า (รายได้ {formatPrice(data.previousPeriodRevenue)}, {data.previousPeriodOrders} ออเดอร์)
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADVANCED: Hourly Stats Chart
// ============================================
interface HourlyChartProps {
  data: HourlyStats[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const formatHour = (hour: number) => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ช่วงเวลาที่ขายดี
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={formatHour}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                interval={2}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [Number(value) || 0, 'คำสั่งซื้อ']}
                labelFormatter={(label) => `เวลา ${formatHour(Number(label))}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADVANCED: Day of Week Chart
// ============================================
interface DayOfWeekChartProps {
  data: DayOfWeekStats[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>วันที่ขายดี</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dayName" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatPrice(Number(value) || 0) : Number(value) || 0,
                  name === 'revenue' ? 'รายได้' : 'คำสั่งซื้อ'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[2, 2, 0, 0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ADVANCED: Customer Insights Card
// ============================================
interface CustomerInsightsCardProps {
  data: CustomerInsights;
}

export function CustomerInsightsCard({ data }: CustomerInsightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          ข้อมูลลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-2xl font-bold text-blue-700">{data.totalCustomers}</p>
            <p className="text-xs text-blue-600">ลูกค้าทั้งหมด</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50">
            <p className="text-2xl font-bold text-purple-700">{data.repeatCustomers}</p>
            <p className="text-xs text-purple-600">ลูกค้าซื้อซ้ำ</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">อัตราซื้อซ้ำ</span>
            </div>
            <span className="font-semibold">{data.repeatRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ออเดอร์เฉลี่ย/คน</span>
            </div>
            <span className="font-semibold">{data.averageOrdersPerCustomer.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
