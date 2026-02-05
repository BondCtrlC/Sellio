import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Helper to format price for Stripe (convert to smallest currency unit)
export function formatAmountForStripe(amount: number, currency: string = 'thb'): number {
  // THB doesn't have decimal places in Stripe (1 THB = 100 satang, but Stripe uses THB directly)
  // For THB, Stripe expects the amount in the smallest unit (satang), so multiply by 100
  const currenciesWithoutDecimals = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (currenciesWithoutDecimals.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  
  // Most currencies need to be multiplied by 100
  return Math.round(amount * 100);
}

// Helper to format Stripe amount back to display amount
export function formatStripeAmountToDisplay(amount: number, currency: string = 'thb'): number {
  const currenciesWithoutDecimals = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  
  if (currenciesWithoutDecimals.includes(currency.toLowerCase())) {
    return amount;
  }
  
  return amount / 100;
}
