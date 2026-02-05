import { Resend } from 'resend';
import { generateBookingICS } from './ics';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email (must be verified in Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Sellio <noreply@resend.dev>';

interface OrderEmailData {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  amount: number;
  creatorName: string;
  creatorContact?: {
    line?: string;
    ig?: string;
  };
  // Booking info (optional)
  booking?: {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    durationMinutes?: number;
    meetingType?: 'online' | 'offline';
    meetingUrl?: string;
    meetingPlatform?: string;
    location?: string;
  };
}

// ============================================
// ORDER CONFIRMATION EMAIL (to buyer)
// ============================================
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const isBooking = !!data.booking;
    
    // Format booking date/time for display
    let bookingSection = '';
    let googleCalUrl = '';
    let icsContent = '';
    
    if (data.booking) {
      const dateObj = new Date(data.booking.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = data.booking.time.slice(0, 5);
      
      // Generate .ics file
      icsContent = generateBookingICS({
        productTitle: data.productTitle,
        creatorName: data.creatorName,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        bookingDate: data.booking.date,
        bookingTime: data.booking.time,
        durationMinutes: data.booking.durationMinutes || 60,
        meetingUrl: data.booking.meetingUrl,
        location: data.booking.location,
      });
      
      // Generate Google Calendar URL
      const timeParts = data.booking.time.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const dateParts = data.booking.date.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const startDate = new Date(Date.UTC(year, month, day, hours - 7, minutes, 0));
      const endDate = new Date(startDate.getTime() + (data.booking.durationMinutes || 60) * 60 * 1000);
      const formatForGoogle = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.productTitle)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(`นัดหมายกับ ${data.creatorName}`)}`;
      
      // Meeting info
      const meetingInfo = data.booking.meetingType === 'online' && data.booking.meetingUrl
        ? `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 5px; color: #0369a1; font-weight: bold;">🎥 ประชุมออนไลน์</p>
            ${data.booking.meetingPlatform ? `<p style="margin: 0 0 5px; color: #374151;">แพลตฟอร์ม: ${data.booking.meetingPlatform}</p>` : ''}
            <a href="${data.booking.meetingUrl}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; margin-top: 10px; font-size: 14px;">🔗 เข้าร่วมประชุม</a>
          </div>
        `
        : data.booking.location
        ? `
          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 5px; color: #92400e; font-weight: bold;">📍 สถานที่นัดพบ</p>
            <p style="margin: 0; color: #374151;">${data.booking.location}</p>
          </div>
        `
        : '';
      
      bookingSection = `
        <!-- Booking Details -->
        <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9d5ff;">
          <p style="margin: 0 0 15px; color: #7c3aed; font-weight: bold;">📅 รายละเอียดการนัดหมาย</p>
          
          <div style="display: flex; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 12px;">📆</span>
            <div>
              <p style="margin: 0; font-weight: bold; color: #111827; font-size: 16px;">${formattedDate}</p>
            </div>
          </div>
          
          <div style="display: flex; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 12px;">⏰</span>
            <div>
              <p style="margin: 0; font-weight: bold; color: #111827; font-size: 16px;">${formattedTime} น.</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">(${data.booking.durationMinutes || 60} นาที)</p>
            </div>
          </div>
          
          ${meetingInfo}
        </div>
        
        <!-- Add to Calendar -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px; color: #374151; font-weight: bold;">📱 เพิ่มลงปฏิทิน</p>
          <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px;">Google Calendar</a>
          <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">หรือเปิดไฟล์ .ics ที่แนบมาเพื่อเพิ่มลง Calendar อื่นๆ (Apple, Outlook)</p>
        </div>
      `;
    }

    // Prepare email options
    const emailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: { filename: string; content: string; contentType: string }[];
    } = {
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: isBooking 
        ? `📅 ยืนยันการนัดหมาย - ${data.productTitle}`
        : `✅ ยืนยันการชำระเงิน - ${data.productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${isBooking ? '#8b5cf6, #7c3aed' : '#22c55e, #16a34a'}); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${isBooking ? '📅' : '✅'}</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">${isBooking ? 'การนัดหมายยืนยันแล้ว!' : 'การชำระเงินสำเร็จ!'}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">สวัสดีคุณ ${data.buyerName},</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${isBooking ? 'การนัดหมายของคุณได้รับการยืนยันเรียบร้อยแล้ว' : 'การชำระเงินของคุณได้รับการยืนยันเรียบร้อยแล้ว'}
              </p>
              
              <!-- Order Details -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">รายละเอียดคำสั่งซื้อ</p>
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0; color: #6b7280;">หมายเลข: #${data.orderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: ${isBooking ? '#7c3aed' : '#22c55e'};">฿${data.amount.toLocaleString()}</p>
              </div>
              
              ${bookingSection}
              
              ${!isBooking ? `
              <p style="color: #374151; margin: 0 0 20px;">
                ผู้ขายจะติดต่อคุณเพื่อส่งมอบสินค้า/บริการตามที่สั่งซื้อ
              </p>
              ` : ''}
              
              <!-- View Order Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: linear-gradient(135deg, ${isBooking ? '#8b5cf6, #7c3aed' : '#22c55e, #16a34a'}); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold; margin-bottom: 20px;">
                ${isBooking ? '📅 ดูรายละเอียดนัดหมาย' : '🎁 คลิกเพื่อรับสินค้า/บริการ'}
              </a>
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">ติดต่อผู้ขาย (${data.creatorName})</p>
                ${data.creatorContact.line ? `<p style="margin: 0 0 5px; color: #374151;">Line: ${data.creatorContact.line}</p>` : ''}
                ${data.creatorContact.ig ? `<p style="margin: 0; color: #374151;">Instagram: ${data.creatorContact.ig}</p>` : ''}
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ขอบคุณที่ใช้บริการ Sellio
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    
    // Add .ics attachment for booking orders
    if (isBooking && icsContent) {
      emailOptions.attachments = [
        {
          filename: 'booking.ics',
          content: Buffer.from(icsContent).toString('base64'),
          contentType: 'text/calendar',
        },
      ];
    }

    const { error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// PAYMENT REJECTION EMAIL (to buyer)
// ============================================
export async function sendPaymentRejectionEmail(
  data: OrderEmailData & { reason: string }
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: `❌ การชำระเงินไม่สำเร็จ - ${data.productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">การชำระเงินไม่สำเร็จ</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">สวัสดีคุณ ${data.buyerName},</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ขออภัย การชำระเงินของคุณไม่สามารถยืนยันได้
              </p>
              
              <!-- Order Details -->
              <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #991b1b; font-weight: bold;">เหตุผล:</p>
                <p style="margin: 0; color: #374151;">${data.reason}</p>
              </div>
              
              <!-- Order Info -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0; color: #6b7280;">หมายเลข: #${data.orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                กรุณาติดต่อผู้ขายหากต้องการความช่วยเหลือ
              </p>
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">ติดต่อผู้ขาย (${data.creatorName})</p>
                ${data.creatorContact.line ? `<p style="margin: 0 0 5px; color: #374151;">Line: ${data.creatorContact.line}</p>` : ''}
                ${data.creatorContact.ig ? `<p style="margin: 0; color: #374151;">Instagram: ${data.creatorContact.ig}</p>` : ''}
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sellio
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// REFUND NOTIFICATION EMAIL (to buyer)
// ============================================
export async function sendRefundNotificationEmail(
  data: OrderEmailData & { 
    refundAmount: number;
    refundNote?: string;
    refundSlipUrl?: string;
  }
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: `💰 แจ้งคืนเงิน - ${data.productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">แจ้งคืนเงิน</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">สวัสดีคุณ ${data.buyerName},</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ผู้ขายได้ทำการคืนเงินให้คุณแล้ว
              </p>
              
              <!-- Refund Details -->
              <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bfdbfe;">
                <p style="margin: 0 0 10px; color: #1e40af; font-weight: bold;">💰 รายละเอียดการคืนเงิน</p>
                <p style="margin: 0 0 5px; color: #374151;"><strong>สินค้า:</strong> ${data.productTitle}</p>
                <p style="margin: 0 0 5px; color: #374151;"><strong>หมายเลขคำสั่งซื้อ:</strong> #${data.orderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #2563eb;">฿${data.refundAmount.toLocaleString()}</p>
              </div>
              
              ${data.refundNote ? `
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">หมายเหตุจากผู้ขาย:</p>
                <p style="margin: 0; color: #374151;">${data.refundNote}</p>
              </div>
              ` : ''}
              
              ${data.refundSlipUrl ? `
              <!-- Refund Slip -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #1e40af; font-weight: bold;">🧾 สลิปการคืนเงิน</p>
                <img src="${data.refundSlipUrl}" alt="Refund Slip" style="width: 100%; border-radius: 12px; border: 1px solid #e5e7eb;" />
              </div>
              ` : ''}
              
              <p style="color: #374151; margin: 0 0 20px;">
                กรุณาตรวจสอบยอดเงินในบัญชีของคุณ หากมีข้อสงสัยกรุณาติดต่อผู้ขาย
              </p>
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">ติดต่อผู้ขาย (${data.creatorName})</p>
                ${data.creatorContact.line ? `<p style="margin: 0 0 5px; color: #374151;">Line: ${data.creatorContact.line}</p>` : ''}
                ${data.creatorContact.ig ? `<p style="margin: 0; color: #374151;">Instagram: ${data.creatorContact.ig}</p>` : ''}
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sellio
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// NEW ORDER NOTIFICATION EMAIL (to creator)
// ============================================
export async function sendNewOrderNotificationEmail(
  creatorEmail: string,
  data: {
    orderId: string;
    buyerName: string;
    productTitle: string;
    amount: number;
  }
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: `🛒 มีคำสั่งซื้อใหม่ - ${data.productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">มีคำสั่งซื้อใหม่!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0 0 10px; color: #6b7280;">ผู้ซื้อ: ${data.buyerName}</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #6366f1;">฿${data.amount.toLocaleString()}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                เมื่อผู้ซื้อชำระเงินและอัพโหลดสลิป กรุณาตรวจสอบและยืนยันการชำระเงินที่ Dashboard
              </p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/orders" 
                 style="display: block; background: #6366f1; color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold;">
                ไปที่ Dashboard
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sellio
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// BOOKING REMINDER EMAIL (to buyer - 24hrs before)
// ============================================
export async function sendBookingReminderEmail(data: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  creatorName: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  durationMinutes?: number;
  meetingUrl?: string;
  meetingPlatform?: string;
  location?: string;
}) {
  try {
    // Format date for display
    const dateObj = new Date(data.bookingDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = data.bookingTime.slice(0, 5);

    // Generate Google Calendar URL
    const timeParts = data.bookingTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const dateParts = data.bookingDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const startDate = new Date(Date.UTC(year, month, day, hours - 7, minutes, 0));
    const endDate = new Date(startDate.getTime() + (data.durationMinutes || 60) * 60 * 1000);
    const formatForGoogle = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.productTitle)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(`นัดหมายกับ ${data.creatorName}`)}`;

    // Meeting info section
    const meetingInfo = data.meetingUrl
      ? `
        <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0 0 5px; color: #0369a1; font-weight: bold;">🎥 ประชุมออนไลน์</p>
          ${data.meetingPlatform ? `<p style="margin: 0 0 5px; color: #374151;">แพลตฟอร์ม: ${data.meetingPlatform}</p>` : ''}
          <a href="${data.meetingUrl}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 10px; font-size: 14px; font-weight: bold;">🔗 เข้าร่วมประชุม</a>
        </div>
      `
      : data.location
      ? `
        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0 0 5px; color: #92400e; font-weight: bold;">📍 สถานที่นัดพบ</p>
          <p style="margin: 0; color: #374151;">${data.location}</p>
        </div>
      `
      : '';

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: `⏰ เตือนนัดหมายพรุ่งนี้ - ${data.productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">อย่าลืมนัดหมายพรุ่งนี้!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">สวัสดีคุณ ${data.buyerName},</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                นี่คือการเตือนว่าคุณมีนัดหมาย<strong>พรุ่งนี้</strong> กรุณาเตรียมตัวให้พร้อม
              </p>
              
              <!-- Booking Details -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fcd34d;">
                <p style="margin: 0 0 15px; color: #92400e; font-weight: bold; font-size: 16px;">📅 ${data.productTitle}</p>
                <p style="margin: 0 0 5px; color: #78350f;">กับ ${data.creatorName}</p>
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fcd34d;">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">📆</span>
                    <span style="font-weight: bold; color: #111827;">${formattedDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">⏰</span>
                    <span style="font-weight: bold; color: #111827;">${formattedTime} น. (${data.durationMinutes || 60} นาที)</span>
                  </div>
                </div>
                
                ${meetingInfo}
              </div>
              
              <!-- Add to Calendar -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 10px; color: #374151; font-weight: bold;">📱 เพิ่มลงปฏิทิน</p>
                <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px;">Google Calendar</a>
              </div>
              
              <!-- View Order Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold;">
                📋 ดูรายละเอียดนัดหมาย
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sellio - อีเมลนี้ส่งอัตโนมัติ 24 ชั่วโมงก่อนนัดหมาย
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send reminder email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: 'Failed to send reminder email' };
  }
}

