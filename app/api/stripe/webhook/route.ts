import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

// Disable body parsing, we need raw body for webhook verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        await handleSubscriptionCheckout(session);
      } else {
        await handleCheckoutCompleted(session);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment failed:', invoice.id);
      break;
    }
    case 'payment_intent.succeeded': {
      // Additional handling if needed
      console.log('Payment succeeded:', event.data.object);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const creatorId = session.metadata?.creator_id;

  if (!orderId) {
    console.error('No order_id in session metadata');
    return;
  }

  const supabase = createAdminClient();

  // Get order with product and creator info
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_name,
      buyer_email,
      booking_date,
      booking_time,
      product:products(id, title, type, type_config),
      creator:creators(id, email, display_name, contact_line, contact_ig)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Order not found:', orderId);
    return;
  }

  // Skip if already processed
  if (order.status === 'confirmed') {
    console.log('Order already confirmed:', orderId);
    return;
  }

  // Update order status to confirmed
  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId);

  if (updateOrderError) {
    console.error('Failed to update order status:', updateOrderError);
    return;
  }

  // Update payment record
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
    })
    .eq('order_id', orderId);

  if (updatePaymentError) {
    console.error('Failed to update payment:', updatePaymentError);
  }

  // Create fulfillment for digital products
  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  const creator = Array.isArray(order.creator) ? order.creator[0] : order.creator;

  if (product?.type === 'digital') {
    const typeConfig = (product.type_config as Record<string, unknown>) || {};
    let fulfillmentContent: Record<string, unknown>;

    if (typeConfig.delivery_type === 'redirect') {
      fulfillmentContent = {
        delivery_type: 'redirect',
        redirect_url: typeConfig.redirect_url || '',
        redirect_name: typeConfig.redirect_name || '',
      };
    } else {
      fulfillmentContent = {
        delivery_type: 'file',
        file_url: typeConfig.digital_file_url || '',
        file_name: typeConfig.digital_file_name || 'file',
        download_count: 0,
        max_downloads: 5,
      };
    }

    await supabase
      .from('fulfillments')
      .insert({
        order_id: orderId,
        type: 'download',
        content: fulfillmentContent,
        access_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
  }

  // Send confirmation email
  console.log('Stripe webhook - preparing to send email, creator:', creator?.email, 'product:', product?.title);
  if (creator && product) {
    // Prepare email data
    const emailData: Parameters<typeof sendOrderConfirmationEmail>[0] = {
      orderId: order.id,
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      productTitle: product.title || 'สินค้า',
      amount: order.total,
      creatorName: creator.display_name || 'ผู้ขาย',
      creatorContact: {
        line: creator.contact_line || undefined,
        ig: creator.contact_ig || undefined,
      },
    };

    // Add booking info if this is a booking order
    if ((product.type === 'booking' || product.type === 'live') && order.booking_date && order.booking_time) {
      // Get fulfillment for meeting details
      const { data: fulfillment } = await supabase
        .from('fulfillments')
        .select('content')
        .eq('order_id', orderId)
        .single();

      const fulfillmentContent = (fulfillment?.content as Record<string, unknown>) || {};
      const typeConfig = (product.type_config as Record<string, unknown>) || {};

      emailData.booking = {
        date: order.booking_date,
        time: order.booking_time,
        durationMinutes: (typeConfig.duration_minutes as number) || 60,
        meetingType: (fulfillmentContent.meeting_type as 'online' | 'offline') || 'online',
        meetingUrl: fulfillmentContent.meeting_url as string | undefined,
        meetingPlatform: fulfillmentContent.meeting_platform as string | undefined,
        location: fulfillmentContent.location as string | undefined,
      };
    }

    console.log('Stripe webhook - sending confirmation email to:', order.buyer_email);
    try {
      await sendOrderConfirmationEmail(emailData);
      console.log('Stripe webhook - email sent successfully');
    } catch (emailError) {
      console.error('Stripe webhook - email failed:', emailError);
    }
  } else {
    console.log('Stripe webhook - skipping email, creator or product missing');
  }

  console.log('Order confirmed via Stripe:', orderId);
}

// ============================================
// SUBSCRIPTION HANDLERS
// ============================================

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const creatorId = session.metadata?.creator_id;
  if (!creatorId) {
    console.error('No creator_id in subscription session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in session');
    return;
  }

  // Get subscription details for period end
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = (subscriptionResponse as any).current_period_end as number;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('creators')
    .update({
      plan: 'pro',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      plan_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq('id', creatorId);

  if (error) {
    console.error('Failed to upgrade creator to pro:', error);
    return;
  }

  console.log('Creator upgraded to Pro:', creatorId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  const creatorId = sub.metadata?.creator_id;
  if (!creatorId) {
    console.error('No creator_id in subscription metadata');
    return;
  }

  const supabase = createAdminClient();

  // Check if subscription is active or past_due
  const isActive = ['active', 'trialing'].includes(sub.status);
  const periodEnd = sub.current_period_end as number;
  
  const { error } = await supabase
    .from('creators')
    .update({
      plan: isActive ? 'pro' : 'free',
      plan_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq('id', creatorId);

  if (error) {
    console.error('Failed to update subscription status:', error);
    return;
  }

  console.log('Subscription updated for creator:', creatorId, 'status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  const creatorId = sub.metadata?.creator_id;
  if (!creatorId) {
    console.error('No creator_id in deleted subscription metadata');
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('creators')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      plan_expires_at: null,
    })
    .eq('id', creatorId);

  if (error) {
    console.error('Failed to downgrade creator:', error);
    return;
  }

  console.log('Creator downgraded to Free (subscription deleted):', creatorId);
}
