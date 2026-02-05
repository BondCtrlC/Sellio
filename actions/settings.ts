'use server';

import { createClient } from '@/lib/supabase/server';
import { settingsSchema, type SettingsInput } from '@/lib/validations/settings';
import { revalidatePath } from 'next/cache';

export type SettingsResult = {
  success: boolean;
  error?: string;
};

export async function updateSettings(data: SettingsInput): Promise<SettingsResult> {
  // Validate input
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Update creator profile
  const { error } = await supabase
    .from('creators')
    .update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio || null,
      promptpay_id: parsed.data.promptpay_phone || null,
      promptpay_name: parsed.data.promptpay_name || null,
      contact_phone: parsed.data.contact_phone || null,
      contact_line: parsed.data.contact_line || null,
      contact_ig: parsed.data.contact_ig || null,
      contact_email: parsed.data.contact_email || null,
      is_published: parsed.data.is_published,
      // SEO settings
      seo_title: parsed.data.seo_title || null,
      seo_description: parsed.data.seo_description || null,
      seo_keywords: parsed.data.seo_keywords || null,
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Update settings error:', error);
    return { success: false, error: 'ไม่สามารถบันทึกข้อมูลได้' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}

export async function updateAvatar(formData: FormData): Promise<SettingsResult> {
  const file = formData.get('avatar') as File;
  
  if (!file || file.size === 0) {
    return { success: false, error: 'กรุณาเลือกไฟล์' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'ไฟล์ต้องไม่เกิน 5MB' };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Upload file
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error('Upload avatar error:', uploadError);
    return { success: false, error: 'ไม่สามารถอัปโหลดรูปได้' };
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
    return { success: false, error: 'ไม่สามารถบันทึกรูปได้' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}
