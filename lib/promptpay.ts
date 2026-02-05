/**
 * Generate PromptPay QR Code URL
 * Uses promptpay.io API to generate QR code images
 */

export function generatePromptPayQR(promptPayId: string, amount?: number): string {
  // Clean the ID (remove dashes, spaces)
  const cleanId = promptPayId.replace(/[-\s]/g, '');
  
  // Use promptpay.io API for QR generation
  // Format: https://promptpay.io/{phone_or_id}/{amount}.png
  const baseUrl = 'https://promptpay.io';
  
  if (amount && amount > 0) {
    return `${baseUrl}/${cleanId}/${amount}.png`;
  }
  
  return `${baseUrl}/${cleanId}.png`;
}

/**
 * Validate Thai phone number format (for PromptPay)
 */
export function isValidPromptPayId(id: string): boolean {
  const cleanId = id.replace(/[-\s]/g, '');
  
  // Check for phone number format (10 digits starting with 0)
  if (/^0[0-9]{9}$/.test(cleanId)) {
    return true;
  }
  
  // Check for national ID format (13 digits)
  if (/^[0-9]{13}$/.test(cleanId)) {
    return true;
  }
  
  // Check for e-wallet ID format
  if (/^[0-9]{15}$/.test(cleanId)) {
    return true;
  }
  
  return false;
}

/**
 * Format PromptPay ID for display
 */
export function formatPromptPayId(id: string): string {
  const cleanId = id.replace(/[-\s]/g, '');
  
  // Phone number: 0XX-XXX-XXXX
  if (cleanId.length === 10) {
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6)}`;
  }
  
  // National ID: X-XXXX-XXXXX-XX-X
  if (cleanId.length === 13) {
    return `${cleanId.slice(0, 1)}-${cleanId.slice(1, 5)}-${cleanId.slice(5, 10)}-${cleanId.slice(10, 12)}-${cleanId.slice(12)}`;
  }
  
  return cleanId;
}
