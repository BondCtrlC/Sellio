// ============================================
// Slip2GO - Verify Slip API Client (Base64)
// https://slip2go.com
// ============================================

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
  raw?: unknown;
}

/**
 * Verify a bank transfer slip using Slip2GO Base64 API
 * @param base64Image - Base64 encoded slip image (without data:image prefix)
 * @param expectedAmount - Expected payment amount to verify against
 * @param checkDuplicate - Whether to check for duplicate slips (default: true)
 */
export async function verifySlipBase64(
  base64Image: string,
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
    // Build request body for Base64 endpoint
    // Slip2GO requires data URI prefix: "data:image/jpeg;base64,..."
    const imageBase64 = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    const payload: Record<string, unknown> = {
      imageBase64,
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

    console.log('[Slip2GO] Verifying slip (Base64), expected:', expectedAmount, 'base64 length:', base64Image.length);

    const response = await fetch(`${SLIP2GO_API_URL}/api/verify-slip/qr-base64/info`, {
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
        raw: data,
      };
    }

    // Slip not found or invalid
    return {
      success: true,
      verified: false,
      amount: null,
      message: result.message || 'Slip verification failed',
      transRef: null,
      dateTime: null,
      senderName: null,
      receiverName: null,
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
