'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

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
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  // Validate time
  if (input.endTime <= input.startTime) {
    return { success: false, error: t('endTimeAfterStart') };
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
    return { success: false, error: t('productNotFound') };
  }

  if (product.type !== 'booking' && product.type !== 'live') {
    return { success: false, error: t('productNotSupportBooking') };
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
      return { success: false, error: t('slotAlreadyExists') };
    }
    return { success: false, error: t('cannotCreateSlot') };
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
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
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
    return { success: false, error: t('productNotSupportSlot') };
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
    return { success: false, error: t('cannotCreateSlot') };
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
    return { success: false, error: t('cannotCreateSlot') };
  }

  revalidatePath(`/dashboard/products/${input.productId}/edit`);
  return { success: true };
}

export async function deleteBookingSlot(slotId: string): Promise<SlotResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
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
    return { success: false, error: t('slotNotFound') };
  }

  if (slot.is_booked) {
    return { success: false, error: t('cannotDeleteBookedSlot') };
  }

  const { error } = await supabase
    .from('booking_slots')
    .delete()
    .eq('id', slotId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Delete slot error:', error);
    return { success: false, error: t('cannotDeleteSlot') };
  }

  revalidatePath(`/dashboard/products/${slot.product_id}/edit`);
  return { success: true };
}

export async function updateBookingSlot(
  slotId: string,
  updates: { startTime?: string; endTime?: string; maxBookings?: number }
): Promise<SlotResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get slot to verify ownership and check booking status
  const { data: slot } = await supabase
    .from('booking_slots')
    .select('product_id, current_bookings')
    .eq('id', slotId)
    .eq('creator_id', creatorId)
    .single();

  if (!slot) {
    return { success: false, error: t('slotNotFound') };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
  if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
  if (updates.maxBookings !== undefined) {
    // Can't set max_bookings below current_bookings
    if (updates.maxBookings < slot.current_bookings) {
      return { success: false, error: t('cannotSetSeatsBelow', { count: slot.current_bookings }) };
    }
    updateData.max_bookings = updates.maxBookings;
  }

  // Validate time range if both provided
  const newStart = updates.startTime;
  const newEnd = updates.endTime;
  if (newStart && newEnd && newEnd <= newStart) {
    return { success: false, error: t('endTimeAfterStart') };
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: t('noUpdateData') };
  }

  const { error } = await supabase
    .from('booking_slots')
    .update(updateData)
    .eq('id', slotId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Update slot error:', error);
    if (error.code === '23505') {
      return { success: false, error: t('slotTimeDuplicate') };
    }
    return { success: false, error: t('cannotUpdateSlot') };
  }

  revalidatePath(`/dashboard/products/${slot.product_id}/edit`);
  return { success: true };
}

export async function bulkDeleteSlots(slotIds: string[]): Promise<SlotResult & { deletedCount?: number }> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  if (slotIds.length === 0) {
    return { success: false, error: t('pleaseSelectSlots') };
  }

  const supabase = await createClient();

  // Get slots to check ownership and booking status, and get product_id
  const { data: slotsData } = await supabase
    .from('booking_slots')
    .select('id, product_id, current_bookings')
    .in('id', slotIds)
    .eq('creator_id', creatorId);

  if (!slotsData || slotsData.length === 0) {
    return { success: false, error: t('slotNotFound') };
  }

  // Filter out booked slots
  const bookedSlots = slotsData.filter(s => s.current_bookings > 0);
  const deletableIds = slotsData.filter(s => s.current_bookings === 0).map(s => s.id);

  if (deletableIds.length === 0) {
    return { success: false, error: t('cannotDeleteBookedSlots') };
  }

  const { error } = await supabase
    .from('booking_slots')
    .delete()
    .in('id', deletableIds)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Bulk delete error:', error);
    return { success: false, error: t('deleteError') };
  }

  const productId = slotsData[0].product_id;
  revalidatePath(`/dashboard/products/${productId}/edit`);

  const skipped = bookedSlots.length;
  return {
    success: true,
    deletedCount: deletableIds.length,
    error: skipped > 0 ? t('deletePartialSuccess', { deleted: deletableIds.length, skipped }) : undefined,
  };
}

