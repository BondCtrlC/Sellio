import { NextRequest, NextResponse } from 'next/server';
import { extractQrFromImage, verifySlipByQrCode } from '@/lib/slip2go';

// DEBUG ENDPOINT - remove after testing
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('slip') as File | null;
    const amount = formData.get('amount') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'slip file required (use form-data)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Step 1: Extract QR code
    const qrCode = await extractQrFromImage(buffer);

    if (!qrCode) {
      return NextResponse.json({
        step: 'qr_extraction',
        error: 'No QR code found in image',
      });
    }

    // Step 2: Verify with Slip2GO
    const result = await verifySlipByQrCode(
      qrCode,
      amount ? Number(amount) : undefined,
      false
    );

    return NextResponse.json({
      qrCode: qrCode.substring(0, 60) + '...',
      result,
    });
  } catch (error) {
    console.error('[TestSlip2GO] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
