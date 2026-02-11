import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOrderById } from '@/actions/orders';
import { PaymentPage } from './payment-page';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Payment');
  return { title: t('metaTitle') };
}

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutPaymentPage({ params }: PageProps) {
  const { orderId } = await params;
  const t = await getTranslations('Payment');

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  // If order is already confirmed or cancelled, redirect to success/status page
  if (order.status === 'confirmed') {
    redirect(`/checkout/${orderId}/success`);
  }

  if (order.status === 'cancelled' || order.status === 'refunded') {
    redirect(`/checkout/${orderId}/success`);
  }

  // Check if order has expired
  if (order.expires_at && new Date(order.expires_at) < new Date() && order.status === 'pending_payment') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">{t('orderExpired')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('orderExpiredDesc')}
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {t('backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return <PaymentPage order={order} />;
}
