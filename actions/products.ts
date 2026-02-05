'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export async function createProduct(data: ProductInput): Promise<ProductResult> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

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
    return { success: false, error: 'ไม่สามารถสร้างสินค้าได้' };
  }

  revalidatePath('/dashboard/products');
  return { success: true, productId: product.id };
}

export async function updateProduct(productId: string, data: ProductInput): Promise<ProductResult> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่สามารถแก้ไขสินค้าได้' };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ProductResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Delete product error:', error);
    return { success: false, error: 'ไม่สามารถลบสินค้าได้' };
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function toggleProductPublish(productId: string, isPublished: boolean): Promise<ProductResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ is_published: isPublished })
    .eq('id', productId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Toggle publish error:', error);
    return { success: false, error: 'ไม่สามารถเปลี่ยนสถานะได้' };
  }

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function uploadProductImage(productId: string, formData: FormData): Promise<ProductResult> {
  try {
    const file = formData.get('image') as File;
    
    console.log('Upload attempt:', { 
      productId, 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type 
    });
    
    if (!file || file.size === 0) {
      return { success: false, error: 'กรุณาเลือกไฟล์' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' };
    }

    // Increase limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { success: false, error: `ไฟล์ใหญ่เกินไป (${sizeMB}MB) กรุณาเลือกไฟล์ไม่เกิน 10MB` };
    }

    const creatorId = await getCreatorId();
    console.log('Creator ID:', creatorId);
    
    if (!creatorId) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
      return { success: false, error: `ไม่พบสินค้า (${productError?.message || 'unknown'})` };
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
        return { success: false, error: 'Storage ยังไม่ถูกตั้งค่า กรุณาสร้าง bucket "products"' };
      }
      if (uploadError.message?.includes('Policy') || uploadError.message?.includes('policy')) {
        return { success: false, error: 'ไม่มีสิทธิ์อัปโหลด กรุณาตรวจสอบ Storage Policy' };
      }
      return { success: false, error: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` };
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
      return { success: false, error: 'ไม่สามารถบันทึกรูปได้' };
    }

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${productId}/edit`);
    return { success: true };
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return { success: false, error: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

// Save digital file info to database (called after client-side upload)
export async function saveDigitalFileInfo(
  productId: string, 
  fileInfo: { url: string; name: string; path: string }
): Promise<ProductResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่พบสินค้า' };
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
    return { success: false, error: 'ไม่สามารถบันทึกข้อมูลไฟล์ได้' };
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
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่พบสินค้า' };
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
    return { success: false, error: 'ไม่สามารถบันทึกได้' };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function deleteDigitalFile(productId: string): Promise<ProductResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่พบสินค้า' };
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
    return { success: false, error: 'ไม่สามารถลบไฟล์ได้' };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true };
}

export async function updateBookingDuration(productId: string, durationMinutes: number): Promise<ProductResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่พบสินค้า' };
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
    return { success: false, error: 'ไม่สามารถบันทึกได้' };
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
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
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
    return { success: false, error: 'ไม่พบสินค้า' };
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
    return { success: false, error: 'ไม่สามารถบันทึกได้' };
  }

  return { success: true };
}
