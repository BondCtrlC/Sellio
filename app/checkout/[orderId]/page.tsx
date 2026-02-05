import { notFound, redirect } from 'next/navigation';
import { getOrderById } from '@/actions/orders';
import { PaymentPage } from './payment-page';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutPaymentPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  // If order is already confirmed or cancelled, redirect to success/status page
  if (order.status === 'confirmed') {
    redirect(`/checkout/${orderId}/success`);
  }

  if (order.status === 'cancelled' || order.status === 'refunded') {
    redirect(`/checkout/${orderId}/cancelled`);
  }

  return <PaymentPage order={order} />;
}
