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
  apiCode?: string;
  raw?: unknown;
}

/**
 * Verify a bank transfer slip using Slip2GO QR Code API
 * Sends only the QR code — amount is verified locally from the response data.
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
      apiCode: 'NO_KEY',
    };
  }

  try {
    // Send only qrCode — no checkCondition to minimize failure points
    // We verify amount ourselves from the response data
    const requestBody = {
      payload: {
        qrCode,
      },
    };

    const apiUrl = `${SLIP2GO_API_URL}/api/verify-slip/qr-code/info`;

    console.log('[Slip2GO] POST', apiUrl);
    console.log('[Slip2GO] QR:', qrCode.substring(0, 60) + '...');
    console.log('[Slip2GO] Expected amount:', expectedAmount);

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

    // Success codes that mean the slip was found in the bank system:
    // 200000 = Slip Found
    // 200200 = Slip is Valid  
    // 200401 = Recipient Account Not Match (slip is real, but receiver doesn't match)
    // 200402 = Transfer Amount Not Match (slip is real, but amount doesn't match)
    // 200403 = Transfer Date Not Match (slip is real, but date doesn't match)
    const slipFoundCodes = ['200000', '200200', '200401', '200402', '200403'];

    if (slipFoundCodes.includes(code) && result.data) {
      const data = result.data;
      const slipAmount = Number(data.amount) || 0;

      // Verify amount ourselves
      const amountMatches = expectedAmount 
        ? slipAmount === expectedAmount 
        : true;

      return {
        success: true,
        verified: amountMatches,
        amount: slipAmount,
        message: amountMatches 
          ? 'Slip verified successfully'
          : `Amount mismatch: expected ${expectedAmount}, got ${slipAmount}`,
        transRef: data.transRef || null,
        dateTime: data.dateTime || null,
        senderName: data.sender?.account?.name || null,
        receiverName: data.receiver?.account?.name || null,
        qrCode,
        apiCode: code,
        raw: data,
      };
    }

    // Fraud / Duplicate / Not Found
    return {
      success: true,
      verified: false,
      amount: null,
      message: `[${code}] ${result.message || 'Verification failed'}`,
      transRef: null, dateTime: null, senderName: null, receiverName: null,
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
      apiCode: 'ERROR',
    };
  }
}
