import { z } from 'zod';

export const productSchema = z.object({
  type: z.enum(['digital', 'booking', 'link'], {
    required_error: 'กรุณาเลือกประเภทสินค้า',
  }),
  title: z
    .string()
    .min(1, 'กรุณากรอกชื่อสินค้า')
    .max(200, 'ชื่อสินค้าต้องไม่เกิน 200 ตัวอักษร'),
  description: z
    .string()
    .max(2000, 'รายละเอียดต้องไม่เกิน 2000 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  price: z
    .number({ invalid_type_error: 'กรุณากรอกราคา' })
    .min(0, 'ราคาต้องไม่ต่ำกว่า 0'),
  is_published: z.boolean().default(true),
  
  // Booking specific
  duration_minutes: z.number().optional(),
  location_type: z.enum(['online', 'offline']).optional(),
  location_details: z.string().optional(),
  // Booking Online
  meeting_platform: z.string().optional(),
  meeting_link: z.string().optional(),
  // Booking Offline
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  location_notes: z.string().optional(),
  
  // Live specific
  scheduled_at: z.string().optional(),
  platform: z.string().optional(),
  max_participants: z.number().optional(),
  
  // Link specific
  link_url: z.string().optional(),
  link_style: z.enum(['button', 'callout', 'embed']).optional(),
  link_subtitle: z.string().max(100).optional(),
  link_button_text: z.string().max(30).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
