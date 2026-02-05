'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { updateSettings } from '@/actions/settings';
import { settingsSchema, type SettingsInput } from '@/lib/validations/settings';
import type { Creator } from '@/types';

interface SettingsFormProps {
  creator: Creator;
}

export function SettingsForm({ creator }: SettingsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: creator.display_name,
      bio: creator.bio || '',
      promptpay_phone: creator.promptpay_id || '',
      promptpay_name: creator.promptpay_name || '',
      contact_phone: creator.contact_phone || '',
      contact_line: creator.contact_line || '',
      contact_ig: creator.contact_ig || '',
      contact_email: creator.contact_email || '',
      is_published: creator.is_published,
      seo_title: creator.seo_title || '',
      seo_description: creator.seo_description || '',
      seo_keywords: creator.seo_keywords || '',
    },
  });

  const onSubmit = async (data: SettingsInput) => {
    setError(null);
    setSuccess(false);
    
    const result = await updateSettings(data);
    
    if (!result.success && result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-success bg-success/10 rounded-lg">
          บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">ข้อมูลพื้นฐาน</h3>
        
        <div className="space-y-2">
          <Label htmlFor="display_name" required>ชื่อที่แสดง</Label>
          <Input
            id="display_name"
            placeholder="ชื่อร้านหรือชื่อของคุณ"
            error={!!errors.display_name}
            {...register('display_name')}
          />
          {errors.display_name && (
            <p className="text-sm text-destructive">{errors.display_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="แนะนำตัวเองหรือร้านค้าของคุณ..."
            rows={3}
            error={!!errors.bio}
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio.message}</p>
          )}
        </div>
      </div>

      {/* PromptPay */}
      <div className="space-y-4">
        <h3 className="font-semibold">การรับชำระเงิน (PromptPay)</h3>
        
        <div className="space-y-2">
          <Label htmlFor="promptpay_phone">เบอร์โทร PromptPay</Label>
          <Input
            id="promptpay_phone"
            placeholder="0812345678"
            maxLength={10}
            error={!!errors.promptpay_phone}
            {...register('promptpay_phone')}
          />
          {errors.promptpay_phone && (
            <p className="text-sm text-destructive">{errors.promptpay_phone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            เบอร์โทรที่ผูกกับ PromptPay สำหรับสร้าง QR Code ให้ลูกค้าโอนเงิน
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promptpay_name">ชื่อบัญชี</Label>
          <Input
            id="promptpay_name"
            placeholder="ชื่อที่จะแสดงบน QR Code"
            error={!!errors.promptpay_name}
            {...register('promptpay_name')}
          />
          {errors.promptpay_name && (
            <p className="text-sm text-destructive">{errors.promptpay_name.message}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold">ช่องทางติดต่อ</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_phone">เบอร์โทร</Label>
            <Input
              id="contact_phone"
              placeholder="0812345678"
              error={!!errors.contact_phone}
              {...register('contact_phone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_line">Line ID</Label>
            <Input
              id="contact_line"
              placeholder="@yourline"
              error={!!errors.contact_line}
              {...register('contact_line')}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_ig">Instagram</Label>
            <Input
              id="contact_ig"
              placeholder="@yourig"
              error={!!errors.contact_ig}
              {...register('contact_ig')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="contact@example.com"
              error={!!errors.contact_email}
              {...register('contact_email')}
            />
          </div>
        </div>
      </div>

      {/* Store Status */}
      <div className="space-y-4">
        <h3 className="font-semibold">สถานะร้านค้า</h3>
        
        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            {...register('is_published')}
          />
          <div>
            <p className="font-medium">เปิดร้านค้า</p>
            <p className="text-sm text-muted-foreground">
              เมื่อเปิด ลูกค้าจะสามารถเข้าชมและสั่งซื้อสินค้าจากร้านของคุณได้
            </p>
          </div>
        </label>
      </div>

      {/* SEO Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold">SEO Settings</h3>
        <p className="text-sm text-muted-foreground">
          ตั้งค่า meta tags สำหรับหน้าร้านของคุณ เพื่อให้แสดงผลดีบน Google และ Social Media
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="seo_title">SEO Title</Label>
          <Input
            id="seo_title"
            placeholder="ชื่อที่จะแสดงบน Google (ไม่เกิน 70 ตัวอักษร)"
            maxLength={70}
            error={!!errors.seo_title}
            {...register('seo_title')}
          />
          {errors.seo_title && (
            <p className="text-sm text-destructive">{errors.seo_title.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ถ้าไม่กรอก จะใช้ชื่อร้านเป็นค่าเริ่มต้น
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_description">SEO Description</Label>
          <Textarea
            id="seo_description"
            placeholder="คำอธิบายที่จะแสดงบน Google (ไม่เกิน 160 ตัวอักษร)"
            rows={2}
            maxLength={160}
            error={!!errors.seo_description}
            {...register('seo_description')}
          />
          {errors.seo_description && (
            <p className="text-sm text-destructive">{errors.seo_description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_keywords">Keywords</Label>
          <Input
            id="seo_keywords"
            placeholder="ขายของออนไลน์, ดิจิตอลสินค้า, creator"
            error={!!errors.seo_keywords}
            {...register('seo_keywords')}
          />
          <p className="text-xs text-muted-foreground">
            คั่นด้วยเครื่องหมายจุลภาค (,)
          </p>
        </div>
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        บันทึกการเปลี่ยนแปลง
      </Button>
    </form>
  );
}
