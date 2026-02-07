/**
 * LINE Notify Integration
 * ส่งแจ้งเตือนผ่าน LINE Notify API
 * 
 * Creator ต้อง:
 * 1. ไปที่ https://notify-bot.line.me/
 * 2. Login แล้วสร้าง token
 * 3. เลือกกลุ่มหรือ "1-on-1 chat with LINE Notify"
 * 4. คัดลอก token มาใส่ในหน้าตั้งค่า
 */

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

interface LineNotifyOptions {
  token: string;
  message: string;
}

/**
 * Send a LINE Notify message
 */
export async function sendLineNotify({ token, message }: LineNotifyOptions): Promise<boolean> {
  try {
    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('LINE Notify error:', response.status, errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('LINE Notify send error:', error);
    return false;
  }
}

/**
 * Send order notification to creator via LINE
 */
export async function notifyNewOrder(token: string, orderData: {
  buyerName: string;
  productTitle: string;
  total: number;
  orderId: string;
}) {
  const message = `
🛒 คำสั่งซื้อใหม่!

📦 สินค้า: ${orderData.productTitle}
👤 ลูกค้า: ${orderData.buyerName}
💰 ยอด: ฿${orderData.total.toLocaleString()}

📋 รหัส: ${orderData.orderId.slice(0, 8)}
📌 สถานะ: รอชำระเงิน

ดูรายละเอียดที่ Dashboard`;

  return sendLineNotify({ token, message });
}

/**
 * Send slip uploaded notification to creator via LINE
 */
export async function notifySlipUploaded(token: string, orderData: {
  buyerName: string;
  productTitle: string;
  total: number;
  orderId: string;
}) {
  const message = `
💳 ลูกค้าอัพโหลดสลิปแล้ว!

📦 สินค้า: ${orderData.productTitle}
👤 ลูกค้า: ${orderData.buyerName}
💰 ยอด: ฿${orderData.total.toLocaleString()}

📋 รหัส: ${orderData.orderId.slice(0, 8)}
⏳ รอคุณยืนยันการชำระเงิน

เข้า Dashboard เพื่อตรวจสอบสลิป`;

  return sendLineNotify({ token, message });
}

/**
 * Send payment confirmed notification to creator via LINE
 */
export async function notifyPaymentConfirmed(token: string, orderData: {
  buyerName: string;
  productTitle: string;
  total: number;
  orderId: string;
}) {
  const message = `
✅ ยืนยันการชำระเงินแล้ว!

📦 สินค้า: ${orderData.productTitle}
👤 ลูกค้า: ${orderData.buyerName}
💰 ยอด: ฿${orderData.total.toLocaleString()}

📋 รหัส: ${orderData.orderId.slice(0, 8)}
🎉 ออเดอร์สำเร็จ!`;

  return sendLineNotify({ token, message });
}
