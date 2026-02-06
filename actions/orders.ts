'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { checkoutSchema, type CheckoutInput } from '@/lib/validations/checkout';
import { 
  sendOrderConfirmationEmail, 
  sendPaymentRejectionEmail,
  sendNewOrderNotificationEmail,
  sendRefundNotificationEmail,
  sendBookingCancellationEmail,
  sendBookingRescheduleEmail
} from '@/lib/email';

// ============================================
// Types
// ============================================
interface CreateOrderResult {
  success: boolean;
  error?: string;
  order_id?: string;
}

interface UploadSlipResult {
  success: boolean;
  error?: string;
}

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_note: string | null;
  booking_date: string | null;
  booking_time: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    type: string;
    image_url: string | null;
  };
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    promptpay_id: string | null;
    promptpay_name: string | null;
    contact_line: string | null;
    contact_ig: string | null;
  };
  payment: {
    id: string;
    status: string;
    slip_url: string | null;
    slip_uploaded_at: string | null;
  } | null;
}

// ============================================
// CREATE ORDER
// ============================================
export async function createOrder(
  productId: string,
  creatorId: string,
  data: CheckoutInput
): Promise<CreateOrderResult> {
  // Validate input
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Get product info
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, price, type, type_config')
    .eq('id', productId)
    .eq('is_published', true)
    .single();

  if (productError || !product) {
    return { success: false, error: 'ไม่พบสินค้า' };
  }

  // Get booking slot info if provided
  let bookingDate: string | null = null;
  let bookingTime: string | null = null;

  if (data.slot_id && (product.type === 'booking' || product.type === 'live')) {
    const { data: slot, error: slotError } = await supabase
      .from('booking_slots')
      .select('id, slot_date, start_time, end_time, is_available, max_bookings, current_bookings')
      .eq('id', data.slot_id)
      .eq('product_id', productId)
      .single();

    if (slotError || !slot) {
      console.error('Slot query error:', slotError, 'slot_id:', data.slot_id, 'productId:', productId);
      return { success: false, error: 'ช่วงเวลาที่เลือกไม่พร้อมใช้งาน' };
    }

    // Check if slot is available
    if (!slot.is_available) {
      return { success: false, error: 'ช่วงเวลานี้ไม่เปิดให้จองแล้ว' };
    }

    // Check if slot is full
    const maxBookings = slot.max_bookings || 1;
    const currentBookings = slot.current_bookings || 0;
    if (currentBookings >= maxBookings) {
      return { success: false, error: 'ช่วงเวลานี้เต็มแล้ว' };
    }

    // Check minimum advance booking hours
    const typeConfig = product.type_config as { minimum_advance_hours?: number; buffer_minutes?: number } | null;
    const minAdvanceHours = typeConfig?.minimum_advance_hours || 0;
    
    if (minAdvanceHours > 0) {
      // Calculate booking datetime
      const bookingDatetime = new Date(`${slot.slot_date}T${slot.start_time}+07:00`);
      const now = new Date();
      const hoursUntilBooking = (bookingDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilBooking < minAdvanceHours) {
        return { 
          success: false, 
          error: `กรุณาจองล่วงหน้าอย่างน้อย ${minAdvanceHours} ชั่วโมง` 
        };
      }
    }

    // Check buffer time conflict
    const bufferMinutes = typeConfig?.buffer_minutes || 0;
    if (bufferMinutes > 0) {
      // Get all booked slots on the same date
      const { data: sameDaySlots } = await supabase
        .from('booking_slots')
        .select('id, start_time, end_time, current_bookings')
        .eq('product_id', productId)
        .eq('slot_date', slot.slot_date)
        .gt('current_bookings', 0)
        .neq('id', slot.id);

      if (sameDaySlots && sameDaySlots.length > 0) {
        const [slotStartH, slotStartM] = slot.start_time.split(':').map(Number);
        const slotStartMinutes = slotStartH * 60 + slotStartM;

        for (const bookedSlot of sameDaySlots) {
          const [bookedEndH, bookedEndM] = bookedSlot.end_time.split(':').map(Number);
          const bookedEndMinutes = bookedEndH * 60 + bookedEndM;
          const [bookedStartH, bookedStartM] = bookedSlot.start_time.split(':').map(Number);
          const bookedStartMinutes = bookedStartH * 60 + bookedStartM;

          if (slotStartMinutes >= bookedStartMinutes && 
              slotStartMinutes < bookedEndMinutes + bufferMinutes) {
            return { 
              success: false, 
              error: `ช่วงเวลานี้ติดกับช่วงพักระหว่างนัด กรุณาเลือกช่วงเวลาอื่น` 
            };
          }
        }
      }
    }

    bookingDate = slot.slot_date;
    bookingTime = slot.start_time;
  } else if ((product.type === 'booking' || product.type === 'live') && !data.slot_id) {
    return { success: false, error: 'กรุณาเลือกวัน/เวลาที่ต้องการจอง' };
  }

  // Calculate final amount with coupon
  const discountAmount = parsed.data.discount_amount || 0;
  const finalTotal = Math.max(0, product.price - discountAmount);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      product_id: productId,
      creator_id: creatorId,
      buyer_email: parsed.data.buyer_email,
      buyer_name: parsed.data.buyer_name,
      buyer_phone: parsed.data.buyer_phone || null,
      buyer_note: parsed.data.buyer_note || null,
      refund_promptpay: parsed.data.refund_promptpay || null,
      status: 'pending_payment',
      quantity: 1,
      unit_price: product.price,
      total: finalTotal,
      discount_amount: discountAmount,
      coupon_id: parsed.data.coupon_id || null,
      coupon_code: parsed.data.coupon_code || null,
      booking_date: bookingDate,
      booking_time: bookingTime,
      // Order expires in 24 hours if not paid
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Create order error:', orderError);
    return { success: false, error: 'ไม่สามารถสร้างคำสั่งซื้อได้' };
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      amount: finalTotal,
      status: 'pending',
    });

  if (paymentError) {
    console.error('Create payment error:', paymentError);
    // Rollback order
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, error: 'ไม่สามารถสร้างรายการชำระเงินได้' };
  }

  // Record coupon usage if applicable
  if (parsed.data.coupon_id && discountAmount > 0) {
    await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: parsed.data.coupon_id,
        order_id: order.id,
        buyer_email: parsed.data.buyer_email.toLowerCase(),
        discount_amount: discountAmount,
      });
  }

  // Update booking slot - increment current_bookings
  if (data.slot_id) {
    // Get current bookings count and increment
    const { data: slotData } = await supabase
      .from('booking_slots')
      .select('current_bookings, max_bookings')
      .eq('id', data.slot_id)
      .single();
    
    if (slotData) {
      const newCount = (slotData.current_bookings || 0) + 1;
      await supabase
        .from('booking_slots')
        .update({ 
          current_bookings: newCount,
          // Set is_booked to true if full
          is_booked: newCount >= (slotData.max_bookings || 1)
        })
        .eq('id', data.slot_id);
    }
  }

  // Create fulfillment immediately for booking/live products
  // This allows creator to fill in meeting details before confirming payment
  if (product.type === 'booking' || product.type === 'live') {
    const typeConfig = (product.type_config as Record<string, unknown>) || {};
    
    const fulfillmentType = 'booking_details';
    // Pre-fill with data from product settings (if creator already set it up)
    const locationType = (typeConfig.location_type as string) || 'online';
    const fulfillmentContent = {
      meeting_type: locationType,
      meeting_url: (typeConfig.meeting_link as string) || '',
      meeting_platform: (typeConfig.meeting_platform as string) || '',
      location: (typeConfig.location_address as string) || '',
      location_name: (typeConfig.location_name as string) || '',
      location_notes: (typeConfig.location_notes as string) || '',
      notes: '',
    };

    const { error: fulfillmentError } = await supabase
      .from('fulfillments')
      .insert({
        order_id: order.id,
        type: fulfillmentType,
        content: fulfillmentContent,
      });

    if (fulfillmentError) {
      console.error('Create fulfillment error:', fulfillmentError);
    }
  }

  return { success: true, order_id: order.id };
}

