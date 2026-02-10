import { NextRequest, NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let step = 'init';

  try {
    step = 'auth';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    step = 'get_creator';
    const { data: creator } = await supabase
      .from('creators')
      .select('id, plan, stripe_customer_id, stripe_subscription_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (!creator || creator.plan !== 'pro' || !creator.stripe_subscription_id) {
      return NextResponse.json({ error: 'Must be on active Pro plan to switch' }, { status: 400 });
    }

    if (!creator.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    step = 'verify_monthly';
    // Verify current subscription is monthly
    const currentSub = await stripe.subscriptions.retrieve(creator.stripe_subscription_id);
    const currentInterval = currentSub.items?.data?.[0]?.price?.recurring?.interval;

    if (currentInterval !== 'month') {
      return NextResponse.json({ error: 'Already on yearly plan' }, { status: 400 });
    }

    step = 'create_coupon';
    // Create or retrieve the switch coupon (99 THB one-time credit)
    const couponId = 'sellio_monthly_to_yearly_credit';
    try {
      await stripe.coupons.retrieve(couponId);
    } catch {
      // Coupon doesn't exist yet, create it
      await stripe.coupons.create({
        id: couponId,
        amount_off: formatAmountForStripe(99, 'thb'), // 99 THB
        currency: 'thb',
        duration: 'once',
        name: 'Monthly Plan Credit',
      });
    }

    step = 'create_session';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: creator.stripe_customer_id,
      discounts: [{ coupon: couponId }],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'Sellio Pro (Yearly)',
              description: 'สินค้าไม่จำกัด, Export ข้อมูล, จัดการรีวิว, ลบ Branding และอื่นๆ (รายปี — ประหยัด 25%)',
            },
            unit_amount: formatAmountForStripe(899, 'thb'),
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        creator_id: creator.id,
        user_id: user.id,
        old_subscription_id: creator.stripe_subscription_id,
        switch_from: 'monthly',
      },
      subscription_data: {
        metadata: {
          creator_id: creator.id,
          user_id: user.id,
        },
      },
      success_url: `${baseUrl}/dashboard/settings?tab=billing&switched=yearly`,
      cancel_url: `${baseUrl}/dashboard/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error(`Switch plan error at [${step}]:`, error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `[${step}] ${msg}` },
      { status: 500 }
    );
  }
}
