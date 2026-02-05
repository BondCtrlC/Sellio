'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, RichTextEditor } from '@/components/ui';
import { createProduct, updateProduct } from '@/actions/products';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { PRODUCT_TYPES } from '@/lib/constants';
import type { Product } from '@/types';
import { FileText, Calendar, Link2, Video } from 'lucide-react';

interface ProductFormProps {
  product?: Product;
}

const typeIcons = {
  digital: FileText,
  booking: Calendar,
  link: Link2,
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!product;

  // Parse type_config
  const typeConfig = product?.type_config as Record<string, unknown> || {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: product?.type || 'digital',
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price || 0,
      is_published: product?.is_published ?? true,
      duration_minutes: (typeConfig.duration_minutes as number) || 60,
      location_type: (typeConfig.location_type as 'online' | 'offline') || 'online',
      location_details: (typeConfig.location_details as string) || '',
      // Booking Online
      meeting_platform: (typeConfig.meeting_platform as string) || '',
      meeting_link: (typeConfig.meeting_link as string) || '',
      // Booking Offline
      location_name: (typeConfig.location_name as string) || '',
      location_address: (typeConfig.location_address as string) || '',
      location_notes: (typeConfig.location_notes as string) || '',
      // Live
      scheduled_at: (typeConfig.scheduled_at as string) || '',
      platform: (typeConfig.platform as string) || '',
      max_participants: (typeConfig.max_participants as number) || 100,
      // Link specific
      link_url: (typeConfig.link_url as string) || '',
      link_style: (typeConfig.link_style as 'button' | 'callout' | 'embed') || 'button',
      link_subtitle: (typeConfig.link_subtitle as string) || '',
      link_button_text: (typeConfig.link_button_text as string) || 'Click Me!',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: ProductInput) => {
    setError(null);

    const result = isEditing
      ? await updateProduct(product.id, data)
      : await createProduct(data);

    if (!result.success && result.error) {
      setError(result.error);
      return;
    }

    // If creating new product, redirect to edit page for uploading files/managing slots
    if (!isEditing && result.productId) {
      router.push(`/dashboard/products/${result.productId}/edit?new=1`);
    } else {
      router.push('/dashboard/products');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Product Type */}
      {!isEditing && (
        <div className="space-y-3">
          <Label required>ประเภทสินค้า</Label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PRODUCT_TYPES) as [keyof typeof PRODUCT_TYPES, typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES]][]).map(([type, info]) => {
              const Icon = typeIcons[type];
              return (
                <label
                  key={type}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedType === type
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('type')}
                    className="sr-only"
                  />
                  <Icon className={`h-6 w-6 ${selectedType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${selectedType === type ? 'text-primary' : ''}`}>
                    {info.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {info.description}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" required>ชื่อสินค้า</Label>
          <Input
            id="title"
            placeholder="เช่น E-book การตลาดออนไลน์"
            error={!!errors.title}
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">รายละเอียด</Label>
          <RichTextEditor
            value={watch('description') || ''}
            onChange={(value) => setValue('description', value)}
            placeholder="อธิบายสินค้าของคุณ..."
            error={!!errors.description}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Hide price for Link type */}
        {selectedType !== 'link' && (
          <div className="space-y-2">
            <Label htmlFor="price" required>ราคา (บาท)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1"
              placeholder="299"
              error={!!errors.price}
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Booking Specific */}
      {selectedType === 'booking' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">ตั้งค่าการจอง</h4>
          
          <div className="space-y-2">
            <Label>รูปแบบ</Label>
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                watch('location_type') === 'online' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
              }`}>
                <input
                  type="radio"
                  value="online"
                  {...register('location_type')}
                  className="sr-only"
                />
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Online</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                watch('location_type') === 'offline' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
              }`}>
                <input
                  type="radio"
                  value="offline"
                  {...register('location_type')}
                  className="sr-only"
                />
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Offline</span>
              </label>
            </div>
          </div>

          {/* Online Settings */}
          {watch('location_type') === 'online' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="meeting_platform">Platform</Label>
                <select
                  id="meeting_platform"
                  {...register('meeting_platform')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">เลือก Platform</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="line">LINE Video Call</option>
                  <option value="discord">Discord</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_link">Default Meeting Link (ไม่บังคับ)</Label>
                <Input
                  id="meeting_link"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  {...register('meeting_link')}
                />
                <p className="text-xs text-muted-foreground">
                  ใส่ลิงก์ประชุมเริ่มต้น หรือสามารถเพิ่มทีหลังตอนยืนยัน Order ได้
                </p>
              </div>
            </div>
          )}

          {/* Offline Settings */}
          {watch('location_type') === 'offline' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="location_name">ชื่อสถานที่</Label>
                <Input
                  id="location_name"
                  placeholder="เช่น Starbucks สยามพารากอน"
                  {...register('location_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_address">ที่อยู่/รายละเอียด</Label>
                <textarea
                  id="location_address"
                  placeholder="เช่น ชั้น 1 โซน A ใกล้ประตูทางเข้าหลัก"
                  {...register('location_address')}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_notes">หมายเหตุ/คำแนะนำ (ไม่บังคับ)</Label>
                <Input
                  id="location_notes"
                  placeholder="เช่น มีที่จอดรถฟรี 2 ชม."
                  {...register('location_notes')}
                />
              </div>
            </div>
          )}

          {!isEditing && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 ตั้งค่าระยะเวลาต่อ Slot และเพิ่มวัน/เวลาว่างได้ในขั้นตอนถัดไป
            </p>
          )}
        </div>
      )}

      {/* Link Specific */}
      {selectedType === 'link' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">ตั้งค่า Link</h4>
          
          <div className="space-y-2">
            <Label htmlFor="link_url" required>URL</Label>
            <Input
              id="link_url"
              placeholder="https://your-link.com"
              {...register('link_url')}
            />
            <p className="text-xs text-muted-foreground">
              ใส่ลิงก์ที่ต้องการ เช่น Affiliate Link, YouTube, Website
            </p>
          </div>

          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            💡 อัปโหลดรูป Thumbnail ได้ในขั้นตอนถัดไป
          </p>
        </div>
      )}

      {/* Published Status */}
      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="checkbox"
          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
          {...register('is_published')}
        />
        <div>
          <p className="font-medium">เผยแพร่สินค้า</p>
          <p className="text-sm text-muted-foreground">
            เมื่อเปิด สินค้าจะแสดงในหน้าร้านค้าของคุณ
          </p>
        </div>
      </label>

      {/* Next Step Info - Only for new products */}
      {!isEditing && (selectedType === 'digital' || selectedType === 'booking' || selectedType === 'link') && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ขั้นตอนถัดไป:</strong>{' '}
            {selectedType === 'digital' 
              ? 'อัปโหลดไฟล์ดิจิทัลที่จะส่งให้ลูกค้า' 
              : selectedType === 'booking'
              ? 'เพิ่มวัน/เวลาที่คุณว่างสำหรับให้ลูกค้าจอง'
              : 'อัปโหลดรูป Thumbnail'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing 
            ? 'บันทึกการเปลี่ยนแปลง' 
            : 'ถัดไป →'
          }
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
