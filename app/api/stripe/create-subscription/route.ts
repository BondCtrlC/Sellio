import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id, plan, stripe_customer_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (creator.plan === 'pro') {
      return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get or create Stripe customer
    let customerId = creator.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: creator.display_name || undefined,
        metadata: {
          creator_id: creator.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('creators')
        .update({ stripe_customer_id: customerId })
        .eq('id', creator.id);
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'Sellio Pro',
              description: 'สินค้าไม่จำกัด, Export ข้อมูล, จัดการรีวิว, ลบ Branding และอื่นๆ',
            },
            unit_amount: formatAmountForStripe(99, 'thb'), // 99 THB
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        creator_id: creator.id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          creator_id: creator.id,
          user_id: user.id,
        },
      },
      success_url: `${baseUrl}/dashboard/upgrade?success=true`,
      cancel_url: `${baseUrl}/dashboard/upgrade?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    const message = error?.message || 'Failed to create checkout session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
