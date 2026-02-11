'use server';

import { createClient } from '@/lib/supabase/server';
import { settingsSchema, type SettingsInput } from '@/lib/validations/settings';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { extractPromptPayId } from '@/lib/promptpay-parser';

export type SettingsResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
};

export type QRUploadResult = {
  success: boolean;
  error?: string;
  promptpayId?: string;
};

export async function updateSettings(data: SettingsInput): Promise<SettingsResult> {
  const t = await getTranslations('ServerActions');

  // Validate input
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin'), errorCode: 'AUTH_REQUIRED' };
  }

  // Get current creator to check if username changed
  const { data: currentCreator } = await supabase
    .from('creators')
    .select('username')
    .eq('user_id', user.id)
    .single();

  const newUsername = parsed.data.username.toLowerCase();
  const oldUsername = currentCreator?.username;

  // If username changed, check uniqueness
  if (newUsername !== oldUsername) {
    const { data: existingUser } = await supabase
      .from('creators')
      .select('username')
      .eq('username', newUsername)
      .single();

    if (existingUser) {
      return { success: false, error: t('usernameAlreadyUsedChooseOther') };
    }
  }

  // Enforce contact info before publishing
  if (parsed.data.is_published) {
    const hasContact = !!(
      parsed.data.contact_phone ||
      parsed.data.contact_line ||
      parsed.data.contact_ig ||
      parsed.data.contact_email
    );
    if (!hasContact) {
      return { 
        success: false, 
        error: t('pleaseAddContact') 
      };
    }
  }

  // Update creator profile
  const { error } = await supabase
    .from('creators')
    .update({
      username: newUsername,
      display_name: parsed.data.display_name,
      bio: parsed.data.bio || null,
      promptpay_id: parsed.data.promptpay_phone || null,
      promptpay_name: parsed.data.promptpay_name || null,
      bank_name: parsed.data.bank_name || null,
      bank_account_number: parsed.data.bank_account_number || null,
      bank_account_name: parsed.data.bank_account_name || null,
      contact_phone: parsed.data.contact_phone || null,
      contact_line: parsed.data.contact_line || null,
      contact_ig: parsed.data.contact_ig || null,
      contact_email: parsed.data.contact_email || null,
      is_published: parsed.data.is_published,
      // SEO settings
      seo_title: parsed.data.seo_title || null,
      seo_description: parsed.data.seo_description || null,
      seo_keywords: parsed.data.seo_keywords || null,
      // Email Notifications
      notification_email: parsed.data.notification_email || null,
      // Language
      store_language: parsed.data.store_language || 'th',
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Update settings error:', error);
    if (error.code === '23505') {
      return { success: false, error: t('usernameAlreadyUsedChooseOther') };
    }
    return { success: false, error: t('cannotSaveData') };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  // Revalidate old and new store pages
  if (oldUsername && newUsername !== oldUsername) {
    revalidatePath(`/u/${oldUsername}`);
  }
  revalidatePath(`/u/${newUsername}`);
  
  return { success: true };
}

export async function updateAvatar(formData: FormData): Promise<SettingsResult> {
  const t = await getTranslations('ServerActions');
  const file = formData.get('avatar') as File;
  
  if (!file || file.size === 0) {
    return { success: false, error: t('pleaseSelectFile') };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: t('pleaseSelectImageFile') };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: t('fileMax5MB') };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin'), errorCode: 'AUTH_REQUIRED' };
  }

  // Upload file
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error('Upload avatar error:', uploadError);
    return { success: false, error: t('cannotUploadImage') };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update creator profile with avatar URL
  const { error: updateError } = await supabase
    .from('creators')
    .update({ avatar_url: publicUrl })
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Update avatar URL error:', updateError);
    return { success: false, error: t('cannotSaveImage') };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}

// ============================================
// UPLOAD PROMPTPAY QR CODE
// ============================================
export async function uploadPromptPayQR(formData: FormData): Promise<QRUploadResult> {
  const t = await getTranslations('ServerActions');
  const file = formData.get('qr_image') as File;

  if (!file || file.size === 0) {
    return { success: false, error: t('pleaseSelectFile') };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: t('pleaseSelectImageFile') };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: t('fileMax5MB') };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: t('pleaseLogin') };
  }

  try {
    // Convert image to raw RGBA pixels using sharp
    const sharp = (await import('sharp')).default;
    const jsQR = (await import('jsqr')).default;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: pixels, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Decode QR code from pixels
    const qrResult = jsQR(
      new Uint8ClampedArray(pixels.buffer, pixels.byteOffset, pixels.byteLength),
      info.width,
      info.height
    );

    if (!qrResult || !qrResult.data) {
      return { success: false, error: t('qrDecodeFailed') };
    }

    // Parse EMVCo TLV to extract PromptPay ID
    const promptpayId = extractPromptPayId(qrResult.data);

    if (!promptpayId) {
      return { success: false, error: t('qrNotPromptPay') };
    }

    // Upload QR image to storage
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}/promptpay-qr.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload QR error:', uploadError);
      return { success: false, error: t('cannotUploadImage') };
    }

    // Get public URL (add cache buster to force refresh)
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

    // Update creator: set decoded promptpay_id + image URL
    const { error: updateError } = await supabase
      .from('creators')
      .update({
        promptpay_id: promptpayId,
        promptpay_qr_url: urlWithCacheBust,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update QR URL error:', updateError);
      return { success: false, error: t('cannotSaveData') };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return { success: true, promptpayId };
  } catch (err) {
    console.error('QR decode error:', err);
    return { success: false, error: t('qrDecodeFailed') };
  }
}
