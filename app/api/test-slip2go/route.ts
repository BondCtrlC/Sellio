import { NextRequest, NextResponse } from 'next/server';
import { verifySlip } from '@/lib/slip2go';

// DEBUG ENDPOINT - remove after testing
export async function POST(request: NextRequest) {
  try {
    const { imageUrl, amount, orderId } = await request.json();

    // If orderId is provided, use proxy URL with .jpg extension
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trysellio.com';
    const urlToVerify = orderId 
      ? `${baseUrl}/api/slip-image/${orderId}.jpg`
      : imageUrl;

    if (!urlToVerify) {
      return NextResponse.json({ error: 'imageUrl or orderId required' }, { status: 400 });
    }

    console.log('[TestSlip2GO] Testing with:', { urlToVerify, amount });

    const result = await verifySlip(urlToVerify, amount || undefined, false);

    console.log('[TestSlip2GO] Result:', JSON.stringify(result));

    return NextResponse.json({
      urlUsed: urlToVerify,
      result,
      env: {
        hasApiUrl: !!process.env.SLIP2GO_API_URL,
        hasSecretKey: !!process.env.SLIP2GO_SECRET_KEY,
        apiUrl: process.env.SLIP2GO_API_URL || '(not set)',
        keyPrefix: process.env.SLIP2GO_SECRET_KEY?.substring(0, 5) + '...' || '(not set)',
      }
    });
  } catch (error) {
    console.error('[TestSlip2GO] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