// ============================================
// GET ORDER BY ID (for checkout/payment page)
// ============================================
export async function getOrderById(orderId: string): Promise<OrderDetails | null> {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_note,
      booking_date,
      booking_time,
      created_at,
      product:products(
        id,
        title,
        type,
        image_url
      ),
      creator:creators(
        id,
        username,
        display_name,
        promptpay_id,
        promptpay_name,
        bank_name,
        bank_account_number,
        bank_account_name,
        contact_line,
        contact_ig
      ),
      payment:payments(
        id,
        status,
        slip_url,
        slip_uploaded_at
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error('Get order error:', error);
    return null;
  }

  // Transform the result
  return {
    ...order,
    product: Array.isArray(order.product) ? order.product[0] : order.product,
    creator: Array.isArray(order.creator) ? order.creator[0] : order.creator,
    payment: Array.isArray(order.payment) ? order.payment[0] : order.payment,
  } as OrderDetails;
}

// ============================================
// UPLOAD SLIP
// ============================================
export async function uploadSlip(
  orderId: string,
  formData: FormData
): Promise<UploadSlipResult> {
  const supabase = await createClient();

  const file = formData.get('slip') as File;
  if (!file || file.size === 0) {
    return { success: false, error: 'กรุณาอัพโหลดสลิป' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'รองรับเฉพาะไฟล์ภาพ (JPG, PNG, WebP)' };
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' };
  }

  // Get order to verify it exists and is pending payment
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, expires_at')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  // Check if order has expired
  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    // Auto-cancel expired order
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('status', 'pending_payment');
    return { success: false, error: 'คำสั่งซื้อนี้หมดอายุแล้ว กรุณาสั่งซื้อใหม่' };
  }

  if (order.status !== 'pending_payment') {
    return { success: false, error: 'คำสั่งซื้อนี้ไม่สามารถอัพโหลดสลิปได้' };
  }

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${orderId}-${Date.now()}.${fileExt}`;
  const filePath = `slips/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('payments')
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    // More specific error message
    if (uploadError.message?.includes('bucket')) {
      return { success: false, error: 'ยังไม่ได้ตั้งค่า Storage กรุณารัน migration 006_payment_storage.sql' };
    }
    return { success: false, error: `ไม่สามารถอัพโหลดสลิปได้: ${uploadError.message}` };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('payments')
    .getPublicUrl(filePath);

  // Update payment record
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      slip_url: publicUrl,
      slip_uploaded_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  if (updateError) {
    console.error('Update payment error:', updateError);
    return { success: false, error: 'ไม่สามารถบันทึกสลิปได้' };
  }

  // Update order status to pending_confirmation (always require manual confirmation)
  await supabase
    .from('orders')
    .update({ status: 'pending_confirmation' })
    .eq('id', orderId);

  revalidatePath(`/checkout/${orderId}`);
  
  return { success: true };
}

