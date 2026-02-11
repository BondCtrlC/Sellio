'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  Search,
  Filter,
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { OrderDetailModal } from './order-detail-modal';
import { useTranslations } from 'next-intl';

interface Order {
  id: string;
  status: string;
  total: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_note: string | null;
  refund_promptpay: string | null;
  booking_date: string | null;
  booking_time: string | null;
  cancel_reason: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    type: string;
    image_url: string | null;
  } | null;
  payment: {
    id: string;
    status: string;
    slip_url: string | null;
    slip_uploaded_at: string | null;
    refund_slip_url: string | null;
    slip_verified: boolean | null;
    slip_verify_ref: string | null;
    slip_verify_message: string | null;
  } | null;
}

interface OrdersListProps {
  orders: Order[];
  currentStatus: string;
}

export function OrdersList({ orders, currentStatus }: OrdersListProps) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const t = useTranslations('Orders');

  const STATUS_TABS = [
    { value: 'all', label: t('tabAll') },
    { value: 'pending_confirmation', label: t('tabPendingConfirm') },
    { value: 'pending_payment', label: t('tabPendingPayment') },
    { value: 'confirmed', label: t('tabConfirmed') },
    { value: 'refunded', label: t('tabRefunded') },
    { value: 'cancelled', label: t('tabCancelled') },
  ];

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending_payment: { label: t('statusPendingPayment'), color: 'bg-blue-100 text-blue-700', icon: Clock },
    pending_confirmation: { label: t('statusPendingConfirm'), color: 'bg-yellow-100 text-yellow-700', icon: Eye },
    confirmed: { label: t('statusConfirmed'), color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: t('statusCancelled'), color: 'bg-red-100 text-red-700', icon: XCircle },
    refunded: { label: t('statusRefunded'), color: 'bg-purple-100 text-purple-700', icon: RefreshCcw },
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    router.push(`/dashboard/orders${params.toString() ? '?' + params.toString() : ''}`);
  };

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.buyer_name.toLowerCase().includes(term) ||
      order.buyer_email.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term) ||
      order.product?.title.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                currentStatus === tab.value
                  ? 'bg-white shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('noOrders')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
            const StatusIcon = statusConfig.icon;

            return (
              <Card 
                key={order.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  order.status === 'pending_confirmation' ? 'ring-2 ring-yellow-400' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.product?.image_url ? (
                        <img
                          src={order.product.image_url}
                          alt={order.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold truncate">
                            {order.product?.title || t('product')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.buyer_name} • {order.buyer_email}
                          </p>
                        </div>
                        <p className="font-bold text-lg whitespace-nowrap">
                          {formatPrice(order.total)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>

                        {/* Slip Verification Failed Badge */}
                        {order.payment?.slip_verified === false && order.payment?.slip_verify_message && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <ShieldAlert className="h-3 w-3" />
                            {t('slipVerifyFailedBadge')}
                          </span>
                        )}

                        {/* Order ID */}
                        <span className="text-xs text-muted-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>

                        {/* Date */}
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('th-TH')}
                        </span>

                        {/* Booking Date */}
                        {order.booking_date && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.booking_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
