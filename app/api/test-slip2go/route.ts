import { NextRequest, NextResponse } from 'next/server';
import { verifySlipBase64 } from '@/lib/slip2go';

// DEBUG ENDPOINT - remove after testing
export async function POST(request: NextRequest) {
  try {
    const { base64Image, amount } = await request.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'base64Image required' }, { status: 400 });
    }

    console.log('[TestSlip2GO] Testing Base64, length:', base64Image.length, 'amount:', amount);

    const result = await verifySlipBase64(base64Image, amount || undefined, false);

    console.log('[TestSlip2GO] Result:', JSON.stringify(result));

    return NextResponse.json({
      result,
      env: {
        hasApiUrl: !!process.env.SLIP2GO_API_URL,
        hasSecretKey: !!process.env.SLIP2GO_SECRET_KEY,
        apiUrl: process.env.SLIP2GO_API_URL || '(not set)',
      }
    });
  } catch (error) {
    console.error('[TestSlip2GO] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