// ============================================
// GET ORDERS FOR CREATOR (Dashboard)
// ============================================
export async function getCreatorOrders(status?: string) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ', orders: [] };
  }

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator', orders: [] };
  }

  // Build query
  let query = supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_note,
      refund_promptpay,
      booking_date,
      booking_time,
      cancel_reason,
      created_at,
      product:products(
        id,
        title,
        type,
        image_url
      ),
      payment:payments(
        id,
        status,
        slip_url,
        slip_uploaded_at,
        refund_slip_url
      )
    `)
    .eq('creator_id', creator.id);

  // Filter by status if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: orders, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Get orders error:', error);
    return { success: false, error: 'ไม่สามารถโหลดคำสั่งซื้อได้', orders: [] };
  }

  // Transform data: convert arrays to single objects
  const transformedOrders = (orders || []).map(order => ({
    ...order,
    product: Array.isArray(order.product) ? order.product[0] || null : order.product,
    payment: Array.isArray(order.payment) ? order.payment[0] || null : order.payment,
  }));

  return { success: true, orders: transformedOrders };
}

// ============================================
// CONFIRM PAYMENT
// ============================================
export async function confirmPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Get creator with contact info
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, contact_line, contact_ig')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  // Verify order belongs to this creator
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id, status, total, buyer_email, buyer_name, booking_date, booking_time,
      product:products(id, title, type, type_config)
    `)
    .eq('id', orderId)
    .eq('creator_id', creator.id)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  if (order.status !== 'pending_confirmation') {
    return { success: false, error: 'คำสั่งซื้อนี้ไม่สามารถยืนยันได้' };
  }

  // Update order status
  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId);

  if (updateOrderError) {
    return { success: false, error: 'ไม่สามารถอัพเดทสถานะได้' };
  }

  // Update payment status
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({ 
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: creator.id 
    })
    .eq('order_id', orderId);

  if (updatePaymentError) {
    console.error('Update payment error:', updatePaymentError);
  }

  // Handle fulfillment based on product type
  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  if (product) {
    const typeConfig = (product.type_config as Record<string, unknown>) || {};

    // For booking/live products, fulfillment was already created at order creation
    // Just validate that required fields are filled
    if (product.type === 'booking' || product.type === 'live') {
      const { data: existingFulfillment } = await supabase
        .from('fulfillments')
        .select('id, content')
        .eq('order_id', orderId)
        .single();

      if (existingFulfillment) {
        const content = existingFulfillment.content as Record<string, unknown>;
        const meetingType = content.meeting_type as string || 'online';
        const hasRequiredInfo = meetingType === 'online' 
          ? !!(content.meeting_url as string)?.trim()
          : !!(content.location as string)?.trim();
        
        if (!hasRequiredInfo) {
          // Rollback order status
          await supabase.from('orders').update({ status: 'pending_confirmation' }).eq('id', orderId);
          await supabase.from('payments').update({ status: 'pending', confirmed_at: null, confirmed_by: null }).eq('order_id', orderId);
          return { success: false, error: 'กรุณากรอกข้อมูลนัดหมายก่อนยืนยัน' };
        }
      }
    } else if (product.type === 'digital') {
      // Create fulfillment for digital products
      let fulfillmentContent: Record<string, unknown>;
      
      if (typeConfig.delivery_type === 'redirect') {
        fulfillmentContent = {
          delivery_type: 'redirect',
          redirect_url: typeConfig.redirect_url || '',
          redirect_name: typeConfig.redirect_name || '',
        };
      } else {
        fulfillmentContent = {
          delivery_type: 'file',
          file_url: typeConfig.digital_file_url || '',
          file_name: typeConfig.digital_file_name || 'file',
          download_count: 0,
          max_downloads: 5,
        };
      }

      const { error: fulfillmentError } = await supabase
        .from('fulfillments')
        .insert({
          order_id: orderId,
          type: 'download',
          content: fulfillmentContent,
          access_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (fulfillmentError) {
        console.error('Create fulfillment error:', fulfillmentError);
      }
    }
  }

  // Send confirmation email to buyer
  const productTitle = product?.title || 'สินค้า';
  
  // Prepare email data
  const emailData: Parameters<typeof sendOrderConfirmationEmail>[0] = {
    orderId: order.id,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    productTitle,
    amount: order.total,
    creatorName: creator.display_name || 'ผู้ขาย',
    creatorContact: {
      line: creator.contact_line || undefined,
      ig: creator.contact_ig || undefined,
    },
  };
  
  // Add booking info if this is a booking product
  if ((product?.type === 'booking' || product?.type === 'live') && order.booking_date && order.booking_time) {
    // Get fulfillment for meeting details
    const { data: fulfillment } = await supabase
      .from('fulfillments')
      .select('content')
      .eq('order_id', orderId)
      .single();

    const fulfillmentContent = fulfillment?.content as Record<string, unknown> || {};
    const typeConfig = (product.type_config as Record<string, unknown>) || {};

    emailData.booking = {
      date: order.booking_date,
      time: order.booking_time,
      durationMinutes: (typeConfig.duration_minutes as number) || 60,
      meetingType: (fulfillmentContent.meeting_type as 'online' | 'offline') || 'online',
      meetingUrl: fulfillmentContent.meeting_url as string | undefined,
      meetingPlatform: fulfillmentContent.meeting_platform as string | undefined,
      location: fulfillmentContent.location as string | undefined,
    };
  }
  
  console.log('confirmOrder - sending email to:', emailData.buyerEmail);
  try {
    await sendOrderConfirmationEmail(emailData);
    console.log('confirmOrder - email sent successfully');
  } catch (emailError) {
    console.error('confirmOrder - email failed:', emailError);
  }

  revalidatePath('/dashboard/orders');
  return { success: true };
}

// ============================================
// REJECT PAYMENT
// ============================================
export async function rejectPayment(
  orderId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Get creator with contact info
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, contact_line, contact_ig')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  // Verify order belongs to this creator
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, total, buyer_email, buyer_name, product:products(title)')
    .eq('id', orderId)
    .eq('creator_id', creator.id)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  if (order.status !== 'pending_confirmation') {
    return { success: false, error: 'คำสั่งซื้อนี้ไม่สามารถปฏิเสธได้' };
  }

  // Update order status
  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateOrderError) {
    return { success: false, error: 'ไม่สามารถอัพเดทสถานะได้' };
  }

  // Update payment status
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({ 
      status: 'failed',
      rejection_reason: reason 
    })
    .eq('order_id', orderId);

  if (updatePaymentError) {
    console.error('Update payment error:', updatePaymentError);
  }

  // Send rejection email to buyer
  const product = order.product as { title?: string } | { title?: string }[] | null;
  const productTitle = Array.isArray(product) ? product[0]?.title : product?.title;
  await sendPaymentRejectionEmail({
    orderId: order.id,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    productTitle: productTitle || 'สินค้า',
    amount: order.total,
    creatorName: creator.display_name || 'ผู้ขาย',
    creatorContact: {
      line: creator.contact_line || undefined,
      ig: creator.contact_ig || undefined,
    },
    reason,
  });

  revalidatePath('/dashboard/orders');
  return { success: true };
}

