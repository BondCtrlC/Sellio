'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { canCreateProduct } from '@/lib/plan';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { PlanType } from '@/types';

export type ProductResult = {
  success: boolean;
  error?: string;
  productId?: string;
  fileUrl?: string;
};

async function getCreatorId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return creator?.id || null;
}

async function getCreatorWithPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan')
    .eq('user_id', user.id)
    .single();

  return creator || null;
}

export async function createProduct(data: ProductInput): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const creator = await getCreatorWithPlan();
  if (!creator) {
    return { success: false, error: t('pleaseLogin') };
  }

  const creatorId = creator.id;
  const plan = (creator.plan || 'free') as PlanType;
  const supabase = await createClient();

  // Check product limit for current plan
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId);

  const currentCount = count || 0;
  if (!canCreateProduct(plan, currentCount)) {
    return { 
      success: false, 
      error: t('freePlanLimit') 
    };
  }

  // Build type_config based on product type
  let typeConfig = {};
  if (parsed.data.type === 'digital') {
    typeConfig = {};
  } else if (parsed.data.type === 'booking') {
    typeConfig = {
      duration_minutes: parsed.data.duration_minutes || 60,
      location_type: parsed.data.location_type || 'online',
      location_details: parsed.data.location_details || '',
      // Online
      meeting_platform: parsed.data.meeting_platform || '',
      meeting_link: parsed.data.meeting_link || '',
      // Offline
      location_name: parsed.data.location_name || '',
      location_address: parsed.data.location_address || '',
      location_notes: parsed.data.location_notes || '',
    };
  } else if (parsed.data.type === 'link') {
    typeConfig = {
      link_url: parsed.data.link_url || '',
      link_style: parsed.data.link_style || 'button',
      link_subtitle: parsed.data.link_subtitle || '',
      link_button_text: parsed.data.link_button_text || 'Click Me!',
    };
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      creator_id: creatorId,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      price: parsed.data.price,
      is_published: parsed.data.is_published,
      type_config: typeConfig,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create product error:', error);
    return { success: false, error: t('cannotCreateProduct') };
  }

  revalidatePath('/dashboard/products');
  return { success: true, productId: product.id };
}

export async function updateProduct(productId: string, data: ProductInput): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get current product to preserve existing type_config fields (like digital file info)
  const { data: currentProduct } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  const existingConfig = (currentProduct?.type_config as Record<string, unknown>) || {};

  // Build type_config based on product type, preserving existing fields
  let newTypeConfig: Record<string, unknown> = {};
  if (parsed.data.type === 'digital') {
    newTypeConfig = {};
  } else if (parsed.data.type === 'booking') {
    newTypeConfig = {
      duration_minutes: parsed.data.duration_minutes || 60,
      location_type: parsed.data.location_type || 'online',
      location_details: parsed.data.location_details || '',
      // Online
      meeting_platform: parsed.data.meeting_platform || '',
      meeting_link: parsed.data.meeting_link || '',
      // Offline
      location_name: parsed.data.location_name || '',
      location_address: parsed.data.location_address || '',
      location_notes: parsed.data.location_notes || '',
    };
  } else if (parsed.data.type === 'link') {
    newTypeConfig = {
      link_url: parsed.data.link_url || '',
      link_style: parsed.data.link_style || 'button',
      link_subtitle: parsed.data.link_subtitle || '',
      link_button_text: parsed.data.link_button_text || 'Click Me!',
    };
  }

  // Merge with existing config to preserve digital file info, etc.
  const mergedTypeConfig = {
    ...existingConfig,
    ...newTypeConfig,
  };

  const { error } = await supabase
    .from('products')
    .update({
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || null,
      price: parsed.data.price,
      is_published: parsed.data.is_published,
      type_config: mergedTypeConfig,
    })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Update product error:', error);
    return { success: false, error: t('cannotEditProduct') };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Check if product has any orders (can't delete if it does)
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (orderCount && orderCount > 0) {
    return { 
      success: false, 
      error: t('productHasOrders', { count: orderCount }) 
    };
  }

  // Delete related records first (store_items, booking_slots)
  await supabase
    .from('store_items')
    .delete()
    .eq('product_id', productId);

  await supabase
    .from('booking_slots')
    .delete()
    .eq('product_id', productId);

  // Now delete the product
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Delete product error:', error);
    return { success: false, error: t('cannotDeleteProduct', { error: error.message }) };
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function updateProductBookingSettings(
  productId: string,
  settings: { minimum_advance_hours?: number; duration_minutes?: number; buffer_minutes?: number }
): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get current product to preserve existing type_config fields
  const { data: currentProduct } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!currentProduct) {
    return { success: false, error: t('productNotFound') };
  }

  const existingConfig = (currentProduct.type_config as Record<string, unknown>) || {};

  // Merge new settings with existing config
  const updatedConfig = {
    ...existingConfig,
    ...(settings.minimum_advance_hours !== undefined && { minimum_advance_hours: settings.minimum_advance_hours }),
    ...(settings.duration_minutes !== undefined && { duration_minutes: settings.duration_minutes }),
    ...(settings.buffer_minutes !== undefined && { buffer_minutes: settings.buffer_minutes }),
  };

  const { error } = await supabase
    .from('products')
    .update({ type_config: updatedConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Update booking settings error:', error);
    return { success: false, error: t('cannotSaveSettings') };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function toggleProductPublish(productId: string, isPublished: boolean): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ is_published: isPublished })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Toggle publish error:', error);
    return { success: false, error: t('cannotToggleStatus') };
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function uploadProductImage(productId: string, formData: FormData): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  try {
    const file = formData.get('image') as File;
    
    console.log('Upload attempt:', { 
      productId, 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type 
    });
    
    if (!file || file.size === 0) {
      return { success: false, error: t('pleaseSelectFile') };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: t('pleaseSelectImageFile') };
    }

    // Increase limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { success: false, error: t('fileTooLarge', { size: sizeMB }) };
    }

    const creatorId = await getCreatorId();
    console.log('Creator ID:', creatorId);
    
    if (!creatorId) {
      return { success: false, error: t('pleaseLogin') };
    }

    const supabase = await createClient();

    // Check if product belongs to creator
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('creator_id', creatorId)
      .single();

    console.log('Product check:', { product, productError });

    if (!product) {
      return { success: false, error: t('productNotFoundDetail', { error: productError?.message || 'unknown' }) };
    }

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${creatorId}/${productId}_${Date.now()}.${fileExt}`;

    console.log('Uploading to:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, uint8Array, { 
        upsert: true,
        contentType: file.type 
      });

    console.log('Upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      // More specific error messages
      if (uploadError.message?.includes('Bucket not found')) {
        return { success: false, error: t('storageNotSetup') };
      }
      if (uploadError.message?.includes('Policy') || uploadError.message?.includes('policy')) {
        return { success: false, error: t('noUploadPermission') };
      }
      return { success: false, error: t('uploadFailed', { error: uploadError.message }) };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId)
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Update image URL error:', updateError);
      return { success: false, error: t('cannotSaveImage') };
    }

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${productId}/edit`);
    return { success: true };
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return { success: false, error: t('errorOccurred', { error: err instanceof Error ? err.message : 'Unknown error' }) };
  }
}

