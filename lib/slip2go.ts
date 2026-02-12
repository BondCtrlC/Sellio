// ============================================
// Slip2GO - Verify Slip via QR Code
// https://slip2go.com
// QR extraction is done on the client side (browser Canvas + jsQR in payment-page.tsx)
// This file handles the API call to Slip2GO to verify the extracted QR code text
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
  apiCode?: string;
}

/**
 * Verify a bank transfer slip using Slip2GO QR Code API
 * Uses checkCondition to validate amount + duplicate + receiver check.
 * Only code "200200" (Slip is Valid) means the slip passes all conditions.
 *
 * @param qrCode - QR code text extracted from slip image
 * @param expectedAmount - Expected transfer amount
 * @param receiverPromptPayId - Creator's PromptPay ID for receiver verification
 */
export async function verifySlipByQrCode(
  qrCode: string,
  expectedAmount?: number,
  receiverPromptPayId?: string | null,
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

    // Add conditions: duplicate check + amount match + receiver check
    const checkCondition: Record<string, unknown> = {
      checkDuplicate: true,
    };

    if (expectedAmount && expectedAmount > 0) {
      checkCondition.checkAmount = {
        type: 'eq',
        amount: expectedAmount,
      };
    }

    // Add receiver check — Slip2GO verifies receiver server-side
    // Format: checkReceiver is an ARRAY of objects with accountType + accountNumber
    // accountType "02001" = PromptPay phone number
    // If Slip2GO can't match → returns 200401 instead of 200200
    if (receiverPromptPayId) {
      const cleanId = receiverPromptPayId.replace(/[-\s.]/g, '');
      
      if (/^0\d{9}$/.test(cleanId)) {
        // 10-digit phone number → PromptPay type 02001
        checkCondition.checkReceiver = [
          { accountType: '02001', accountNumber: cleanId },
        ];
        console.log('[Slip2GO] Adding checkReceiver: PromptPay phone', cleanId.slice(0, 3) + '***' + cleanId.slice(-2));
      } else if (/^\d{13}$/.test(cleanId)) {
        // 13-digit national ID → just accountNumber (no specific type code known)
        checkCondition.checkReceiver = [
          { accountNumber: cleanId },
        ];
        console.log('[Slip2GO] Adding checkReceiver: National ID', cleanId.slice(0, 3) + '***' + cleanId.slice(-2));
      } else {
        console.log('[Slip2GO] Unknown PromptPay ID format, skipping checkReceiver');
      }
    }

    const apiUrl = `${SLIP2GO_API_URL}/api/verify-slip/qr-code/info`;

    // Retry logic: 200404 ("Slip not found") often means the bank hasn't
    // propagated the transaction yet. Retry up to 2 more times with delay.
    // IMPORTANT: On retry, we MUST disable checkDuplicate because Slip2GO
    // registers the QR on first call — retrying with checkDuplicate would
    // trigger 200501 (duplicate) even though the first call returned 200404.
    //
    // CRITICAL: NEVER retry on 200501 (duplicate). That is a legitimate
    // rejection meaning the slip was already used. Retrying with checkDuplicate
    // disabled would let duplicate/fake slips pass verification.
    const MAX_RETRIES = 2;
    const RETRY_DELAYS = [5000, 5000]; // 5s between each retry
    let result: Record<string, unknown> = {};
    let code = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // On retry: disable checkDuplicate (Slip2GO already recorded QR from attempt 1)
      const attemptCondition = { ...checkCondition };
      if (attempt > 0) {
        delete attemptCondition.checkDuplicate;
        const delayMs = RETRY_DELAYS[attempt - 1] || 5000;
        console.log(`[Slip2GO] Retry ${attempt}/${MAX_RETRIES} after ${delayMs}ms (previous: ${code}) — checkDuplicate disabled`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const attemptPayload = { ...payload, checkCondition: attemptCondition };
      const requestBody = { payload: attemptPayload };

      if (attempt === 0) {
        console.log('[Slip2GO] POST', apiUrl);
      }
      console.log(`[Slip2GO] checkCondition (attempt ${attempt + 1}):`, JSON.stringify(attemptCondition));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SLIP2GO_SECRET_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      result = await response.json();
      code = String(result.code || '');

      console.log(`[Slip2GO] HTTP: ${response.status} | Code: ${code} | Message: ${result.message} (attempt ${attempt + 1})`);
      if (result.data) {
        const data = result.data as Record<string, unknown>;
        console.log('[Slip2GO] Data amount:', data.amount, '| transRef:', data.transRef);
      }

      // ONLY retry on 200404 (Slip not found = bank timing issue)
      // NEVER retry on 200501 (duplicate) — that is a real rejection
      if (code !== '200404') break;
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
      const data = result.data as Record<string, unknown>;

      // Log full receiver object for debugging
      const receiver = data.receiver as Record<string, unknown> | undefined;
      console.log('[Slip2GO] Full receiver data:', JSON.stringify(receiver));

      // Extract receiver proxy (PromptPay number) — try all possible paths
      const recAccount = (receiver?.account as Record<string, unknown>) || {};
      const recProxy = (recAccount?.proxy as Record<string, unknown>) || (receiver?.proxy as Record<string, unknown>) || {};
      const rawProxy = (recProxy as Record<string, unknown>)?.value
        || (receiver?.proxy as Record<string, unknown>)?.value
        || recAccount?.proxy
        || receiver?.proxy
        || null;
      
      // Extract receiver account number — try all possible paths
      const rawAccount = recAccount?.value || recAccount?.number || recAccount?.id || null;

      // Ensure we only use string values (not objects)
      const receiverProxy = (typeof rawProxy === 'string' && rawProxy.length > 0) ? rawProxy : null;
      const receiverAccount = (typeof rawAccount === 'string' && rawAccount.length > 0) ? rawAccount : null;

      console.log('[Slip2GO] Extracted receiverProxy:', receiverProxy, '| receiverAccount:', receiverAccount);

      const sender = data.sender as Record<string, unknown> | undefined;
      const senderAccount = (sender?.account as Record<string, unknown>) || {};

      return {
        success: true,
        verified: true,
        amount: Number(data.amount) || 0,
        message: 'Slip verified successfully',
        transRef: (data.transRef as string) || null,
        dateTime: (data.dateTime as string) || null,
        senderName: (senderAccount?.name as string) || (sender?.name as string) || null,
        receiverName: (recAccount?.name as string) || (receiver?.name as string) || null,
        receiverProxy: typeof receiverProxy === 'string' ? receiverProxy : null,
        receiverAccount: typeof receiverAccount === 'string' ? receiverAccount : null,
        apiCode: code,
      };
    }

    // 200000 = Found but not validated, or condition mismatch codes
    // Extract amount from data if available
    const resultData = result.data as Record<string, unknown> | undefined;
    const slipAmount = resultData ? Number(resultData.amount) || null : null;

    // Build readable message
    let msg = '';
    switch (code) {
      case '200000': msg = 'Slip found but conditions not verified'; break;
      case '200401': msg = 'Recipient account does not match'; break;
      case '200402': msg = `Amount mismatch`; break;
      case '200403': msg = 'Transfer date does not match'; break;
      case '200404': msg = 'Slip not found in bank system'; break;
      case '200500': msg = 'Slip is fraud/fake'; break;
      case '200501': msg = 'Slip already used (duplicate)'; break;
      default: msg = (result.message as string) || 'Verification failed';
    }

    return {
      success: true,
      verified: false,
      amount: slipAmount,
      message: `[${code}] ${msg}`,
      transRef: (resultData?.transRef as string) || null,
      dateTime: (resultData?.dateTime as string) || null,
      senderName: null, receiverName: null,
      receiverProxy: null, receiverAccount: null,
      apiCode: code,
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
