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
  receiverProxy: string | null;   // PromptPay number from slip (e.g. "0918830892")
  receiverAccount: string | null; // Bank account number from slip
  qrCode?: string;
  apiCode?: string;
  raw?: unknown;
}

/**
 * Verify a bank transfer slip using Slip2GO QR Code API
 * Uses checkCondition to validate amount + duplicate check.
 * Only code "200200" (Slip is Valid) means the slip passes all conditions.
 *
 * Receiver verification is done AFTER the API call by comparing
 * the receiver proxy/account from the response with the creator's PromptPay ID.
 * (checkReceiver in checkCondition format is unknown, so we do it manually)
 */
export async function verifySlipByQrCode(
  qrCode: string,
  expectedAmount?: number,
): Promise<Slip2GoVerifyResult> {
  if (!SLIP2GO_SECRET_KEY) {
    console.warn('SLIP2GO_SECRET_KEY not configured');
    return {
      success: false, verified: false, amount: null,
      message: 'API key not configured',
      transRef: null, dateTime: null, senderName: null, receiverName: null,
      receiverProxy: null, receiverAccount: null,
      apiCode: 'NO_KEY',
    };
  }

  try {
    // Build payload with checkCondition for proper validation
    const payload: Record<string, unknown> = {
      qrCode,
    };

    // Add conditions: duplicate check + amount match
    const checkCondition: Record<string, unknown> = {
      checkDuplicate: true,
    };

    if (expectedAmount && expectedAmount > 0) {
      checkCondition.checkAmount = {
        type: 'eq',
        amount: String(expectedAmount),
      };
    }

    payload.checkCondition = checkCondition;

    const requestBody = { payload };
    const apiUrl = `${SLIP2GO_API_URL}/api/verify-slip/qr-code/info`;

    console.log('[Slip2GO] POST', apiUrl);
    console.log('[Slip2GO] QR:', qrCode.substring(0, 60) + '...');
    console.log('[Slip2GO] checkCondition:', JSON.stringify(checkCondition));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    const code = String(result.code || '');

    console.log('[Slip2GO] HTTP:', response.status, '| Code:', code, '| Message:', result.message);
    if (result.data) {
      console.log('[Slip2GO] Data amount:', result.data.amount, '| transRef:', result.data.transRef);
    }

    // Response codes:
    // 200200 = Slip is Valid (all conditions passed!) → AUTO-CONFIRM
    // 200000 = Slip Found (but conditions not validated) → NOT enough
    // 200401 = Recipient Account Not Match
    // 200402 = Transfer Amount Not Match
    // 200403 = Transfer Date Not Match
    // 200404 = Slip Not Found in bank system
    // 200500 = Slip is Fraud
    // 200501 = Slip is Duplicated

    if (code === '200200' && result.data) {
      // ONLY 200200 = fully verified with conditions
      const data = result.data;

      // Log full receiver data to understand Slip2GO response structure
      console.log('[Slip2GO] Receiver data:', JSON.stringify(data.receiver));
      console.log('[Slip2GO] Sender data:', JSON.stringify(data.sender));

      // Extract receiver proxy (PromptPay number) and account number
      const receiverProxy = data.receiver?.account?.proxy?.value
        || data.receiver?.proxy?.value
        || null;
      const receiverAccount = data.receiver?.account?.value
        || data.receiver?.account?.number
        || null;

      return {
        success: true,
        verified: true,
        amount: Number(data.amount) || 0,
        message: 'Slip verified successfully',
        transRef: data.transRef || null,
        dateTime: data.dateTime || null,
        senderName: data.sender?.account?.name || null,
        receiverName: data.receiver?.account?.name || null,
        receiverProxy,
        receiverAccount,
        qrCode,
        apiCode: code,
        raw: data,
      };
    }

    // 200000 = Found but not validated, or condition mismatch codes
    // Extract amount from data if available
    const slipAmount = result.data ? Number(result.data.amount) || null : null;

    // Build readable message
    let msg = '';
    switch (code) {
      case '200000': msg = 'Slip found but conditions not verified'; break;
      case '200401': msg = 'Recipient account does not match'; break;
      case '200402': msg = `Amount mismatch (slip: ${slipAmount}, expected: ${expectedAmount})`; break;
      case '200403': msg = 'Transfer date does not match'; break;
      case '200404': msg = 'Slip not found in bank system'; break;
      case '200500': msg = 'Slip is fraud/fake'; break;
      case '200501': msg = 'Slip already used (duplicate)'; break;
      default: msg = result.message || 'Verification failed';
    }

    return {
      success: true,
      verified: false,
      amount: slipAmount,
      message: `[${code}] ${msg}`,
      transRef: result.data?.transRef || null,
      dateTime: result.data?.dateTime || null,
      senderName: null, receiverName: null,
      receiverProxy: null, receiverAccount: null,
      qrCode,
      apiCode: code,
      raw: result,
    };
  } catch (error) {
    console.error('[Slip2GO] Error:', error);
    return {
      success: false,
      verified: false,
      amount: null,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      transRef: null, dateTime: null, senderName: null, receiverName: null,
      receiverProxy: null, receiverAccount: null,
      apiCode: 'ERROR',
    };
  }
}
