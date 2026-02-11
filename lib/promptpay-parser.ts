/**
 * EMVCo QR Code TLV Parser for Thai PromptPay
 *
 * Thai PromptPay QR codes follow the EMVCo QR Code Specification.
 * Data is encoded as TLV (Tag-Length-Value) entries:
 *   - Tag: 2 chars (e.g. "29")
 *   - Length: 2 chars (e.g. "37" = 37 chars of value)
 *   - Value: {length} chars (may contain nested TLV)
 *
 * PromptPay data lives in tag 29 or 30, identified by
 * AID sub-tag 00 = "A000000677010111".
 *
 * The account identifier is in sub-tag 01 (phone), 02 (national ID),
 * or 03 (e-wallet).
 *
 * Phone format in QR: 0066XXXXXXXXX (13 chars)
 * Converted to Thai format: 0XXXXXXXXX (10 chars)
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
 * Extract the PromptPay ID from an EMVCo QR code string.
 *
 * @param qrText The decoded text from a PromptPay QR code
 * @returns The PromptPay ID (phone in 0XXXXXXXXX format, or 13-digit national ID),
 *          or null if not a valid PromptPay QR.
 */
export function extractPromptPayId(qrText: string): string | null {
  if (!qrText || qrText.length < 20) return null;

  const topLevel = parseTLV(qrText);

  // Search tags 29 and 30 for PromptPay merchant data
  for (const entry of topLevel) {
    if (entry.tag !== '29' && entry.tag !== '30') continue;

    const subEntries = parseTLV(entry.value);
    
    // Check if this merchant block contains the PromptPay AID
    const aidEntry = subEntries.find(e => e.tag === '00');
    if (!aidEntry || aidEntry.value !== PROMPTPAY_AID) continue;

    // Found PromptPay block — extract account identifier
    // Sub-tag 01 = phone/national ID, 02 = national ID, 03 = e-wallet
    for (const subTag of ['01', '02', '03']) {
      const accountEntry = subEntries.find(e => e.tag === subTag);
      if (accountEntry && accountEntry.value) {
        const raw = accountEntry.value;

        // Phone number (13 chars starting with 0066)
        if (raw.startsWith('0066') && raw.length === 13) {
          return convertPhoneToThai(raw);
        }

        // National ID (13 digits)
        if (/^\d{13}$/.test(raw)) {
          return raw;
        }

        // E-wallet (15 digits)
        if (/^\d{15}$/.test(raw)) {
          return raw;
        }

        // Fallback: return as-is if it looks numeric
        if (/^\d+$/.test(raw)) {
          return raw;
        }
      }
    }
  }

  return null;
}
