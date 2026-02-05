'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type SlotResult = {
  success: boolean;
  error?: string;
  slotId?: string;
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

export interface CreateSlotInput {
  productId: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  maxBookings?: number; // จำนวนที่นั่งสูงสุด (default: 1)
}

export async function createBookingSlot(input: CreateSlotInput): Promise<SlotResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Validate time
  if (input.endTime <= input.startTime) {
    return { success: false, error: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' };
  }

  const supabase = await createClient();

  // Check if product belongs to creator and is booking type
  const { data: product } = await supabase
    .from('products')
    .select('id, type')
    .eq('id', input.productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product) {
    return { success: false, error: 'ไม่พบสินค้า' };
  }

  if (product.type !== 'booking' && product.type !== 'live') {
    return { success: false, error: 'สินค้านี้ไม่รองรับการจอง Slot' };
  }

  // Create slot
  const { data: slot, error } = await supabase
    .from('booking_slots')
    .insert({
      product_id: input.productId,
      creator_id: creatorId,
      slot_date: input.slotDate,
      start_time: input.startTime,
      end_time: input.endTime,
      max_bookings: input.maxBookings || 1,
      current_bookings: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create slot error:', error);
    if (error.code === '23505') {
      return { success: false, error: 'มี slot นี้อยู่แล้ว' };
    }
    return { success: false, error: 'ไม่สามารถสร้าง slot ได้' };
  }

  revalidatePath(`/dashboard/products/${input.productId}/edit`);
  return { success: true, slotId: slot.id };
}

export async function createMultipleSlots(input: {
  productId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  slotDuration: number; // minutes
  maxBookings?: number; // จำนวนที่นั่งสูงสุด (default: 1)
}): Promise<SlotResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

  // Check if product belongs to creator
  const { data: product } = await supabase
    .from('products')
    .select('id, type')
    .eq('id', input.productId)
    .eq('creator_id', creatorId)
    .single();

  if (!product || (product.type !== 'booking' && product.type !== 'live')) {
    return { success: false, error: 'ไม่พบสินค้าหรือไม่รองรับการจอง Slot' };
  }

  // Generate slots
  const slots = [];
  let currentStart = input.startTime;
  
  while (currentStart < input.endTime) {
    const [hours, minutes] = currentStart.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + input.slotDuration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const slotEnd = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Don't exceed the end time
    if (slotEnd > input.endTime) break;

    slots.push({
      product_id: input.productId,
      creator_id: creatorId,
      slot_date: input.slotDate,
      start_time: currentStart,
      end_time: slotEnd,
      max_bookings: input.maxBookings || 1,
      current_bookings: 0,
    });

    currentStart = slotEnd;
  }

  if (slots.length === 0) {
    return { success: false, error: 'ไม่สามารถสร้าง slot ได้' };
  }

  // Insert all slots (ignore duplicates)
  const { error } = await supabase
    .from('booking_slots')
    .upsert(slots, { 
      onConflict: 'product_id,slot_date,start_time',
      ignoreDuplicates: true 
    });

  if (error) {
    console.error('Create multiple slots error:', error);
    return { success: false, error: 'ไม่สามารถสร้าง slot ได้' };
  }

  revalidatePath(`/dashboard/products/${input.productId}/edit`);
  return { success: true };
}

export async function deleteBookingSlot(slotId: string): Promise<SlotResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

  // Get slot to find product_id for revalidation
  const { data: slot } = await supabase
    .from('booking_slots')
    .select('product_id, is_booked')
    .eq('id', slotId)
    .eq('creator_id', creatorId)
    .single();

  if (!slot) {
    return { success: false, error: 'ไม่พบ slot' };
  }

  if (slot.is_booked) {
    return { success: false, error: 'ไม่สามารถลบ slot ที่มีการจองแล้ว' };
  }

  const { error } = await supabase
    .from('booking_slots')
    .delete()
    .eq('id', slotId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Delete slot error:', error);
    return { success: false, error: 'ไม่สามารถลบ slot ได้' };
  }

  revalidatePath(`/dashboard/products/${slot.product_id}/edit`);
  return { success: true };
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean): Promise<SlotResult> {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  const supabase = await createClient();

  const { data: slot } = await supabase
    .from('booking_slots')
    .select('product_id')
    .eq('id', slotId)
    .eq('creator_id', creatorId)
    .single();

  if (!slot) {
    return { success: false, error: 'ไม่พบ slot' };
  }

  const { error } = await supabase
    .from('booking_slots')
    .update({ is_available: isAvailable })
    .eq('id', slotId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Toggle slot error:', error);
    return { success: false, error: 'ไม่สามารถเปลี่ยนสถานะได้' };
  }

  revalidatePath(`/dashboard/products/${slot.product_id}/edit`);
  return { success: true };
}

export async function getProductSlots(productId: string) {
  const supabase = await createClient();
  
  const { data: slots } = await supabase
    .from('booking_slots')
    .select('*')
    .eq('product_id', productId)
    .gte('slot_date', new Date().toISOString().split('T')[0]) // Only future slots
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return slots || [];
}
