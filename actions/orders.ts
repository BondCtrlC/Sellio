'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkoutSchema, type CheckoutInput } from '@/lib/validations/checkout';
import { 
  sendOrderConfirmationEmail, 
  sendPaymentRejectionEmail,
  sendNewOrderNotificationEmail,
  sendRefundNotificationEmail 
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
      .select('slot_date, start_time, is_available, max_bookings, current_bookings')
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
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' };
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

  return { success: true, orders };
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
      id, status, total, buyer_email, buyer_name, 
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
  await sendOrderConfirmationEmail({
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
  });

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
  const productTitle = Array.isArray(order.product) ? order.product[0]?.title : order.product?.title;
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
  const productTitle = Array.isArray(order.product) ? order.product[0]?.title : order.product?.title;
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