// Save digital file info to database (called after client-side upload)
export async function saveDigitalFileInfo(
  productId: string, 
  fileInfo: { url: string; name: string; path: string }
): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Check if product belongs to creator and get current config
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: t('productNotFound') };
  }

  // Update product type_config with file info
  const currentConfig = (product.type_config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...currentConfig,
    delivery_type: 'file',
    digital_file_url: fileInfo.url,
    digital_file_name: fileInfo.name,
    digital_file_path: fileInfo.path,
    // Clear redirect fields when switching to file
    redirect_url: undefined,
    redirect_name: undefined,
  };

  const { error: updateError } = await supabase
    .from('products')
    .update({ type_config: updatedConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (updateError) {
    console.error('Update digital file info error:', updateError);
    return { success: false, error: t('cannotSaveFileData') };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true, fileUrl: fileInfo.url };
}

// Save redirect URL info for digital products
export async function saveDigitalRedirectInfo(
  productId: string, 
  redirectInfo: { redirect_url: string; redirect_name: string | null }
): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Check if product belongs to creator and get current config
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: t('productNotFound') };
  }

  // Update product type_config with redirect info
  const currentConfig = (product.type_config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...currentConfig,
    delivery_type: 'redirect',
    redirect_url: redirectInfo.redirect_url,
    redirect_name: redirectInfo.redirect_name,
    // Clear file fields when switching to redirect
    digital_file_url: undefined,
    digital_file_name: undefined,
    digital_file_path: undefined,
  };

  const { error: updateError } = await supabase
    .from('products')
    .update({ type_config: updatedConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (updateError) {
    console.error('Update digital redirect info error:', updateError);
    return { success: false, error: t('cannotSave') };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function deleteDigitalFile(productId: string): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get current file path
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: t('productNotFound') };
  }

  const config = (product.type_config as Record<string, unknown>) || {};
  const filePath = config.digital_file_path as string;

  // Delete file from storage
  if (filePath) {
    await supabase.storage
      .from('digital-files')
      .remove([filePath]);
  }

  // Update product type_config
  const { digital_file_url, digital_file_name, digital_file_path, ...restConfig } = config as Record<string, unknown>;
  
  const { error: updateError } = await supabase
    .from('products')
    .update({ type_config: restConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (updateError) {
    console.error('Delete digital file info error:', updateError);
    return { success: false, error: t('cannotDeleteFile') };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function updateBookingDuration(productId: string, durationMinutes: number): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get current type_config
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: t('productNotFound') };
  }

  const currentConfig = (product.type_config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...currentConfig,
    duration_minutes: durationMinutes,
  };

  const { error } = await supabase
    .from('products')
    .update({ type_config: updatedConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Update booking duration error:', error);
    return { success: false, error: t('cannotSave') };
  }

  return { success: true };
}

export interface LiveSettingsInput {
  duration_minutes: number;
  timezone: string;
  max_participants: number;
  platform: string;
}

export async function updateLiveSettings(productId: string, settings: LiveSettingsInput): Promise<ProductResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get current type_config
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: t('productNotFound') };
  }

  const currentConfig = (product.type_config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...currentConfig,
    duration_minutes: settings.duration_minutes,
    timezone: settings.timezone,
    max_participants: settings.max_participants,
    platform: settings.platform,
  };

  const { error } = await supabase
    .from('products')
    .update({ type_config: updatedConfig })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Update live settings error:', error);
    return { success: false, error: t('cannotSave') };
  }

  return { success: true };
}
