import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get order with product and creator info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total,
        buyer_name,
        buyer_email,
        status,
        product:products(
          id,
          title,
          image_url
        ),
        creator:creators(
          id,
          username,
          display_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Order is not pending payment' },
        { status: 400 }
      );
    }

    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    const creator = Array.isArray(order.creator) ? order.creator[0] : order.creator;

    if (!product || !creator) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: product.title,
              ...(product.image_url && { images: [product.image_url] }),
            },
            unit_amount: formatAmountForStripe(order.total, 'thb'),
          },
          quantity: 1,
        },
      ],
      customer_email: order.buyer_email,
      metadata: {
        order_id: orderId,
        creator_id: creator.id,
      },
      success_url: `${baseUrl}/checkout/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/${orderId}?cancelled=true`,
    };

    // If creator has connected Stripe account, use Connect (for platform fee)
    // For now, we'll use direct charges to the platform
    // TODO: Implement Stripe Connect for creator payouts

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
