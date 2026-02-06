'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label, Card, CardContent } from '@/components/ui';
import { ArrowLeft, Package, Calendar, Clock, Loader2, Ticket, Check, X } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { createOrder } from '@/actions/orders';
import { validateCoupon } from '@/actions/coupons';

interface Product {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  image_url: string | null;
}

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  promptpay_id: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
}

interface SlotInfo {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  is_booked?: boolean;
}

interface CheckoutFormProps {
  product: Product;
  creator: Creator;
  slotId?: string;
  slotInfo: SlotInfo | null;
}

export function CheckoutForm({ product, creator, slotId, slotInfo }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    buyer_note: '',
    refund_promptpay: '',
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_amount: number;
    final_amount: number;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponError(null);

    try {
      const result = await validateCoupon(
        couponCode.trim(),
        creator.id,
        product.id,
        product.type,
        product.price,
        formData.buyer_email || 'temp@email.com'
      );

      if (!result.success) {
        setCouponError(result.error || 'คูปองไม่ถูกต้อง');
        return;
      }

      setAppliedCoupon({
        id: result.coupon!.id,
        code: result.coupon!.code,
        discount_amount: result.discount_amount!,
        final_amount: result.final_amount!,
      });
      setCouponCode('');
    } catch (err) {
      setCouponError('เกิดข้อผิดพลาด');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const finalPrice = appliedCoupon ? appliedCoupon.final_amount : product.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createOrder(product.id, creator.id, {
        ...formData,
        slot_id: slotId,
        coupon_id: appliedCoupon?.id,
        coupon_code: appliedCoupon?.code,
        discount_amount: appliedCoupon?.discount_amount,
      });

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาด');
        setLoading(false);
        return;
      }

      // Redirect to payment page
      router.push(`/checkout/${result.order_id}`);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        href={`/u/${creator.username}/${product.id}`}
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับ
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">สั่งซื้อ</h1>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{product.title}</h3>
              <p className="text-sm text-muted-foreground">
                โดย {creator.display_name || creator.username}
              </p>
              
              {/* Booking Info */}
              {slotInfo && (
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(slotInfo.slot_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{slotInfo.start_time.slice(0, 5)}</span>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mt-2">
                {appliedCoupon ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatPrice(appliedCoupon.final_amount)}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-bold">
                    {product.price > 0 ? formatPrice(product.price) : 'ฟรี'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Applied Coupon */}
          {appliedCoupon && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{appliedCoupon.code}</span>
                  <span className="text-sm text-green-600">
                    -฿{appliedCoupon.discount_amount.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Input */}
      {product.price > 0 && !appliedCoupon && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">มีคูปองส่วนลด?</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="กรอกรหัสคูปอง"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                disabled={couponLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
              >
                {couponLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'ใช้คูปอง'
                )}
              </Button>
            </div>
            {couponError && (
              <p className="text-sm text-destructive mt-2">{couponError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checkout Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">ข้อมูลผู้ซื้อ</h3>

            {/* Name */}
            <div>
              <Label htmlFor="buyer_name">ชื่อ *</Label>
              <Input
                id="buyer_name"
                name="buyer_name"
                value={formData.buyer_name}
                onChange={handleChange}
                placeholder="ชื่อของคุณ"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="buyer_email">อีเมล *</Label>
              <Input
                id="buyer_email"
                name="buyer_email"
                type="email"
                value={formData.buyer_email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ใช้สำหรับส่งยืนยันการสั่งซื้อ
              </p>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="buyer_phone">เบอร์โทร (ไม่บังคับ)</Label>
              <Input
                id="buyer_phone"
                name="buyer_phone"
                type="tel"
                value={formData.buyer_phone}
                onChange={handleChange}
                placeholder="0812345678"
                disabled={loading}
              />
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="buyer_note">หมายเหตุ (ไม่บังคับ)</Label>
              <textarea
                id="buyer_note"
                name="buyer_note"
                value={formData.buyer_note}
                onChange={handleChange}
                placeholder="ข้อความถึงผู้ขาย..."
                className="w-full px-3 py-2 border rounded-lg resize-none h-20 text-sm"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Refund Account Info */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">ข้อมูลสำหรับการคืนเงิน</h3>
            <p className="text-xs text-muted-foreground">
              กรอกเบอร์ PromptPay เพื่อใช้ในกรณีที่ต้องคืนเงิน
            </p>
            
            {/* Refund PromptPay */}
            <div>
              <Label htmlFor="refund_promptpay">เบอร์ PromptPay *</Label>
              <Input
                id="refund_promptpay"
                name="refund_promptpay"
                type="tel"
                value={formData.refund_promptpay}
                onChange={handleChange}
                placeholder="08x-xxx-xxxx"
                required
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-6 text-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              กำลังดำเนินการ...
            </>
          ) : (
            <>
              ดำเนินการต่อ • {finalPrice > 0 ? formatPrice(finalPrice) : 'ฟรี'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          กดปุ่มเพื่อไปยังหน้าชำระเงิน
        </p>
      </form>
    </div>
  );
}
