'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  ToggleLeft, 
  ToggleRight,
  Ticket,
  Percent,
  DollarSign
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { deleteCoupon, toggleCouponActive, type Coupon } from '@/actions/coupons';
import { CouponForm } from './coupon-form';

interface CouponsListProps {
  initialCoupons: Coupon[];
}

export function CouponsList({ initialCoupons }: CouponsListProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    // Could add toast notification here
  };

  const handleToggle = async (couponId: string) => {
    const result = await toggleCouponActive(couponId);
    if (result.success) {
      setCoupons(prev => prev.map(c => 
        c.id === couponId ? { ...c, is_active: result.is_active! } : c
      ));
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('ยืนยันการลบคูปองนี้?')) return;
    
    setIsDeleting(couponId);
    const result = await deleteCoupon(couponId);
    if (result.success) {
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
    setIsDeleting(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCoupon(undefined);
  };

  const handleSuccess = () => {
    // Refresh page to get updated data
    window.location.reload();
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return { label: 'ปิดใช้งาน', variant: 'secondary' as const };
    }
    
    const now = new Date();
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { label: 'หมดอายุ', variant: 'destructive' as const };
    }
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { label: 'ยังไม่เริ่ม', variant: 'warning' as const };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'ใช้ครบแล้ว', variant: 'outline' as const };
    }
    
    return { label: 'ใช้งานได้', variant: 'success' as const };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">คูปองส่วนลด</h2>
          <p className="text-muted-foreground">จัดการคูปองสำหรับลูกค้าของคุณ</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างคูปอง
        </Button>
      </div>

      {/* Coupons Grid */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">ยังไม่มีคูปอง</h3>
            <p className="text-muted-foreground mb-4">
              สร้างคูปองส่วนลดเพื่อดึงดูดลูกค้า
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              สร้างคูปองแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <Card key={coupon.id} className={!coupon.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-primary" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{coupon.code}</span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="p-1 hover:bg-muted rounded"
                            title="คัดลอก"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        {coupon.name && (
                          <p className="text-sm text-muted-foreground">{coupon.name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  {/* Discount Info */}
                  <div className="text-2xl font-bold text-primary mb-3">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%`
                      : formatPrice(coupon.discount_value)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {coupon.discount_type === 'percentage' ? 'ส่วนลด' : 'ส่วนลดคงที่'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    {coupon.min_purchase > 0 && (
                      <p>ขั้นต่ำ: {formatPrice(coupon.min_purchase)}</p>
                    )}
                    {coupon.max_discount && (
                      <p>ลดสูงสุด: {formatPrice(coupon.max_discount)}</p>
                    )}
                    <p>
                      ใช้แล้ว: {coupon.usage_count}
                      {coupon.usage_limit && ` / ${coupon.usage_limit}`} ครั้ง
                    </p>
                    <p>
                      ระยะเวลา: {formatDate(coupon.starts_at)} - {formatDate(coupon.expires_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(coupon.id)}
                      title={coupon.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {coupon.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isDeleting === coupon.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CouponForm
          coupon={editingCoupon}
          onClose={handleFormClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
