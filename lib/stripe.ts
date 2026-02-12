import Stripe from 'stripe';

// Server-side Stripe instance
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is not configured');
}
export const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Helper to format price for Stripe (convert to smallest currency unit)
export function formatAmountForStripe(amount: number, currency: string = 'thb'): number {
  // THB uses satang as the smallest unit (1 THB = 100 satang)
  // Stripe expects amount in satang, so multiply by 100
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
