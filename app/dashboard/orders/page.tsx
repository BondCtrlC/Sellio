import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCreatorOrders, getOrderStats } from '@/actions/orders';
import { OrdersList } from './orders-list';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Orders');
  return { title: t('title') };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const t = await getTranslations('Orders');
  
  const [ordersResult, stats] = await Promise.all([
    getCreatorOrders(status),
    getOrderStats(),
  ]);

  if (!ordersResult.success) {
    redirect('/login');
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <StatCard 
            label={t('statAll')} 
            value={stats.total} 
            color="bg-gray-100"
          />
          <StatCard 
            label={t('statPendingPayment')} 
            value={stats.pending_payment} 
            color="bg-blue-100"
          />
          <StatCard 
            label={t('statPendingConfirm')} 
            value={stats.pending_confirmation} 
            color="bg-yellow-100"
            highlight
          />
          <StatCard 
            label={t('statConfirmed')} 
            value={stats.confirmed} 
            color="bg-green-100"
          />
          <StatCard 
            label={t('statRefunded')} 
            value={stats.refunded} 
            color="bg-purple-100"
          />
          <StatCard 
            label={t('statCancelled')} 
            value={stats.cancelled} 
            color="bg-red-100"
          />
        </div>
      )}

      {/* Orders List */}
      <OrdersList 
        orders={ordersResult.orders || []} 
        currentStatus={status || 'all'}
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color,
  highlight 
}: { 
  label: string; 
  value: number; 
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${color} ${highlight ? 'ring-2 ring-yellow-400' : ''}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
