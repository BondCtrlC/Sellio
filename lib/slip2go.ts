// ============================================
// Slip2GO - Verify Slip via QR Code
// https://slip2go.com
// QR extraction is done on the CLIENT side (browser Canvas + jsQR)
// This file only handles the API call to Slip2GO
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
  qrCode?: string;
  raw?: unknown;
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
