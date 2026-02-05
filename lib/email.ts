import { Resend } from 'resend';

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
}

// ============================================
// ORDER CONFIRMATION EMAIL (to buyer)
// ============================================
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: `✅ ยืนยันการชำระเงิน - ${data.productTitle}`,
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
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h1 style="color: white; margin: 0; font-size: 24px;">การชำระเงินสำเร็จ!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #374151; margin: 0 0 20px;">สวัสดีคุณ ${data.buyerName},</p>
              
              <p style="color: #374151; margin: 0 0 20px;">
                การชำระเงินของคุณได้รับการยืนยันเรียบร้อยแล้ว
              </p>
              
              <!-- Order Details -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">รายละเอียดคำสั่งซื้อ</p>
                <p style="margin: 0 0 5px; font-weight: bold; color: #111827;">${data.productTitle}</p>
                <p style="margin: 0; color: #6b7280;">หมายเลข: #${data.orderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #22c55e;">฿${data.amount.toLocaleString()}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 20px;">
                ผู้ขายจะติดต่อคุณเพื่อส่งมอบสินค้า/บริการตามที่สั่งซื้อ
              </p>
              
              <!-- View Order Button -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/${data.orderId}/success" 
                 style="display: block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; padding: 15px 30px; border-radius: 10px; text-align: center; font-weight: bold; margin-bottom: 20px;">
                🎁 คลิกเพื่อรับสินค้า/บริการ
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