// ============================================
// GET ORDER STATS FOR DASHBOARD
// ============================================
export async function getOrderStats() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Get creator
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return null;
  }

  // Get counts by status
  const { data: orders } = await supabase
    .from('orders')
    .select('status, total')
    .eq('creator_id', creator.id);

  if (!orders) {
    return {
      total: 0,
      pending_payment: 0,
      pending_confirmation: 0,
      confirmed: 0,
      cancelled: 0,
      refunded: 0,
      total_revenue: 0,
    };
  }

  const stats = {
    total: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    pending_confirmation: orders.filter(o => o.status === 'pending_confirmation').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
    total_revenue: orders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  return stats;
}

// ============================================
// REFUND ORDER (with slip upload)
// ============================================
export async function refundOrder(
  orderId: string, 
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบ' };
  }

  // Get creator with contact info
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, contact_line, contact_ig')
    .eq('user_id', user.id)
    .single();

  if (!creator) {
    return { success: false, error: 'ไม่พบข้อมูล Creator' };
  }

  // Verify order belongs to this creator
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, total, buyer_email, buyer_name, refund_promptpay, product:products(title)')
    .eq('id', orderId)
    .eq('creator_id', creator.id)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  // Can refund confirmed, pending_confirmation, or cancelled orders
  // (cancelled orders may need refund if creator rejected by mistake)
  if (!['confirmed', 'pending_confirmation', 'cancelled'].includes(order.status)) {
    return { success: false, error: 'คำสั่งซื้อนี้ไม่สามารถคืนเงินได้' };
  }

  // Get refund slip from form
  const refundSlip = formData.get('refund_slip') as File;
  const refundNote = formData.get('refund_note') as string;

  if (!refundSlip || refundSlip.size === 0) {
    return { success: false, error: 'กรุณาอัพโหลดสลิปการคืนเงิน' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(refundSlip.type)) {
    return { success: false, error: 'รองรับเฉพาะไฟล์ภาพ (JPG, PNG, WebP)' };
  }

  // Max 5MB
  if (refundSlip.size > 5 * 1024 * 1024) {
    return { success: false, error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' };
  }

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await refundSlip.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Upload refund slip to Supabase Storage
  const fileExt = refundSlip.name.split('.').pop() || 'jpg';
  const fileName = `refund-${orderId}-${Date.now()}.${fileExt}`;
  const filePath = `refund-slips/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('payments')
    .upload(filePath, buffer, {
      contentType: refundSlip.type,
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { success: false, error: 'ไม่สามารถอัพโหลดสลิปได้' };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('payments')
    .getPublicUrl(filePath);

  // Update order status
  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ 
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateOrderError) {
    return { success: false, error: 'ไม่สามารถอัพเดทสถานะได้' };
  }

  // Update payment status with refund info
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({ 
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_amount: order.total,
      refund_note: refundNote || null,
      refund_slip_url: publicUrl,
    })
    .eq('order_id', orderId);

  if (updatePaymentError) {
    console.error('Update payment error:', updatePaymentError);
  }

  // Send refund notification email to buyer with slip
  const productRefund = order.product as { title?: string } | { title?: string }[] | null;
  const productTitle = Array.isArray(productRefund) ? productRefund[0]?.title : productRefund?.title;
  await sendRefundNotificationEmail({
    orderId: order.id,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    productTitle: productTitle || 'สินค้า',
    amount: order.total,
    refundAmount: order.total,
    refundNote: refundNote || undefined,
    refundSlipUrl: publicUrl,
    creatorName: creator.display_name || 'ผู้ขาย',
    creatorContact: {
      line: creator.contact_line || undefined,
      ig: creator.contact_ig || undefined,
    },
  });

  revalidatePath('/dashboard/orders');
  return { success: true };
}

// ============================================
// CANCEL BOOKING (by customer)
// ============================================
export async function cancelBooking(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // Use admin client to bypass RLS (customer not logged in)
  const supabase = createAdminClient();

  // Get order first
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, booking_date, booking_time, product_id, creator_id, buyer_email, buyer_name')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Cancel booking - order query error:', orderError, 'orderId:', orderId);
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  console.log('Cancel booking - order found:', order);

  // Check if can cancel (only confirmed or pending_confirmation)
  if (!['confirmed', 'pending_confirmation'].includes(order.status)) {
    console.error('Cancel booking - invalid status:', order.status);
    return { success: false, error: `ไม่สามารถยกเลิกได้ (สถานะ: ${order.status})` };
  }

  // Get product info separately
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, type')
    .eq('id', order.product_id)
    .single();

  console.log('Cancel booking - product:', product, 'error:', productError);

  if (!product) {
    return { success: false, error: 'ไม่พบข้อมูลสินค้า' };
  }
  
  if (!['booking', 'live'].includes(product.type)) {
    return { success: false, error: `สินค้านี้ไม่ใช่การจอง (type: ${product.type})` };
  }

  // Get creator info separately
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, email, contact_line')
    .eq('id', order.creator_id)
    .single();

  // Find the slot to decrement
  if (order.booking_date && order.booking_time) {
    const { data: slot } = await supabase
      .from('booking_slots')
      .select('id, current_bookings, max_bookings')
      .eq('product_id', product.id)
      .eq('slot_date', order.booking_date)
      .eq('start_time', order.booking_time)
      .single();

    if (slot) {
      // Decrement current_bookings
      const newCurrentBookings = Math.max(0, (slot.current_bookings || 1) - 1);
      await supabase
        .from('booking_slots')
        .update({
          current_bookings: newCurrentBookings,
          is_booked: newCurrentBookings >= (slot.max_bookings || 1),
        })
        .eq('id', slot.id);
    }
  }

  // Update order status to cancelled
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancel_reason: reason || 'ลูกค้ายกเลิก',
    })
    .eq('id', orderId);

  console.log('Cancel booking - update result, error:', updateError);

  if (updateError) {
    console.error('Cancel booking - update error:', updateError);
    return { success: false, error: `ไม่สามารถยกเลิกได้: ${updateError.message}` };
  }

  // Send cancellation email to creator
  if (creator?.email) {
    console.log('Cancel booking - sending email to creator:', creator.email);
    try {
      await sendBookingCancellationEmail({
        creatorEmail: creator.email,
        creatorName: creator.display_name || 'Creator',
        buyerName: order.buyer_name,
        buyerEmail: order.buyer_email,
        productTitle: product.title,
        bookingDate: order.booking_date || '',
        bookingTime: order.booking_time || '',
        reason: reason || 'ไม่ระบุ',
      });
      console.log('Cancel booking - email sent successfully');
    } catch (emailError) {
      console.error('Cancel booking - email failed:', emailError);
    }
  } else {
    console.log('Cancel booking - no creator email found');
  }

  revalidatePath(`/checkout/${orderId}/success`);
  return { success: true };
}

// ============================================
// RESCHEDULE BOOKING (by customer)
// ============================================
export async function rescheduleBooking(
  orderId: string,
  newSlotId: string
): Promise<{ success: boolean; error?: string }> {
  // Use admin client to bypass RLS (customer not logged in)
  const supabase = createAdminClient();

  // Get order first
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, booking_date, booking_time, product_id, creator_id, buyer_email, buyer_name, reschedule_count')
    .eq('id', orderId)
    .single();

  console.log('Reschedule booking - order:', order, 'error:', orderError);

  if (orderError || !order) {
    console.error('Reschedule booking - order query error:', orderError);
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  // Check if already rescheduled
  const rescheduleCount = (order as any).reschedule_count || 0;
  if (rescheduleCount >= 1) {
    return { success: false, error: 'คุณได้เปลี่ยนเวลานัดหมายไปแล้ว 1 ครั้ง ไม่สามารถเปลี่ยนได้อีก' };
  }

  // Get product info separately
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, type, type_config, creator_id')
    .eq('id', order.product_id)
    .single();

  console.log('Reschedule booking - product:', product, 'error:', productError);

  // Get creator info separately  
  const { data: creator } = await supabase
    .from('creators')
    .select('id, display_name, email, contact_line')
    .eq('id', order.creator_id)
    .single();

  if (!product) {
    console.log('Reschedule - product not found');
    return { success: false, error: 'ไม่พบข้อมูลสินค้า' };
  }

  // Check if can reschedule
  console.log('Reschedule - checking status:', order.status);
  if (!['confirmed', 'pending_confirmation'].includes(order.status)) {
    console.log('Reschedule - invalid status:', order.status);
    return { success: false, error: `ไม่สามารถเปลี่ยนนัดได้ (สถานะ: ${order.status})` };
  }

  console.log('Reschedule - checking product type:', product.type);
  if (!['booking', 'live'].includes(product.type)) {
    console.log('Reschedule - invalid product type:', product.type);
    return { success: false, error: `สินค้านี้ไม่ใช่การจอง (type: ${product.type})` };
  }

  // Get new slot
  console.log('Reschedule - getting new slot:', newSlotId);
  const { data: newSlot, error: newSlotError } = await supabase
    .from('booking_slots')
    .select('id, slot_date, start_time, end_time, max_bookings, current_bookings, is_available')
    .eq('id', newSlotId)
    .eq('product_id', product.id)
    .single();

  console.log('Reschedule - newSlot:', newSlot, 'error:', newSlotError);

  if (newSlotError || !newSlot) {
    return { success: false, error: 'ช่วงเวลาที่เลือกไม่พร้อมใช้งาน' };
  }

  // Check new slot availability
  if (!newSlot.is_available) {
    return { success: false, error: 'ช่วงเวลานี้ไม่เปิดให้จอง' };
  }

  const newMaxBookings = newSlot.max_bookings || 1;
  const newCurrentBookings = newSlot.current_bookings || 0;
  if (newCurrentBookings >= newMaxBookings) {
    return { success: false, error: 'ช่วงเวลานี้เต็มแล้ว' };
  }

  // Check minimum advance booking
  const minAdvanceHours = (product.type_config?.minimum_advance_hours as number) || 0;
  if (minAdvanceHours > 0) {
    const bookingDatetime = new Date(`${newSlot.slot_date}T${newSlot.start_time}+07:00`);
    const now = new Date();
    const hoursUntil = (bookingDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < minAdvanceHours) {
      return { success: false, error: `กรุณาเลือกเวลาล่วงหน้าอย่างน้อย ${minAdvanceHours} ชั่วโมง` };
    }
  }

  // Decrement old slot
  if (order.booking_date && order.booking_time) {
    const { data: oldSlot } = await supabase
      .from('booking_slots')
      .select('id, current_bookings, max_bookings')
      .eq('product_id', product.id)
      .eq('slot_date', order.booking_date)
      .eq('start_time', order.booking_time)
      .single();

    if (oldSlot) {
      const oldNewCount = Math.max(0, (oldSlot.current_bookings || 1) - 1);
      await supabase
        .from('booking_slots')
        .update({
          current_bookings: oldNewCount,
          is_booked: oldNewCount >= (oldSlot.max_bookings || 1),
        })
        .eq('id', oldSlot.id);
    }
  }

  // Increment new slot
  await supabase
    .from('booking_slots')
    .update({
      current_bookings: newCurrentBookings + 1,
      is_booked: (newCurrentBookings + 1) >= newMaxBookings,
    })
    .eq('id', newSlotId);

  // Update order with new booking info and increment reschedule count
  console.log('Reschedule - updating order with new booking date/time');
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      booking_date: newSlot.slot_date,
      booking_time: newSlot.start_time,
      reschedule_count: rescheduleCount + 1,
    })
    .eq('id', orderId);

  console.log('Reschedule - update result, error:', updateError);

  if (updateError) {
    console.error('Reschedule - update failed:', updateError);
    return { success: false, error: `ไม่สามารถเปลี่ยนนัดได้: ${updateError.message}` };
  }

  console.log('Reschedule - success!');

  // Send reschedule notification to creator
  if (creator?.email) {
    console.log('Reschedule - sending email to creator:', creator.email);
    try {
      await sendBookingRescheduleEmail({
        creatorEmail: creator.email,
        creatorName: creator.display_name || 'Creator',
        buyerName: order.buyer_name,
        buyerEmail: order.buyer_email,
        productTitle: product.title,
        oldDate: order.booking_date || '',
        oldTime: order.booking_time || '',
        newDate: newSlot.slot_date,
        newTime: newSlot.start_time,
      });
      console.log('Reschedule - email sent successfully');
    } catch (emailError) {
      console.error('Reschedule - email failed:', emailError);
    }
  } else {
    console.log('Reschedule - no creator email found');
  }

  revalidatePath(`/checkout/${orderId}/success`);
  return { success: true };
}

// ============================================
// GET AVAILABLE SLOTS FOR RESCHEDULE
// ============================================
export async function getAvailableSlotsForReschedule(
  orderId: string
): Promise<{ success: boolean; slots?: Array<{
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  remaining: number;
}>; error?: string }> {
  // Use admin client to bypass RLS (customer not logged in)
  const supabase = createAdminClient();

  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('product_id, booking_date, booking_time')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
  }

  // Get product settings for minimum_advance_hours and buffer_minutes
  const { data: product } = await supabase
    .from('products')
    .select('type_config')
    .eq('id', order.product_id)
    .single();

  const typeConfig = (product?.type_config as any) || {};
  const minimumAdvanceHours = typeConfig.minimum_advance_hours || 0;
  const bufferMinutes = typeConfig.buffer_minutes || 0;
  const durationMinutes = typeConfig.duration_minutes || 60;

  // Get available slots
  const today = new Date().toISOString().split('T')[0];
  const { data: slots, error: slotsError } = await supabase
    .from('booking_slots')
    .select('id, slot_date, start_time, end_time, max_bookings, current_bookings')
    .eq('product_id', order.product_id)
    .eq('is_available', true)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (slotsError) {
    return { success: false, error: 'ไม่สามารถโหลดเวลาว่างได้' };
  }

  // Get all booked slots for buffer time calculation
  // (exclude current order's slot since we're moving away from it)
  const { data: bookedOrders } = await supabase
    .from('orders')
    .select('booking_date, booking_time')
    .eq('product_id', order.product_id)
    .in('status', ['confirmed', 'pending_confirmation'])
    .neq('id', orderId); // Exclude current order

  const bookedSlots = bookedOrders || [];
  const now = new Date();

  // Filter slots with all restrictions
  const availableSlots = (slots || [])
    .filter(slot => {
      const remaining = (slot.max_bookings || 1) - (slot.current_bookings || 0);
      const isCurrent = slot.slot_date === order.booking_date && slot.start_time === order.booking_time;
      
      // Basic checks
      if (remaining <= 0 || isCurrent) return false;

      // Check minimum advance hours
      if (minimumAdvanceHours > 0) {
        const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`);
        const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilSlot < minimumAdvanceHours) return false;
      }

      // Check buffer time
      if (bufferMinutes > 0) {
        const slotStartTime = new Date(`${slot.slot_date}T${slot.start_time}`).getTime();
        
        // Check if this slot is within buffer zone of any booked slot
        const isInBuffer = bookedSlots.some(booked => {
          if (booked.booking_date !== slot.slot_date) return false;
          
          const bookedStart = new Date(`${booked.booking_date}T${booked.booking_time}`).getTime();
          const bookedEnd = bookedStart + (durationMinutes * 60 * 1000);
          const bufferEnd = bookedEnd + (bufferMinutes * 60 * 1000);
          
          // Slot starts within buffer period after booked slot ends
          return slotStartTime >= bookedEnd && slotStartTime < bufferEnd;
        });
        
        if (isInBuffer) return false;
      }

      return true;
    })
    .map(slot => ({
      id: slot.id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      remaining: (slot.max_bookings || 1) - (slot.current_bookings || 0),
    }));

  return { success: true, slots: availableSlots };
}
