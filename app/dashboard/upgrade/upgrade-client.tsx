'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import { 
  Crown, 
  Check, 
  Package, 
  Download, 
  Star, 
  Palette,
  BarChart3,
  Zap,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import type { PlanType } from '@/types';

interface UpgradeClientProps {
  plan: PlanType;
  productCount: number;
  hasSubscription: boolean;
  planExpiresAt: string | null;
}

const PRO_FEATURES = [
  { icon: Package, label: 'สินค้าไม่จำกัด', description: 'สร้างสินค้าและบริการได้ไม่จำกัดจำนวน' },
  { icon: Download, label: 'Export ข้อมูลลูกค้า', description: 'ส่งออกรายชื่อลูกค้าเป็น CSV' },
  { icon: Star, label: 'จัดการรีวิว', description: 'ตอบกลับ, เลือก Featured, เผยแพร่/ซ่อนรีวิว' },
  { icon: Palette, label: 'ลบ Branding', description: 'ลบข้อความ "Powered by Sellio" ออกจากหน้าร้าน' },
  { icon: BarChart3, label: 'Analytics ขั้นสูง', description: 'ดูสถิติเชิงลึกเพื่อขยายธุรกิจ' },
  { icon: Shield, label: 'Priority Support', description: 'ได้รับการช่วยเหลือก่อนใคร' },
];

const FREE_FEATURES = [
  'สินค้าสูงสุด 2 ชิ้น',
  'หน้าร้านค้าออนไลน์',
  'PromptPay QR + โอนธนาคาร',
  'คูปอง',
  'ปฏิทินนัดหมาย',
];

export function UpgradeClient({ plan, productCount, hasSubscription, planExpiresAt }: UpgradeClientProps) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');

  const isPro = plan === 'pro';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิก Pro? คุณจะยังใช้ได้จนถึงวันหมดอายุ')) return;
    
    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        กลับหน้า Dashboard
      </Link>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <p className="font-medium text-green-800">อัปเกรดสำเร็จ! ยินดีต้อนรับสู่ Sellio Pro</p>
          <p className="text-sm text-green-700 mt-1">คุณสามารถใช้งานฟีเจอร์ทั้งหมดได้แล้ว</p>
        </div>
      )}
      
      {cancelled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <p className="font-medium text-amber-800">การชำระเงินถูกยกเลิก</p>
          <p className="text-sm text-amber-700 mt-1">คุณสามารถลองอัปเกรดใหม่ได้ทุกเมื่อ</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
          <Crown className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {isPro ? 'คุณเป็นสมาชิก Pro แล้ว!' : 'อัปเกรดเป็น Pro'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isPro 
            ? 'ใช้งานฟีเจอร์ทั้งหมดได้ไม่จำกัด' 
            : 'ปลดล็อกทุกฟีเจอร์เพียง 99 บาท/เดือน'}
        </p>
      </div>

      {/* Current Plan Status */}
      {isPro && (
        <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-lg">Sellio Pro</span>
                </div>
                <p className="text-sm text-muted-foreground">99 บาท/เดือน</p>
                {planExpiresAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ต่ออายุถัดไป: {new Date(planExpiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={cancelling}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิก Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Free Plan */}
        <Card className={`relative ${!isPro ? 'border-primary ring-1 ring-primary' : ''}`}>
          {!isPro && (
            <div className="absolute -top-3 left-4">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                แพลนปัจจุบัน
              </span>
            </div>
          )}
          <CardContent className="pt-8">
            <h3 className="text-xl font-bold mb-1">Free</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">0</span>
              <span className="text-muted-foreground ml-1">บาท/เดือน</span>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative ${isPro ? 'border-amber-400 ring-2 ring-amber-400' : 'border-amber-200'}`}>
          {isPro && (
            <div className="absolute -top-3 left-4">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                แพลนปัจจุบัน
              </span>
            </div>
          )}
          <div className="absolute -top-3 right-4">
            <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              แนะนำ
            </span>
          </div>
          <CardContent className="pt-8">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Pro
            </h3>
            <div className="mb-1">
              <span className="text-3xl font-bold">99</span>
              <span className="text-muted-foreground ml-1">บาท/เดือน</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">เท่ากับวันละ 3.3 บาท</p>
            
            <ul className="space-y-3 mb-6">
              {PRO_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{feature.label}</span>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {!isPro && (
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                size="lg"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  'กำลังเปิดหน้าชำระเงิน...'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    อัปเกรดเป็น Pro เลย
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">คำถามที่พบบ่อย</h2>
        <div className="space-y-3">
          <details className="p-4 border rounded-lg group">
            <summary className="font-medium cursor-pointer">เปลี่ยนแพลนได้ตลอดไหม?</summary>
            <p className="text-sm text-muted-foreground mt-2">
              ได้ครับ คุณสามารถอัปเกรดหรือยกเลิกได้ตลอดเวลา หากยกเลิก จะยังใช้ Pro ได้จนถึงวันหมดอายุ
            </p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">ถ้ายกเลิก Pro สินค้าจะหายไหม?</summary>
            <p className="text-sm text-muted-foreground mt-2">
              ไม่หายครับ สินค้าทั้งหมดยังอยู่ แต่ถ้ามีเกิน 2 ชิ้น จะไม่สามารถสร้างใหม่ได้จนกว่าจะอัปเกรดหรือลบสินค้าลง
            </p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">ชำระเงินอย่างไร?</summary>
            <p className="text-sm text-muted-foreground mt-2">
              ชำระผ่านบัตรเครดิต/เดบิต ผ่าน Stripe ซึ่งเป็นระบบชำระเงินที่ปลอดภัยระดับโลก ตัดบัตรอัตโนมัติทุกเดือน
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
