import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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
      .select('id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!creator || !creator.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    // Cancel at period end (user keeps Pro until period ends)
    await stripe.subscriptions.update(creator.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
