/**
 * EMVCo QR Code TLV Parser for Thai PromptPay
 *
 * Thai PromptPay QR codes follow the EMVCo QR Code Specification.
 * Data is encoded as TLV (Tag-Length-Value) entries:
 *   - Tag: 2 chars (e.g. "29")
 *   - Length: 2 chars (e.g. "37" = 37 chars of value)
 *   - Value: {length} chars (may contain nested TLV)
 *
 * PromptPay uses AID: A000000677010111
 * Account types (sub-tags within the PromptPay merchant block):
 *   - Sub-tag 01: Phone number (0066XXXXXXXXX, 13 chars)
 *   - Sub-tag 02: National ID (13 digits)
 *   - Sub-tag 03: E-Wallet / Bank reference (15 digits) — used by KBank etc.
 *
 * All three formats are valid PromptPay identifiers.
 */

const PROMPTPAY_AID = 'A000000677010111';

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
  if (phone.startsWith('0066') && phone.length === 13) {
    return '0' + phone.slice(4);
  }
  if (phone.startsWith('0') && phone.length === 10) {
    return phone;
  }
  if (phone.startsWith('+66')) {
    return '0' + phone.slice(3);
  }
  return phone;
}

export interface PromptPayResult {
  /** The extracted identifier (phone, national ID, or e-wallet) */
  id: string;
  /** Type of identifier */
  type: 'phone' | 'national_id' | 'ewallet';
  /** Whether this ID can be used with promptpay.io to generate QR */
  canGenerateQR: boolean;
}

/**
 * Extract the PromptPay ID from an EMVCo QR code string.
 *
 * Supports all three PromptPay identifier types:
 * - Phone number (10 digits, starting with 0)
 * - National ID (13 digits)
 * - E-Wallet / Bank reference (15 digits) — e.g. KBank Thai QR Payment
 *
 * @param qrText The decoded text from a PromptPay QR code
 * @returns PromptPayResult with id, type, and canGenerateQR flag, or null if not PromptPay
 */
export function extractPromptPayId(qrText: string): PromptPayResult | null {
  if (!qrText || qrText.length < 20) return null;

  const topLevel = parseTLV(qrText);

  // Search merchant account tags (26-51 per EMVCo spec)
  for (const entry of topLevel) {
    const tagNum = parseInt(entry.tag, 10);
    if (tagNum < 26 || tagNum > 51) continue;

    const subEntries = parseTLV(entry.value);
    const aidEntry = subEntries.find(e => e.tag === '00');
    if (!aidEntry || aidEntry.value !== PROMPTPAY_AID) continue;

    // Found PromptPay block — extract account from sub-tags 01, 02, 03
    for (const subTag of ['01', '02', '03']) {
      const accountEntry = subEntries.find(e => e.tag === subTag);
      if (!accountEntry || !accountEntry.value) continue;

      const raw = accountEntry.value;

      // Sub-tag 01: Phone number (0066XXXXXXXXX = 13 chars)
      if (subTag === '01' && raw.startsWith('0066') && raw.length === 13) {
        return {
          id: convertPhoneToThai(raw),
          type: 'phone',
          canGenerateQR: true,
        };
      }

      // Sub-tag 01 could also be a phone in local format
      if (subTag === '01' && /^0\d{9}$/.test(raw)) {
        return {
          id: raw,
          type: 'phone',
          canGenerateQR: true,
        };
      }

      // Sub-tag 02: National ID (13 digits)
      if (subTag === '02' && /^\d{13}$/.test(raw)) {
        return {
          id: raw,
          type: 'national_id',
          canGenerateQR: true,
        };
      }

      // Sub-tag 03: E-Wallet / Bank reference (15 digits)
      // Used by KBank and other Thai banks for PromptPay
      if (subTag === '03' && /^\d{15}$/.test(raw)) {
        return {
          id: raw,
          type: 'ewallet',
          canGenerateQR: false, // promptpay.io doesn't support 15-digit IDs
        };
      }
    }
  }

  return null;
}
