'use server';

import { createClient } from '@/lib/supabase/server';

export interface OnboardingStatus {
  hasProfile: boolean;
  hasContact: boolean;
  hasPayment: boolean;
  hasProduct: boolean;
  isPublished: boolean;
  hasNotificationEmail: boolean;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, avatar_url, promptpay_id, bank_name, bank_account_number, bank_account_name, contact_phone, contact_line, contact_ig, contact_email, is_published, notification_email')
    .eq('user_id', user.id)
    .single();

  if (!creator) return null;

  // Count products using creator.id (same as dashboard)
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  const hasContact = !!(creator.contact_phone || creator.contact_line || creator.contact_ig || creator.contact_email);
  const hasPayment = !!(creator.promptpay_id || (creator.bank_name && creator.bank_account_number && creator.bank_account_name));

  return {
    hasProfile: !!(creator.display_name && creator.avatar_url),
    hasContact,
    hasPayment,
    hasProduct: (productCount || 0) > 0,
    isPublished: creator.is_published,
    hasNotificationEmail: !!creator.notification_email,
  };
}
