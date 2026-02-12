import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateBookingICS } from '@/lib/ics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get order with product and creator info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, buyer_name, buyer_email, booking_date, booking_time, status,
        product:products(id, title, type, type_config),
        creator:creators(display_name, username)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow for booking products with confirmed status
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    if (!product || (product.type !== 'booking' && product.type !== 'live')) {
      return NextResponse.json({ error: 'Not a booking order' }, { status: 400 });
    }

    // Verify order is confirmed (comment said this but wasn't enforced)
    if (order.status !== 'confirmed') {
      return NextResponse.json({ error: 'Order is not confirmed' }, { status: 400 });
    }

    if (!order.booking_date || !order.booking_time) {
      return NextResponse.json({ error: 'Booking details not found' }, { status: 400 });
    }

    // Get fulfillment for meeting details
    const { data: fulfillment } = await supabase
      .from('fulfillments')
      .select('content')
      .eq('order_id', orderId)
      .single();

    const fulfillmentContent = (fulfillment?.content as Record<string, unknown>) || {};
    const typeConfig = (product.type_config as Record<string, unknown>) || {};
    const creator = Array.isArray(order.creator) ? order.creator[0] : order.creator;

    // Generate ICS content
    const icsContent = generateBookingICS({
      productTitle: product.title,
      creatorName: creator?.display_name || creator?.username || 'Creator',
      buyerName: order.buyer_name,
      buyerEmail: order.buyer_email,
      bookingDate: order.booking_date,
      bookingTime: order.booking_time,
      durationMinutes: (typeConfig.duration_minutes as number) || 60,
      meetingUrl: fulfillmentContent.meeting_url as string | undefined,
      location: fulfillmentContent.location as string | undefined,
      notes: fulfillmentContent.notes as string | undefined,
    });

    // Return as downloadable .ics file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${orderId.slice(0, 8)}.ics"`,
      },
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
