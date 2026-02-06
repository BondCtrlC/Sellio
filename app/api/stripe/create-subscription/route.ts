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
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, plan, stripe_customer_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (creatorError) {
      return NextResponse.json({ error: `Creator query failed: ${creatorError.message}` }, { status: 500 });
    }

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    if (creator.plan === 'pro') {
      return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    step = 'stripe_customer';
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

      await supabase
        .from('creators')
        .update({ stripe_customer_id: customerId })
        .eq('id', creator.id);
    }

    step = 'create_session';
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
            unit_amount: formatAmountForStripe(99, 'thb'),
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
  } catch (error: unknown) {
    console.error(`Subscription error at step [${step}]:`, error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `[${step}] ${msg}` },
      { status: 500 }
    );
  }
}
