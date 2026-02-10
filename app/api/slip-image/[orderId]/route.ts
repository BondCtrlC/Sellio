import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Proxy endpoint to serve slip images through our domain
// Slip2GO requires image URLs from recognized domains
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const rawOrderId = (await params).orderId;
  // Strip .jpg/.png extension if present (Slip2GO requires image extension in URL)
  const orderId = rawOrderId.replace(/\.(jpg|jpeg|png|webp)$/i, '');

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Get payment record to find slip URL
    const { data: payment } = await supabase
      .from('payments')
      .select('slip_url')
      .eq('order_id', orderId)
      .single();

    if (!payment?.slip_url) {
      return NextResponse.json({ error: 'Slip not found' }, { status: 404 });
    }

    // Fetch the image from Supabase storage
    const imageResponse = await fetch(payment.slip_url);
    
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch slip image' }, { status: 502 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[SlipProxy] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
