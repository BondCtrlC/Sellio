// ============================================
// Slip2GO - Verify Slip via QR Code
// https://slip2go.com
// ============================================

import jsQR from 'jsqr';
import sharp from 'sharp';

const SLIP2GO_API_URL = process.env.SLIP2GO_API_URL || 'https://connect.slip2go.com';
const SLIP2GO_SECRET_KEY = process.env.SLIP2GO_SECRET_KEY || '';

export interface Slip2GoVerifyResult {
  success: boolean;
  verified: boolean;
  amount: number | null;
  message: string;
  transRef: string | null;
  dateTime: string | null;
  senderName: string | null;
  receiverName: string | null;
  qrCode?: string;
  raw?: unknown;
}

/**
 * Try to decode QR from raw RGBA pixel data
 */
function tryDecodeQR(data: Buffer, width: number, height: number): string | null {
  try {
    const qrResult = jsQR(new Uint8ClampedArray(data), width, height);
    return qrResult ? qrResult.data : null;
  } catch {
    return null;
  }
}

/**
 * Extract QR code text from a slip image buffer.
 * Tries multiple strategies: full image, bottom-right crop, bottom-half crop,
 * and different scales to maximize detection success.
 */
export async function extractQrFromImage(imageBuffer: Uint8Array): Promise<string | null> {
  try {
    const imgBuf = Buffer.from(imageBuffer);
    const metadata = await sharp(imgBuf).metadata();
    const origW = metadata.width || 800;
    const origH = metadata.height || 1200;

    console.log(`[Slip2GO] Image size: ${origW}x${origH}`);

    // Strategy 1: Full image at reasonable size (max 1200px)
    {
      const { data, info } = await sharp(imgBuf)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qr = tryDecodeQR(data, info.width, info.height);
      if (qr) {
        console.log('[Slip2GO] QR found (full image):', qr.substring(0, 50) + '...');
        return qr;
      }
    }

    // Strategy 2: Bottom-right quadrant (QR is usually bottom-right on Thai slips)
    {
      const cropW = Math.floor(origW * 0.5);
      const cropH = Math.floor(origH * 0.5);
      const { data, info } = await sharp(imgBuf)
        .extract({ left: origW - cropW, top: origH - cropH, width: cropW, height: cropH })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qr = tryDecodeQR(data, info.width, info.height);
      if (qr) {
        console.log('[Slip2GO] QR found (bottom-right crop):', qr.substring(0, 50) + '...');
        return qr;
      }
    }

    // Strategy 3: Bottom-right 35% — tighter crop for small QR codes
    {
      const cropW = Math.floor(origW * 0.35);
      const cropH = Math.floor(origH * 0.35);
      const { data, info } = await sharp(imgBuf)
        .extract({ left: origW - cropW, top: origH - cropH, width: cropW, height: cropH })
        .resize(600, 600, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qr = tryDecodeQR(data, info.width, info.height);
      if (qr) {
        console.log('[Slip2GO] QR found (tight bottom-right):', qr.substring(0, 50) + '...');
        return qr;
      }
    }

    // Strategy 4: Bottom half of image
    {
      const cropH = Math.floor(origH * 0.5);
      const { data, info } = await sharp(imgBuf)
        .extract({ left: 0, top: origH - cropH, width: origW, height: cropH })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qr = tryDecodeQR(data, info.width, info.height);
      if (qr) {
        console.log('[Slip2GO] QR found (bottom half):', qr.substring(0, 50) + '...');
        return qr;
      }
    }

    // Strategy 5: Grayscale + sharpen for low-quality images
    {
      const { data, info } = await sharp(imgBuf)
        .greyscale()
        .sharpen()
        .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const qr = tryDecodeQR(data, info.width, info.height);
      if (qr) {
        console.log('[Slip2GO] QR found (grayscale+sharpen):', qr.substring(0, 50) + '...');
        return qr;
      }
    }

    console.log('[Slip2GO] No QR code found after all strategies');
    return null;
  } catch (error) {
    console.error('[Slip2GO] QR extraction error:', error);
    return null;
  }
}

/**
 * Verify a bank transfer slip using Slip2GO QR Code API
 * @param qrCode - QR code text extracted from the slip
 * @param expectedAmount - Expected payment amount to verify against
 * @param checkDuplicate - Whether to check for duplicate slips (default: true)
 */
export async function verifySlipByQrCode(
  qrCode: string,
  expectedAmount?: number,
  checkDuplicate: boolean = true
): Promise<Slip2GoVerifyResult> {
  if (!SLIP2GO_SECRET_KEY) {
    console.warn('SLIP2GO_SECRET_KEY not configured, skipping verification');
    return {
      success: false,
      verified: false,
      amount: null,
      message: 'Slip verification not configured',
      transRef: null,
      dateTime: null,
      senderName: null,
      receiverName: null,
    };
  }

  try {
    const payload: Record<string, unknown> = {
      qrCode,
    };

    // Add optional check conditions
    const checkCondition: Record<string, unknown> = {};

    if (checkDuplicate) {
      checkCondition.checkDuplicate = true;
    }

    if (expectedAmount && expectedAmount > 0) {
      checkCondition.checkAmount = {
        type: 'eq',
        amount: String(expectedAmount),
      };
    }

    if (Object.keys(checkCondition).length > 0) {
      payload.checkCondition = checkCondition;
    }

    console.log('[Slip2GO] Verifying QR code, expected amount:', expectedAmount);
    console.log('[Slip2GO] QR data:', qrCode.substring(0, 50) + '...');

    const response = await fetch(`${SLIP2GO_API_URL}/api/verify-slip/qr-code/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
      },
      body: JSON.stringify({ payload }),
    });

    const result = await response.json();

    console.log('[Slip2GO] Response status:', response.status);
    console.log('[Slip2GO] Response code:', result.code, 'message:', result.message);

    // code "200000" = Slip found and valid
    if (result.code === '200000' && result.data) {
      const data = result.data;
      const slipAmount = Number(data.amount) || 0;
      const amountMatches = expectedAmount ? slipAmount === expectedAmount : true;

      return {
        success: true,
        verified: amountMatches,
        amount: slipAmount,
        message: amountMatches ? 'Slip verified successfully' : `Amount mismatch: expected ${expectedAmount}, got ${slipAmount}`,
        transRef: data.transRef || null,
        dateTime: data.dateTime || null,
        senderName: data.sender?.account?.name || null,
        receiverName: data.receiver?.account?.name || null,
        qrCode,
        raw: data,
      };
    }

    return {
      success: true,
      verified: false,
      amount: null,
      message: result.message || 'Slip verification failed',
      transRef: null,
      dateTime: null,
      senderName: null,
      receiverName: null,
      qrCode,
      raw: result,
    };
  } catch (error) {
    console.error('[Slip2GO] Verification error:', error);
    return {
      success: false,
      verified: false,
      amount: null,
      message: error instanceof Error ? error.message : 'Unknown error',
      transRef: null,
      dateTime: null,
      senderName: null,
      receiverName: null,
    };
  }
}
