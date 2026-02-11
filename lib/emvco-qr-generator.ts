/**
 * EMVCo QR Code Payload Generator for Thai PromptPay
 *
 * Takes a raw EMVCo QR payload string (decoded from a PromptPay QR image)
 * and injects a transaction amount, producing a new payload that can be
 * rendered as a QR code with the amount pre-filled.
 *
 * EMVCo TLV format:
 *   Tag (2 chars) + Length (2 chars, zero-padded) + Value (variable)
 *
 * Key tags:
 *   00 = Payload Format Indicator ("01")
 *   01 = Point of Initiation Method ("11" = static, "12" = dynamic/one-time)
 *   26-51 = Merchant Account Information (contains PromptPay data)
 *   53 = Transaction Currency ("764" = THB)
 *   54 = Transaction Amount (e.g. "100.00")
 *   58 = Country Code ("TH")
 *   63 = CRC (4-char hex, CRC-16/CCITT-FALSE)
 */

interface TLVEntry {
  tag: string;
  value: string;
}

/**
 * Parse an EMVCo TLV string into entries.
 */
function parseTLV(data: string): TLVEntry[] {
  const entries: TLVEntry[] = [];
  let pos = 0;

  while (pos + 4 <= data.length) {
    const tag = data.substring(pos, pos + 2);
    const lenStr = data.substring(pos + 2, pos + 4);
    const len = parseInt(lenStr, 10);

    if (isNaN(len) || len < 0 || pos + 4 + len > data.length) break;

    const value = data.substring(pos + 4, pos + 4 + len);
    entries.push({ tag, value });
    pos += 4 + len;
  }

  return entries;
}

/**
 * Encode a single TLV entry.
 */
function encodeTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Calculate CRC-16/CCITT-FALSE checksum.
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function crc16ccitt(data: string): string {
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Inject a transaction amount into an EMVCo QR payload.
 *
 * - Parses the existing TLV entries
 * - Changes Tag 01 (Point of Initiation) to "12" (dynamic/one-time with amount)
 * - Adds or replaces Tag 54 (Transaction Amount)
 * - Recalculates Tag 63 (CRC-16)
 *
 * @param emvcoPayload  Raw EMVCo QR text (decoded from the creator's QR image)
 * @param amount        Transaction amount in THB (e.g. 10, 150.50)
 * @returns             New EMVCo payload string with amount embedded
 */
export function injectAmount(emvcoPayload: string, amount: number): string {
  // Validate amount
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999.99) {
    throw new Error(`Invalid amount for QR generation: ${amount}`);
  }

  // Validate payload size (EMVCo payloads are typically < 500 chars)
  if (!emvcoPayload || emvcoPayload.length > 1000) {
    throw new Error('Invalid EMVCo payload size');
  }

  const entries = parseTLV(emvcoPayload);
  if (entries.length === 0) return emvcoPayload;

  // Build new payload: process entries, inject amount, skip old CRC
  const newEntries: TLVEntry[] = [];
  let hasTag54 = false;

  for (const entry of entries) {
    // Skip CRC — we'll recalculate it
    if (entry.tag === '63') continue;

    // Change Point of Initiation to "12" (dynamic with amount)
    if (entry.tag === '01') {
      newEntries.push({ tag: '01', value: '12' });
      continue;
    }

    // Replace existing amount tag
    if (entry.tag === '54') {
      hasTag54 = true;
      newEntries.push({ tag: '54', value: amount.toFixed(2) });
      continue;
    }

    newEntries.push(entry);
  }

  // If no Tag 54 existed, insert it after Tag 53 (Currency) or at the end
  if (!hasTag54) {
    const tag53Index = newEntries.findIndex(e => e.tag === '53');
    const insertIndex = tag53Index >= 0 ? tag53Index + 1 : newEntries.length;
    newEntries.splice(insertIndex, 0, { tag: '54', value: amount.toFixed(2) });
  }

  // Ensure Tag 53 (Currency = THB) exists
  if (!newEntries.some(e => e.tag === '53')) {
    const tag54Index = newEntries.findIndex(e => e.tag === '54');
    newEntries.splice(tag54Index, 0, { tag: '53', value: '764' });
  }

  // Ensure Tag 58 (Country Code = TH) exists
  if (!newEntries.some(e => e.tag === '58')) {
    newEntries.push({ tag: '58', value: 'TH' });
  }

  // Build payload without CRC
  let payload = newEntries.map(e => encodeTLV(e.tag, e.value)).join('');

  // Append CRC tag header (63 + length 04) — CRC is computed over this string
  payload += '6304';

  // Calculate and append CRC
  const crc = crc16ccitt(payload);
  payload += crc;

  return payload;
}

/**
 * Validate that a string looks like a valid EMVCo QR payload.
 * Checks for basic structure: starts with Tag 00 and ends with Tag 63 (CRC).
 */
export function isValidEmvcoPayload(data: string): boolean {
  if (!data || data.length < 20) return false;
  // Must start with Tag 00 (Payload Format Indicator)
  if (!data.startsWith('0002')) return false;
  // Must end with CRC tag (63 04 XXXX)
  if (!/6304[0-9A-Fa-f]{4}$/.test(data)) return false;
  return true;
}