export async function bulkToggleSlots(slotIds: string[], isAvailable: boolean): Promise<SlotResult & { updatedCount?: number }> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  if (slotIds.length === 0) {
    return { success: false, error: t('pleaseSelectSlots') };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: slotsData } = await supabase
    .from('booking_slots')
    .select('id, product_id')
    .in('id', slotIds)
    .eq('creator_id', creatorId);

  if (!slotsData || slotsData.length === 0) {
    return { success: false, error: t('slotNotFound') };
  }

  const validIds = slotsData.map(s => s.id);

  const { error } = await supabase
    .from('booking_slots')
    .update({ is_available: isAvailable })
    .in('id', validIds)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Bulk toggle error:', error);
    return { success: false, error: t('generalError') };
  }

  const productId = slotsData[0].product_id;
  revalidatePath(`/dashboard/products/${productId}/edit`);
  return { success: true, updatedCount: validIds.length };
}

export async function toggleSlotAvailability(slotId: string, isAvailable: boolean): Promise<SlotResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { data: slot } = await supabase
    .from('booking_slots')
    .select('product_id')
    .eq('id', slotId)
    .eq('creator_id', creatorId)
    .single();

  if (!slot) {
    return { success: false, error: t('slotNotFound') };
  }

  const { error } = await supabase
    .from('booking_slots')
    .update({ is_available: isAvailable })
    .eq('id', slotId)
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Toggle slot error:', error);
    return { success: false, error: t('cannotToggleStatus') };
  }

  revalidatePath(`/dashboard/products/${slot.product_id}/edit`);
  return { success: true };
}

export interface RecurringSlotInput {
  productId: string;
  selectedDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // HH:MM - start of availability window
  endTime: string; // HH:MM - end of availability window
  slotDuration: number; // minutes per slot
  numberOfWeeks: number; // how many weeks ahead to generate
  maxBookings?: number;
}

export async function createRecurringSlots(input: RecurringSlotInput): Promise<SlotResult & { slotsCreated?: number }> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  if (input.selectedDays.length === 0) {
    return { success: false, error: t('pleaseSelectDays') };
  }

  if (input.numberOfWeeks < 1 || input.numberOfWeeks > 12) {
    return { success: false, error: t('weeksBetween1And12') };
  }

  if (input.endTime <= input.startTime) {
    return { success: false, error: t('endTimeAfterStart') };
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
    return { success: false, error: t('productNotSupportSlot') };
  }

  // Generate all dates for selected days of the week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + input.numberOfWeeks * 7);

  const allSlots: Array<{
    product_id: string;
    creator_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    max_bookings: number;
    current_bookings: number;
  }> = [];

  // Iterate through each day from today to endDate
  const currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.

    if (input.selectedDays.includes(dayOfWeek)) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Generate time slots for this day
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

        allSlots.push({
          product_id: input.productId,
          creator_id: creatorId,
          slot_date: dateStr,
          start_time: currentStart,
          end_time: slotEnd,
          max_bookings: input.maxBookings || 1,
          current_bookings: 0,
        });

        currentStart = slotEnd;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (allSlots.length === 0) {
    return { success: false, error: t('cannotCreateCheckSlots') };
  }

  // Insert in batches of 500 to avoid payload limits
  const batchSize = 500;
  let totalCreated = 0;

  for (let i = 0; i < allSlots.length; i += batchSize) {
    const batch = allSlots.slice(i, i + batchSize);
    const { error } = await supabase
      .from('booking_slots')
      .upsert(batch, {
        onConflict: 'product_id,slot_date,start_time',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Create recurring slots error:', error);
      return { success: false, error: t('partialSlotCreation', { count: totalCreated }) };
    }
    totalCreated += batch.length;
  }

  revalidatePath(`/dashboard/products/${input.productId}/edit`);
  return { success: true, slotsCreated: totalCreated };
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
