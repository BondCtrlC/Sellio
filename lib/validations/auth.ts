import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z
    .string()
    .min(1, 'กรุณากรอกรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  username: z
    .string()
    .min(1, 'กรุณากรอก username')
    .min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(30, 'Username ต้องไม่เกิน 30 ตัวอักษร')
    .regex(/^[a-z0-9_]+$/, 'Username ใช้ได้เฉพาะ a-z, 0-9 และ _ เท่านั้น'),
  displayName: z
    .string()
    .min(1, 'กรุณากรอกชื่อที่แสดง')
    .max(50, 'ชื่อที่แสดงต้องไม่เกิน 50 ตัวอักษร'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
