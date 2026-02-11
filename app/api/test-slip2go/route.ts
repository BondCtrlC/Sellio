import { NextRequest, NextResponse } from 'next/server';
import { verifySlipByQrCode } from '@/lib/slip2go';

// DEBUG ENDPOINT - test QR code verification directly
// Usage: POST with JSON body { "qrCode": "...", "amount": 10 }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, amount } = body;

    if (!qrCode) {
      return NextResponse.json({ error: 'qrCode required' }, { status: 400 });
    }

    const result = await verifySlipByQrCode(
      qrCode,
      amount ? Number(amount) : undefined,
      false
    );

    return NextResponse.json({
      qrCodePreview: qrCode.substring(0, 60) + '...',
      result,
    });
  } catch (error) {
    console.error('[TestSlip2GO] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
