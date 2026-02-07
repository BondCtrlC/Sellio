'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { createCoupon, updateCoupon, type Coupon, type CouponInput } from '@/actions/coupons';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CouponFormProps {
  coupon?: Coupon;
  onClose: () => void;
  onSuccess: () => void;
}

export function CouponForm({ coupon, onClose, onSuccess }: CouponFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('Coupons');

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
    return `${dateStr}T00:00:00+07:00`;
  };

  // Convert date to Thailand timezone (UTC+7) at end of day
  const toThailandEndOfDay = (dateStr: string) => {
    return `${dateStr}T23:59:59+07:00`;
  };

  const onSubmit = async (data: CouponInput) => {
    setIsLoading(true);
    setError('');

    try {
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
        setError(result.error || t('error'));
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{coupon ? t('editCoupon') : t('createNewCoupon')}</CardTitle>
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
              <Label htmlFor="code">{t('couponCode')}</Label>
              <Input
                id="code"
                placeholder={t('codePlaceholder')}
                {...register('code', { required: t('codeRequired') })}
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('couponName')}</Label>
              <Input
                id="name"
                placeholder={t('namePlaceholder')}
                {...register('name')}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">{t('discountType')}</Label>
                <select
                  id="discount_type"
                  {...register('discount_type')}
                  className="w-full h-10 px-3 rounded-lg border bg-background"
                >
                  <option value="percentage">{t('percentage')}</option>
                  <option value="fixed">{t('fixed')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {t('discountValue', { unit: discountType === 'percentage' ? '%' : '฿' })}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  {...register('discount_value', { 
                    required: t('discountValueRequired'),
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
                <Label htmlFor="max_discount">{t('maxDiscountLabel')}</Label>
                <Input
                  id="max_discount"
                  type="number"
                  placeholder={t('unlimited')}
                  {...register('max_discount')}
                />
                <p className="text-xs text-muted-foreground">{t('maxDiscountHint')}</p>
              </div>
            )}

            {/* Min Purchase */}
            <div className="space-y-2">
              <Label htmlFor="min_purchase">{t('minPurchaseLabel')}</Label>
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
                <Label htmlFor="usage_limit">{t('usageLimit')}</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder={t('unlimited')}
                  {...register('usage_limit')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_user_limit">{t('perUser')}</Label>
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
                <Label htmlFor="starts_at">{t('startsAt')}</Label>
                <Input
                  id="starts_at"
                  type="date"
                  {...register('starts_at')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">{t('expiresAt')}</Label>
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
                {t('activateCoupon')}
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
                {t('cancelBtn')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? t('saving') : coupon ? t('save') : t('createCoupon')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
