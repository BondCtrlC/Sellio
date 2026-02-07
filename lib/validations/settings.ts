import { z } from 'zod';

export const settingsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(30, 'Username ต้องไม่เกิน 30 ตัวอักษร')
    .regex(/^[a-z0-9_]+$/, 'Username ใช้ได้เฉพาะ a-z, 0-9 และ _ เท่านั้น'),
  display_name: z
    .string()
    .min(1, 'กรุณากรอกชื่อที่แสดง')
    .max(50, 'ชื่อที่แสดงต้องไม่เกิน 50 ตัวอักษร'),
  bio: z
    .string()
    .max(500, 'Bio ต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  promptpay_phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก')
    .optional()
    .or(z.literal('')),
  promptpay_name: z
    .string()
    .max(100, 'ชื่อบัญชีต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  bank_name: z
    .string()
    .max(100, 'ชื่อธนาคารต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  bank_account_number: z
    .string()
    .max(20, 'เลขบัญชีต้องไม่เกิน 20 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  bank_account_name: z
    .string()
    .max(100, 'ชื่อบัญชีต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  contact_phone: z
    .string()
    .max(20, 'เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  contact_line: z
    .string()
    .max(100, 'Line ID ต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  contact_ig: z
    .string()
    .max(100, 'Instagram ต้องไม่เกิน 100 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  contact_email: z
    .string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  is_published: z.boolean(),
  // SEO Settings
  seo_title: z
    .string()
    .max(70, 'SEO Title ต้องไม่เกิน 70 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  seo_description: z
    .string()
    .max(160, 'SEO Description ต้องไม่เกิน 160 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  seo_keywords: z
    .string()
    .max(500, 'Keywords ต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  // Email Notifications
  notification_email: z
    .string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
