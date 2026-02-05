'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { createCoupon, updateCoupon, type Coupon, type CouponInput } from '@/actions/coupons';
import { X } from 'lucide-react';

interface CouponFormProps {
  coupon?: Coupon;
  onClose: () => void;
  onSuccess: () => void;
}

export function CouponForm({ coupon, onClose, onSuccess }: CouponFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CouponInput>({
    defaultValues: coupon ? {
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount || undefined,
      usage_limit: coupon.usage_limit || undefined,
      per_user_limit: coupon.per_user_limit,
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
    } : {
      code: '',
      name: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      per_user_limit: 1,
      is_active: true,
    }
  });

  const discountType = watch('discount_type');

  // Convert date to Thailand timezone (UTC+7) at start of day
  const toThailandStartOfDay = (dateStr: string) => {
    // dateStr is "YYYY-MM-DD", we want 00:00:00 in Thailand time
    // Thailand is UTC+7, so we need to subtract 7 hours from midnight
    // which means the UTC time is previous day at 17:00
    return `${dateStr}T00:00:00+07:00`;
  };

  // Convert date to Thailand timezone (UTC+7) at end of day
  const toThailandEndOfDay = (dateStr: string) => {
    // For expiry, we want 23:59:59 in Thailand time
    return `${dateStr}T23:59:59+07:00`;
  };

  const onSubmit = async (data: CouponInput) => {
    setIsLoading(true);
    setError('');

    try {
      // Clean up NaN values and convert dates with Thailand timezone
      const formattedData = {
        ...data,
        discount_value: Number(data.discount_value) || 0,
        min_purchase: Number(data.min_purchase) || 0,
        max_discount: data.max_discount && !isNaN(Number(data.max_discount)) ? Number(data.max_discount) : null,
        usage_limit: data.usage_limit && !isNaN(Number(data.usage_limit)) ? Number(data.usage_limit) : null,
        per_user_limit: Number(data.per_user_limit) || 1,
        starts_at: data.starts_at ? toThailandStartOfDay(data.starts_at as string) : null,
        expires_at: data.expires_at ? toThailandEndOfDay(data.expires_at as string) : null,
      };

      const result = coupon 
        ? await updateCoupon(coupon.id, formattedData)
        : await createCoupon(formattedData);

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาด');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{coupon ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">รหัสคูปอง *</Label>
              <Input
                id="code"
                placeholder="เช่น SAVE10"
                {...register('code', { required: 'กรุณากรอกรหัสคูปอง' })}
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อคูปอง</Label>
              <Input
                id="name"
                placeholder="เช่น ลด 10% สำหรับสมาชิกใหม่"
                {...register('name')}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">ประเภทส่วนลด</Label>
                <select
                  id="discount_type"
                  {...register('discount_type')}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                >
                  <option value="percentage">เปอร์เซ็นต์ (%)</option>
                  <option value="fixed">ลดคงที่ (฿)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  มูลค่าส่วนลด {discountType === 'percentage' ? '(%)' : '(฿)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  {...register('discount_value', { 
                    required: 'กรุณากรอกมูลค่าส่วนลด',
                  })}
                />
                {errors.discount_value && (
                  <p className="text-sm text-destructive">{errors.discount_value.message}</p>
                )}
              </div>
            </div>

            {/* Max Discount (for percentage) */}
            {discountType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="max_discount">ส่วนลดสูงสุด (฿)</Label>
                <Input
                  id="max_discount"
                  type="number"
                  placeholder="ไม่จำกัด"
                  {...register('max_discount')}
                />
                <p className="text-xs text-muted-foreground">
                  เว้นว่างถ้าไม่ต้องการจำกัดส่วนลดสูงสุด
                </p>
              </div>
            )}

            {/* Min Purchase */}
            <div className="space-y-2">
              <Label htmlFor="min_purchase">ยอดขั้นต่ำ (฿)</Label>
              <Input
                id="min_purchase"
                type="number"
                placeholder="0"
                {...register('min_purchase')}
              />
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">จำนวนครั้งที่ใช้ได้</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="ไม่จำกัด"
                  {...register('usage_limit')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_user_limit">ต่อคน</Label>
                <Input
                  id="per_user_limit"
                  type="number"
                  {...register('per_user_limit')}
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">เริ่มใช้ได้</Label>
                <Input
                  id="starts_at"
                  type="date"
                  {...register('starts_at')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">หมดอายุ</Label>
                <Input
                  id="expires_at"
                  type="date"
                  {...register('expires_at')}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal">
                เปิดใช้งานคูปอง
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'กำลังบันทึก...' : coupon ? 'บันทึก' : 'สร้างคูปอง'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
