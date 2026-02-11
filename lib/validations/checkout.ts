import { z } from 'zod';

export const checkoutSchema = z.object({
  buyer_email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  buyer_name: z
    .string()
    .min(1, 'กรุณากรอกชื่อ')
    .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  buyer_phone: z
    .string()
    .max(20, 'เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  buyer_note: z
    .string()
    .max(500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  // For booking/live products
  slot_id: z.string().optional(),
  // For refund (required)
  refund_promptpay: z
    .string()
    .min(10, 'กรุณากรอกเบอร์ PromptPay')
    .max(20, 'เบอร์ PromptPay ต้องไม่เกิน 20 ตัวอักษร'),
  // For coupons
  coupon_id: z.string().uuid().optional(),
  coupon_code: z.string().max(50).optional(),
  discount_amount: z.number().min(0).max(1000000).optional(), // Client hint only — server recalculates from coupon
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Slip upload validation
export const slipUploadSchema = z.object({
  order_id: z.string().uuid('Order ID ไม่ถูกต้อง'),
  slip_file: z.instanceof(File, { message: 'กรุณาอัพโหลดสลิป' }),
});
