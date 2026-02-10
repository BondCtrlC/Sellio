import { Resend } from 'resend';
import { generateBookingICS } from './ics';
import { getTranslations } from 'next-intl/server';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email (must be verified in Resend)
// After domain verification, set RESEND_FROM_EMAIL=Sellio <noreply@sellio.me> in Vercel env
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Sellio <noreply@sellio.me>';

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
    const t = await getTranslations('Emails');
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
      googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.productTitle)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(t('appointmentWith', { name: data.creatorName }))}`;
      
      // Meeting info
      const meetingInfo = data.booking.meetingType === 'online' && data.booking.meetingUrl
        ? `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 5px; color: #0369a1; font-weight: bold;">${t('onlineMeeting')}</p>
            ${data.booking.meetingPlatform ? `<p style="margin: 0 0 5px; color: #374151;">${t('platformLabel', { platform: data.booking.meetingPlatform })}</p>` : ''}
            <a href="${data.booking.meetingUrl}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; margin-top: 10px; font-size: 14px;">${t('joinMeeting')}</a>
          </div>
        `
        : data.booking.location
        ? `
          <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 15px;">
            <p style="margin: 0 0 5px; color: #92400e; font-weight: bold;">${t('locationLabel')}</p>
            <p style="margin: 0; color: #374151;">${data.booking.location}</p>
          </div>
        `
        : '';
      
      bookingSection = `
        <!-- Booking Details -->
        <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e9d5ff;">
          <p style="margin: 0 0 15px; color: #7c3aed; font-weight: bold;">${t('bookingDetails')}</p>
          
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
              <p style="margin: 0; color: #6b7280; font-size: 14px;">(${data.booking.durationMinutes || 60} ${t('minutes')})</p>
            </div>
          </div>
          
          ${meetingInfo}
        </div>
        
        <!-- Add to Calendar -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px; color: #374151; font-weight: bold;">${t('addToCalendar')}</p>
          <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px;">Google Calendar</a>
          <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">${t('addToCalendarICS')}</p>
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
        ? t('bookingConfirmSubject', { product: data.productTitle })
        : t('orderConfirmSubject', { product: data.productTitle }),
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
              <h1 style="color: white; margin: 0; font-size: 24px;">${isBooking ? t('bookingConfirmedTitle') : t('paymentConfirmedTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">${t('hello', { name: data.buyerName })}</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${isBooking ? t('bookingConfirmedBody') : t('paymentConfirmedBody')}
              </p>
              
              <!-- Order Details -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">${t('orderDetails')}</p>
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0; color: #6b7280;">${t('orderNumber', { id: data.orderId.slice(0, 8).toUpperCase() })}</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: ${isBooking ? '#7c3aed' : '#22c55e'};">฿${data.amount.toLocaleString()}</p>
              </div>
              
              ${bookingSection}
              
              ${!isBooking ? `
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('sellerWillDeliver')}
              </p>
              ` : ''}
              
              <!-- View Order Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: linear-gradient(135deg, ${isBooking ? '#8b5cf6, #7c3aed' : '#22c55e, #16a34a'}); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold; margin-bottom: ${isBooking ? '10px' : '20px'};">
                ${isBooking ? t('viewBookingDetails') : t('getProduct')}
              </a>
              
              ${isBooking ? `
              <!-- Reschedule/Cancel Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 12px 30px; border-radius: 10px; text-align: center; font-weight: 600; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                ${t('rescheduleCancel')}
              </a>
              ` : ''}
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">${t('contactSeller', { name: data.creatorName })}</p>
                ${data.creatorContact.line ? `<p style="margin: 0 0 5px; color: #374151;">Line: ${data.creatorContact.line}</p>` : ''}
                ${data.creatorContact.ig ? `<p style="margin: 0; color: #374151;">Instagram: ${data.creatorContact.ig}</p>` : ''}
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${t('thankYouSellio')}
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
    const t = await getTranslations('Emails');
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: t('rejectionSubject', { product: data.productTitle }),
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
              <h1 style="color: white; margin: 0; font-size: 24px;">${t('rejectionTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">${t('hello', { name: data.buyerName })}</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('rejectionBody')}
              </p>
              
              <!-- Order Details -->
              <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #991b1b; font-weight: bold;">${t('rejectionReason')}</p>
                <p style="margin: 0; color: #374151;">${data.reason}</p>
              </div>
              
              <!-- Order Info -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0; color: #6b7280;">${t('orderNumber', { id: data.orderId.slice(0, 8).toUpperCase() })}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('contactSellerHelp')}
              </p>
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">${t('contactSeller', { name: data.creatorName })}</p>
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
    const t = await getTranslations('Emails');
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: t('refundSubject', { product: data.productTitle }),
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
              <h1 style="color: white; margin: 0; font-size: 24px;">${t('refundTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">${t('hello', { name: data.buyerName })}</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('refundBody')}
              </p>
              
              <!-- Refund Details -->
              <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bfdbfe;">
                <p style="margin: 0 0 10px; color: #1e40af; font-weight: bold;">${t('refundDetails')}</p>
                <p style="margin: 0 0 5px; color: #374151;"><strong>${t('refundProduct')}</strong> ${data.productTitle}</p>
                <p style="margin: 0 0 5px; color: #374151;"><strong>${t('refundOrderNumber')}</strong> #${data.orderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #2563eb;">฿${data.refundAmount.toLocaleString()}</p>
              </div>
              
              ${data.refundNote ? `
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">${t('refundSellerNote')}</p>
                <p style="margin: 0; color: #374151;">${data.refundNote}</p>
              </div>
              ` : ''}
              
              ${data.refundSlipUrl ? `
              <!-- Refund Slip -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #1e40af; font-weight: bold;">${t('refundSlip')}</p>
                <img src="${data.refundSlipUrl}" alt="Refund Slip" style="width: 100%; border-radius: 12px; border: 1px solid #e5e7eb;" />
              </div>
              ` : ''}
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('refundCheckAccount')}
              </p>
              
              <!-- Creator Contact -->
              ${data.creatorContact && (data.creatorContact.line || data.creatorContact.ig) ? `
              <div style="background: #f0f9ff; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; color: #0369a1; font-weight: bold;">${t('contactSeller', { name: data.creatorName })}</p>
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
    const t = await getTranslations('Emails');
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: t('newOrderSubject', { product: data.productTitle }),
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
              <h1 style="color: white; margin: 0; font-size: 24px;">${t('newOrderTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0 0 10px; color: #6b7280;">${t('buyer', { name: data.buyerName })}</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #6366f1;">฿${data.amount.toLocaleString()}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('newOrderBody')}
              </p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/orders" 
                 style="display: block; background: #6366f1; color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold;">
                ${t('goToDashboard')}
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
// SLIP UPLOADED NOTIFICATION EMAIL (to creator)
// ============================================
export async function sendSlipUploadedNotificationEmail(
  creatorEmail: string,
  data: {
    orderId: string;
    buyerName: string;
    productTitle: string;
    amount: number;
  }
) {
  try {
    const t = await getTranslations('Emails');
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: t('slipUploadedSubject', { product: data.productTitle }),
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
              <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">${t('slipUploadedTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0 0 10px; color: #6b7280;">${t('buyer', { name: data.buyerName })}</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f59e0b;">฿${data.amount.toLocaleString()}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('slipUploadedBody')}
              </p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/orders" 
                 style="display: block; background: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold;">
                ${t('checkSlip')}
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
      console.error('Send slip notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Slip notification email error:', err);
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
    const t = await getTranslations('Emails');

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
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(data.productTitle)}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(t('appointmentWith', { name: data.creatorName }))}`;

    // Meeting info section
    const meetingInfo = data.meetingUrl
      ? `
        <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0 0 5px; color: #0369a1; font-weight: bold;">${t('onlineMeeting')}</p>
          ${data.meetingPlatform ? `<p style="margin: 0 0 5px; color: #374151;">${t('platformLabel', { platform: data.meetingPlatform })}</p>` : ''}
          <a href="${data.meetingUrl}" style="display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 10px; font-size: 14px; font-weight: bold;">${t('joinMeeting')}</a>
        </div>
      `
      : data.location
      ? `
        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0 0 5px; color: #92400e; font-weight: bold;">${t('locationLabel')}</p>
          <p style="margin: 0; color: #374151;">${data.location}</p>
        </div>
      `
      : '';

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: t('reminderSubject', { product: data.productTitle }),
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
              <h1 style="color: white; margin: 0; font-size: 24px;">${t('reminderTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">${t('hello', { name: data.buyerName })}</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ${t('reminderBody')}
              </p>
              
              <!-- Booking Details -->
              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fcd34d;">
                <p style="margin: 0 0 15px; color: #92400e; font-weight: bold; font-size: 16px;">📅 ${data.productTitle}</p>
                <p style="margin: 0 0 5px; color: #78350f;">${t('reminderWith', { name: data.creatorName })}</p>
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fcd34d;">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">📆</span>
                    <span style="font-weight: bold; color: #111827;">${formattedDate}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">⏰</span>
                    <span style="font-weight: bold; color: #111827;">${formattedTime} น. (${data.durationMinutes || 60} ${t('minutes')})</span>
                  </div>
                </div>
                
                ${meetingInfo}
              </div>
              
              <!-- Add to Calendar -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 10px; color: #374151; font-weight: bold;">${t('addToCalendar')}</p>
                <a href="${googleCalUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px;">Google Calendar</a>
              </div>
              
              <!-- View Order Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold; margin-bottom: 10px;">
                ${t('reminderViewDetails')}
              </a>
              
              <!-- Reschedule/Cancel Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 12px 30px; border-radius: 10px; text-align: center; font-weight: 600; border: 1px solid #e5e7eb;">
                ${t('rescheduleCancel')}
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${t('reminderFooter')}
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

// ============================================
// BOOKING CANCELLATION EMAIL (to creator)
// ============================================
export async function sendBookingCancellationEmail(data: {
  creatorEmail: string;
  creatorName: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  bookingDate: string;
  bookingTime: string;
  reason: string;
}) {
  try {
    const t = await getTranslations('Emails');

    const formattedDate = data.bookingDate ? new Date(data.bookingDate).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : '';
    const formattedTime = data.bookingTime?.slice(0, 5) || '';

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.creatorEmail,
      subject: t('cancellationSubject', { product: data.productTitle }),
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 20px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">${t('cancellationTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                ${t('hello', { name: data.creatorName })}<br><br>
                ${t('cancellationBody')}
              </p>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #991b1b;">📦 ${data.productTitle}</p>
                <p style="margin: 0 0 5px; color: #7f1d1d;">📆 ${formattedDate}</p>
                <p style="margin: 0 0 5px; color: #7f1d1d;">⏰ ${formattedTime} น.</p>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #374151;">${t('customerInfo')}</p>
                <p style="margin: 0 0 5px; color: #6b7280;">${t('nameLabel', { name: data.buyerName })}</p>
                <p style="margin: 0 0 5px; color: #6b7280;">${t('emailLabel', { email: data.buyerEmail })}</p>
                <p style="margin: 0; color: #6b7280;">${t('reasonLabel', { reason: data.reason })}</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${t('slotReopened')}
              </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">${t('autoNotification')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send cancellation email error:', error);
    }
  } catch (err) {
    console.error('Cancellation email error:', err);
  }
}

// ============================================
// BOOKING RESCHEDULE EMAIL (to creator)
// ============================================
export async function sendBookingRescheduleEmail(data: {
  creatorEmail: string;
  creatorName: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
}) {
  try {
    const t = await getTranslations('Emails');

    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : '';

    const oldFormattedDate = formatDate(data.oldDate);
    const newFormattedDate = formatDate(data.newDate);
    const oldFormattedTime = data.oldTime?.slice(0, 5) || '';
    const newFormattedTime = data.newTime?.slice(0, 5) || '';

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.creatorEmail,
      subject: t('rescheduleSubject', { product: data.productTitle }),
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 20px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">${t('rescheduleTitle')}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                ${t('hello', { name: data.creatorName })}<br><br>
                ${t('rescheduleBody')}
              </p>
              
              <p style="font-weight: bold; color: #374151; margin: 0 0 10px;">📦 ${data.productTitle}</p>
              
              <!-- Old Time -->
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; margin-bottom: 10px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #991b1b;">${t('oldTime')}</p>
                <p style="margin: 0; color: #7f1d1d; text-decoration: line-through;">${t('dateTime', { date: oldFormattedDate, time: oldFormattedTime })}</p>
              </div>
              
              <!-- New Time -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0 0 5px; font-weight: bold; color: #166534;">${t('newTime')}</p>
                <p style="margin: 0; color: #15803d; font-weight: bold;">${t('dateTime', { date: newFormattedDate, time: newFormattedTime })}</p>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 10px; font-weight: bold; color: #374151;">${t('customerInfo')}</p>
                <p style="margin: 0 0 5px; color: #6b7280;">${t('nameLabel', { name: data.buyerName })}</p>
                <p style="margin: 0; color: #6b7280;">${t('emailLabel', { email: data.buyerEmail })}</p>
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">${t('autoNotification')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Send reschedule email error:', error);
    }
  } catch (err) {
    console.error('Reschedule email error:', err);
  }
}
