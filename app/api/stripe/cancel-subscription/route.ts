import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
      .select('id, plan, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 400 });
    }

    // Check if request wants immediate cancellation
    let immediate = false;
    try {
      const body = await request.json();
      immediate = body?.immediate === true;
    } catch {
      // No body or invalid JSON, default to period end
    }

    // If no subscription ID but still pro, just downgrade directly
    if (!creator.stripe_subscription_id) {
      if (creator.plan === 'pro') {
        step = 'downgrade_no_sub';
        await supabase
          .from('creators')
          .update({ 
            plan: 'free', 
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq('id', creator.id);
        return NextResponse.json({ success: true, immediate: true });
      }
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    step = 'cancel_stripe';
    if (immediate) {
      // Cancel immediately
      try {
        await stripe.subscriptions.cancel(creator.stripe_subscription_id);
      } catch {
        // Subscription may already be cancelled in Stripe, continue with DB update
      }

      // Update DB immediately
      step = 'update_db';
      await supabase
        .from('creators')
        .update({ 
          plan: 'free', 
          stripe_subscription_id: null,
          plan_expires_at: null,
        })
        .eq('id', creator.id);

      return NextResponse.json({ success: true, immediate: true });
    } else {
      // Cancel at period end
      try {
        await stripe.subscriptions.update(creator.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch {
        // If subscription doesn't exist in Stripe, downgrade immediately
        await supabase
          .from('creators')
          .update({ 
            plan: 'free', 
            stripe_subscription_id: null,
            plan_expires_at: null,
          })
          .eq('id', creator.id);
        return NextResponse.json({ success: true, immediate: true });
      }

      return NextResponse.json({ success: true, immediate: false });
    }
  } catch (error: unknown) {
    console.error(`Cancel subscription error at [${step}]:`, error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again.' },
      { status: 500 }
    );
  }
}
