/**
 * EMVCo QR Code TLV Parser for Thai PromptPay
 *
 * Thai PromptPay QR codes follow the EMVCo QR Code Specification.
 * Data is encoded as TLV (Tag-Length-Value) entries:
 *   - Tag: 2 chars (e.g. "29")
 *   - Length: 2 chars (e.g. "37" = 37 chars of value)
 *   - Value: {length} chars (may contain nested TLV)
 *
 * PromptPay Credit Transfer uses:
 *   - AID: A000000677010111
 *   - Sub-tag 01: Phone (0066XXXXXXXXX, 13 chars)
 *   - Sub-tag 02: National ID (13 digits)
 *   - Sub-tag 03: E-Wallet (15 digits)
 *
 * Bill Payment uses:
 *   - AID: A000000677010112
 *   - Sub-tag 01: Biller ID (15 digits — NOT a PromptPay phone!)
 *   - Sub-tag 02: Reference 1
 *   - Sub-tag 03: Reference 2
 *
 * We only extract phone numbers (10-digit) and national IDs (13-digit)
 * since those are the only formats usable with promptpay.io QR generation.
 */

const PROMPTPAY_CREDIT_AID = 'A000000677010111';
// Bill payment AID — we detect but reject these
const BILL_PAYMENT_AID = 'A000000677010112';

interface TLVEntry {
  tag: string;
  length: number;
  value: string;
}

/**
 * Parse a TLV-encoded string into an array of tag-length-value entries.
 */
function parseTLV(data: string): TLVEntry[] {
  const entries: TLVEntry[] = [];
  let pos = 0;

  while (pos + 4 <= data.length) {
    const tag = data.substring(pos, pos + 2);
    const lengthStr = data.substring(pos + 2, pos + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length < 0) break;
    if (pos + 4 + length > data.length) break;

    const value = data.substring(pos + 4, pos + 4 + length);
    entries.push({ tag, length, value });
    pos += 4 + length;
  }

  return entries;
}

/**
 * Convert a PromptPay phone from QR format (0066XXXXXXXXX) to Thai format (0XXXXXXXXX).
 */
function convertPhoneToThai(phone: string): string {
  // Format: 0066XXXXXXXXX → 0XXXXXXXXX
  if (phone.startsWith('0066') && phone.length === 13) {
    return '0' + phone.slice(4);
  }
  // Already in Thai format
  if (phone.startsWith('0') && phone.length === 10) {
    return phone;
  }
  // +66 format
  if (phone.startsWith('+66')) {
    return '0' + phone.slice(3);
  }
  return phone;
}

/**
 * Check if a value looks like a valid PromptPay phone number.
 * QR format: 0066XXXXXXXXX (13 chars) → converts to 0XXXXXXXXX (10 digits)
 * Thai format: 0XXXXXXXXX (10 digits starting with 0)
 */
function isPhoneNumber(value: string): boolean {
  // QR format: 0066 + 9 digits = 13 chars
  if (value.startsWith('0066') && value.length === 13 && /^\d+$/.test(value)) {
    return true;
  }
  // Thai format: 0 + 9 digits = 10 chars
  if (value.startsWith('0') && value.length === 10 && /^\d+$/.test(value)) {
    return true;
  }
  return false;
}

/**
 * Check if a value looks like a Thai national ID (13 digits, not starting with 0066).
 */
function isNationalId(value: string): boolean {
  return /^\d{13}$/.test(value) && !value.startsWith('0066');
}

/**
 * Extract the PromptPay ID from an EMVCo QR code string.
 *
 * Only returns phone numbers (10-digit Thai format) or national IDs (13-digit).
 * Rejects bill payment QRs and e-wallet/biller IDs.
 *
 * @param qrText The decoded text from a PromptPay QR code
 * @returns The PromptPay ID, or null if not found/invalid.
 */
export function extractPromptPayId(qrText: string): string | null {
  if (!qrText || qrText.length < 20) return null;

  const topLevel = parseTLV(qrText);

  // Search through all merchant account tags (29-31)
  // Some banks put PromptPay in tag 29, others in tag 30
  for (const entry of topLevel) {
    const tagNum = parseInt(entry.tag, 10);
    if (tagNum < 26 || tagNum > 51) continue; // Merchant account range per EMVCo spec

    const subEntries = parseTLV(entry.value);
    const aidEntry = subEntries.find(e => e.tag === '00');
    if (!aidEntry) continue;

    // Skip bill payment AIDs — they contain biller IDs, not PromptPay numbers
    if (aidEntry.value === BILL_PAYMENT_AID) continue;

    // Only process PromptPay credit transfer blocks
    if (aidEntry.value !== PROMPTPAY_CREDIT_AID) continue;

    // Search sub-tags for phone number or national ID
    // Priority: phone number first (sub-tag 01), then national ID (sub-tag 02)
    for (const subTag of ['01', '02', '03']) {
      const accountEntry = subEntries.find(e => e.tag === subTag);
      if (!accountEntry || !accountEntry.value) continue;

      const raw = accountEntry.value;

      // Phone number: 0066XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars)
      if (isPhoneNumber(raw)) {
        return convertPhoneToThai(raw);
      }

      // National ID: 13 digits (not starting with 0066)
      if (isNationalId(raw)) {
        return raw;
      }

      // Skip anything else (15-digit biller IDs, reference numbers, etc.)
    }
  }

  return null;
}
