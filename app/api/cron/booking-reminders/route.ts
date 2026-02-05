import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingReminderEmail } from '@/lib/email';

// Vercel Cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron Jobs)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    // Get current time in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60 * 60 * 1000; // 7 hours in ms
    const thailandNow = new Date(now.getTime() + thailandOffset);
    
    // Calculate the time window for reminders (12-36 hours from now)
    // Since cron runs once daily at 8 AM, we check for bookings happening tomorrow
    // This wider window ensures we catch all tomorrow's bookings
    const minHoursAhead = 12;
    const maxHoursAhead = 36;
    
    const minTime = new Date(thailandNow.getTime() + minHoursAhead * 60 * 60 * 1000);
    const maxTime = new Date(thailandNow.getTime() + maxHoursAhead * 60 * 60 * 1000);
    
    // Format dates for query
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatTime = (d: Date) => d.toISOString().split('T')[1].slice(0, 5);
    
    console.log(`[Booking Reminder] Checking for bookings between ${minTime.toISOString()} and ${maxTime.toISOString()}`);
    
    // Find confirmed booking orders that need reminders
    // We look for bookings where:
    // 1. Order status is 'confirmed'
    // 2. Product type is 'booking' or 'live'
    // 3. Booking datetime is within our reminder window
    // 4. Reminder hasn't been sent yet (reminder_sent is null or false)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        buyer_name,
        buyer_email,
        booking_date,
        booking_time,
        reminder_sent,
        product:products!inner (
          id,
          title,
          type,
          type_config
        ),
        creator:creators!inner (
          display_name,
          username
        ),
        fulfillment:fulfillments (
          content
        )
      `)
      .eq('status', 'confirmed')
      .in('product.type', ['booking', 'live'])
      .not('booking_date', 'is', null)
      .not('booking_time', 'is', null)
      .or('reminder_sent.is.null,reminder_sent.eq.false');

    if (ordersError) {
      console.error('[Booking Reminder] Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.log('[Booking Reminder] No pending reminders found');
      return NextResponse.json({ 
        success: true, 
        message: 'No reminders to send',
        checked: 0,
        sent: 0 
      });
    }

    console.log(`[Booking Reminder] Found ${orders.length} potential orders to check`);

    let sentCount = 0;
    const results: { orderId: string; status: string; error?: string }[] = [];

    for (const order of orders) {
      try {
        // Validate booking_date and booking_time format
        if (!order.booking_date || !order.booking_time) {
          console.log(`[Booking Reminder] Skipping order ${order.id} - missing date/time`);
          continue;
        }

        // Ensure time format is correct (HH:mm or HH:mm:ss)
        const timeStr = order.booking_time.length === 5 ? `${order.booking_time}:00` : order.booking_time;
        
        // Construct booking datetime
        const bookingDatetime = new Date(`${order.booking_date}T${timeStr}+07:00`);
        
        // Check if date is valid
        if (isNaN(bookingDatetime.getTime())) {
          console.log(`[Booking Reminder] Skipping order ${order.id} - invalid date: ${order.booking_date} ${order.booking_time}`);
          continue;
        }
        
        // Check if booking is within our reminder window
        if (bookingDatetime < minTime || bookingDatetime > maxTime) {
          continue; // Skip if not in the window
        }

        console.log(`[Booking Reminder] Processing order ${order.id} - booking at ${bookingDatetime.toISOString()}`);

        // Get fulfillment content for meeting details
        const fulfillment = order.fulfillment?.[0];
        const fulfillmentContent = fulfillment?.content as { meeting_url?: string; meeting_platform?: string; location?: string } | null;
        const typeConfig = (order.product as any).type_config as { duration_minutes?: number } | null;

        // Send reminder email
        const emailResult = await sendBookingReminderEmail({
          orderId: order.id,
          buyerName: order.buyer_name,
          buyerEmail: order.buyer_email,
          productTitle: (order.product as any).title,
          creatorName: (order.creator as any).display_name || (order.creator as any).username,
          bookingDate: order.booking_date!,
          bookingTime: order.booking_time!,
          durationMinutes: typeConfig?.duration_minutes || 60,
          meetingUrl: fulfillmentContent?.meeting_url,
          meetingPlatform: fulfillmentContent?.meeting_platform,
          location: fulfillmentContent?.location,
        });

        if (emailResult.success) {
          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from('orders')
            .update({ reminder_sent: true })
            .eq('id', order.id);

          if (updateError) {
            console.error(`[Booking Reminder] Failed to update reminder_sent for order ${order.id}:`, updateError);
          }

          sentCount++;
          results.push({ orderId: order.id, status: 'sent' });
          console.log(`[Booking Reminder] ✅ Sent reminder for order ${order.id}`);
        } else {
          results.push({ orderId: order.id, status: 'failed', error: emailResult.error });
          console.error(`[Booking Reminder] ❌ Failed to send reminder for order ${order.id}:`, emailResult.error);
        }
      } catch (orderError) {
        console.error(`[Booking Reminder] Error processing order ${order.id}:`, orderError);
        results.push({ orderId: order.id, status: 'error', error: String(orderError) });
      }
    }

    console.log(`[Booking Reminder] Complete. Sent ${sentCount} reminders.`);

    return NextResponse.json({
      success: true,
      message: `Processed ${orders.length} orders, sent ${sentCount} reminders`,
      checked: orders.length,
      sent: sentCount,
      results,
    });
  } catch (error) {
    console.error('[Booking Reminder] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
