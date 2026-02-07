'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { updateSettings } from '@/actions/settings';
import { settingsSchema, type SettingsInput } from '@/lib/validations/settings';
import { AvatarUpload } from './avatar-upload';
import type { Creator, PlanType } from '@/types';
import type { InvoiceItem } from '@/actions/plan';
import Link from 'next/link';
import { 
  User, 
  Wallet, 
  Store, 
  Search,
  Phone,
  MessageCircle,
  Instagram,
  Mail,
  QrCode,
  Building2,
  Link2,
  AlertTriangle,
  CreditCard,
  Crown,
  Download,
  ExternalLink
} from 'lucide-react';

interface SettingsFormProps {
  creator: Creator;
  billingInfo?: {
    plan: PlanType;
    hasSubscription: boolean;
    planExpiresAt: string | null;
    cancelAtPeriodEnd: boolean;
    invoices: InvoiceItem[];
  };
}

type SettingsTab = 'profile' | 'payments' | 'store' | 'seo' | 'billing';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'โปรไฟล์', icon: User },
  { id: 'payments', label: 'การรับเงิน', icon: Wallet },
  { id: 'store', label: 'ร้านค้า', icon: Store },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'billing', label: 'การเรียกเก็บเงิน', icon: CreditCard },
];

export function SettingsForm({ creator, billingInfo }: SettingsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabs.some(t => t.id === initialTab) ? initialTab : 'profile'
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: creator.username,
      display_name: creator.display_name,
      bio: creator.bio || '',
      promptpay_phone: creator.promptpay_id || '',
      promptpay_name: creator.promptpay_name || '',
      bank_name: creator.bank_name || '',
      bank_account_number: creator.bank_account_number || '',
      bank_account_name: creator.bank_account_name || '',
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

  const watchedUsername = watch('username');

  const onSubmit = async (data: SettingsInput) => {
    setError(null);
    setSuccess(false);
    
    const result = await updateSettings(data);
    
    if (!result.success && result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Refresh page if username changed (to update header link, etc.)
      if (data.username !== creator.username) {
        router.refresh();
      }
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const storeUrl = `${baseUrl}/u/${watchedUsername || creator.username}`;

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-success bg-success/10 rounded-lg mb-4">
          บันทึกข้อมูลเรียบร้อยแล้ว
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ============================== */}
        {/* TAB: โปรไฟล์ */}
        {/* ============================== */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Avatar */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">รูปโปรไฟล์</h3>
                <p className="text-sm text-muted-foreground">รูปที่จะแสดงในหน้าร้านค้าของคุณ</p>
              </div>
              <AvatarUpload 
                currentAvatarUrl={creator.avatar_url} 
                displayName={creator.display_name}
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">ข้อมูลพื้นฐาน</h3>
                <p className="text-sm text-muted-foreground">ข้อมูลที่จะแสดงในหน้าร้านค้า</p>
              </div>
              
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

            {/* Contact Info */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">ช่องทางติดต่อ</h3>
                <p className="text-sm text-muted-foreground">ข้อมูลติดต่อที่ลูกค้าสามารถใช้ได้</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    เบอร์โทร
                  </Label>
                  <Input
                    id="contact_phone"
                    placeholder="0812345678"
                    error={!!errors.contact_phone}
                    {...register('contact_phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_line" className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Line ID
                  </Label>
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
                  <Label htmlFor="contact_ig" className="flex items-center gap-2">
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram
                  </Label>
                  <Input
                    id="contact_ig"
                    placeholder="@yourig"
                    error={!!errors.contact_ig}
                    {...register('contact_ig')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
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

            <Button type="submit" isLoading={isSubmitting}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: การรับเงิน */}
        {/* ============================== */}
        {activeTab === 'payments' && (
          <div className="space-y-8">
            {/* PromptPay */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-100">
                  <QrCode className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">PromptPay</h3>
                  <p className="text-sm text-muted-foreground">รับชำระเงินผ่าน QR Code พร้อมเพย์</p>
                </div>
              </div>
              
              <div className="ml-0 space-y-4 p-4 bg-gray-50 rounded-xl">
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
            </div>

            {/* Bank Transfer */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">บัญชีธนาคาร</h3>
                  <p className="text-sm text-muted-foreground">รับชำระเงินผ่านการโอนเงินธนาคาร</p>
                </div>
              </div>
              
              <div className="ml-0 space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">ชื่อธนาคาร</Label>
                  <Input
                    id="bank_name"
                    placeholder="เช่น กสิกรไทย, กรุงเทพ, ไทยพาณิชย์"
                    error={!!errors.bank_name}
                    {...register('bank_name')}
                  />
                  {errors.bank_name && (
                    <p className="text-sm text-destructive">{errors.bank_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">เลขที่บัญชี</Label>
                  <Input
                    id="bank_account_number"
                    placeholder="xxx-x-xxxxx-x"
                    maxLength={20}
                    error={!!errors.bank_account_number}
                    {...register('bank_account_number')}
                  />
                  {errors.bank_account_number && (
                    <p className="text-sm text-destructive">{errors.bank_account_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
                  <Input
                    id="bank_account_name"
                    placeholder="ชื่อ-นามสกุลเจ้าของบัญชี"
                    error={!!errors.bank_account_name}
                    {...register('bank_account_name')}
                  />
                  {errors.bank_account_name && (
                    <p className="text-sm text-destructive">{errors.bank_account_name.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">คุณสามารถตั้งค่าได้ทั้ง PromptPay และ บัญชีธนาคาร</span>
                <br />
                <span className="text-blue-700">
                  ลูกค้าจะสามารถเลือกช่องทางการชำระเงินที่สะดวกที่สุดได้เอง
                </span>
              </p>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: ร้านค้า */}
        {/* ============================== */}
        {activeTab === 'store' && (
          <div className="space-y-8">
            {/* Store Status */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">สถานะร้านค้า</h3>
                <p className="text-sm text-muted-foreground">ควบคุมการแสดงผลร้านค้าของคุณ</p>
              </div>
              
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

            {/* Store Link / Username */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  ลิงก์ร้านค้า
                </h3>
                <p className="text-sm text-muted-foreground">ตั้งชื่อลิงก์ร้านค้าของคุณ แล้วแชร์ให้ลูกค้า</p>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username">ชื่อลิงก์ (Username)</Label>
                <div className="flex items-center gap-0">
                  <span className="inline-flex items-center px-3 h-10 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                    {baseUrl}/u/
                  </span>
                  <Input
                    id="username"
                    placeholder="yourname"
                    className="rounded-l-none"
                    error={!!errors.username}
                    {...register('username', {
                      onChange: (e) => {
                        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      }
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  ใช้ได้เฉพาะ a-z, 0-9 และ _ (3-30 ตัวอักษร)
                </p>
              </div>

              {/* Warning if username changed */}
              {watchedUsername && watchedUsername !== creator.username && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">ลิงก์เดิมจะใช้งานไม่ได้</p>
                    <p className="text-amber-700">
                      หากเปลี่ยนจาก <code className="bg-amber-100 px-1 rounded">/u/{creator.username}</code> เป็น <code className="bg-amber-100 px-1 rounded">/u/{watchedUsername}</code> ลิงก์เดิมที่แชร์ไว้จะเข้าไม่ได้
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Store URL */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="text-sm flex-1 break-all">{storeUrl}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(storeUrl);
                  }}
                >
                  คัดลอก
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {creator.is_published 
                  ? '✅ ร้านค้าเปิดให้บริการอยู่' 
                  : '⚠️ ร้านค้ายังไม่เปิดให้บริการ'}
              </p>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: SEO */}
        {/* ============================== */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">SEO Settings</h3>
              <p className="text-sm text-muted-foreground">
                ตั้งค่า meta tags สำหรับหน้าร้านของคุณ เพื่อให้แสดงผลดีบน Google และ Social Media
              </p>
            </div>
            
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

            {/* Preview */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">ตัวอย่างการแสดงผลบน Google</h4>
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-blue-700 text-lg font-medium truncate">
                  {creator.seo_title || creator.display_name || 'ชื่อร้านค้า'} - Creator Store
                </p>
                <p className="text-green-700 text-sm truncate">
                  {storeUrl}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {creator.seo_description || creator.bio || 'คำอธิบายร้านค้าของคุณจะแสดงที่นี่...'}
                </p>
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        )}
      </form>

      {/* ============================== */}
      {/* TAB: การเรียกเก็บเงิน (outside form) */}
      {/* ============================== */}
      {activeTab === 'billing' && billingInfo && (
        <BillingTab billingInfo={billingInfo} />
      )}
    </div>
  );
}

// ============================================
// Billing Tab Component
// ============================================
function BillingTab({ billingInfo }: { billingInfo: NonNullable<SettingsFormProps['billingInfo']> }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<'none' | 'scheduled' | 'cancelled'>(
    billingInfo.cancelAtPeriodEnd ? 'scheduled' : 'none'
  );
  const router = useRouter();
  const isPro = billingInfo.plan === 'pro';

  const handleCancel = async (immediate: boolean) => {
    const msg = immediate
      ? 'คุณแน่ใจหรือไม่ที่จะยกเลิก Pro ทันที?\n\nแพลน Pro จะถูกยกเลิกทันทีและเปลี่ยนเป็น Free'
      : 'คุณแน่ใจหรือไม่ที่จะยกเลิก Pro?\n\nคุณจะยังใช้ Pro ได้จนถึงสิ้นสุดรอบบิลปัจจุบัน';
    
    if (!confirm(msg)) return;
    
    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.immediate) {
          setCancelStatus('cancelled');
          // Refresh after a moment so user can see the message
          setTimeout(() => router.refresh(), 2000);
        } else {
          setCancelStatus('scheduled');
          router.refresh();
        }
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
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">แพลนปัจจุบัน</h3>
          <p className="text-sm text-muted-foreground">ข้อมูลการสมัครสมาชิกของคุณ</p>
        </div>

        <div className={`p-5 rounded-xl border-2 ${isPro ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isPro ? 'bg-amber-100' : 'bg-gray-200'}`}>
                <Crown className={`h-5 w-5 ${isPro ? 'text-amber-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{isPro ? 'Sellio Pro' : 'Free'}</span>
                  {isPro && (
                    <span className="text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPro ? '99 บาท/เดือน' : '0 บาท/เดือน'}
                </p>
                {isPro && billingInfo.planExpiresAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ต่ออายุถัดไป: {new Date(billingInfo.planExpiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              {isPro && cancelStatus === 'none' ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancel(false)}
                    disabled={cancelling}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกเมื่อหมดรอบบิล'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleCancel(true)}
                    disabled={cancelling}
                    className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                  >
                    ยกเลิกทันที
                  </button>
                </>
              ) : isPro && cancelStatus === 'scheduled' ? (
                <>
                  <span className="text-sm text-amber-600 font-medium">ตั้งเวลายกเลิกแล้ว</span>
                  <button
                    type="button"
                    onClick={() => handleCancel(true)}
                    disabled={cancelling}
                    className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                  >
                    {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกทันที'}
                  </button>
                </>
              ) : isPro && cancelStatus === 'cancelled' ? (
                <span className="text-sm text-green-600 font-medium">ยกเลิกแล้ว</span>
              ) : (
                <Link href="/dashboard/upgrade">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    อัปเกรดเป็น Pro
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Status Messages */}
      {cancelStatus === 'scheduled' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-medium text-amber-800">ตั้งเวลายกเลิกเรียบร้อย</p>
          <p className="text-sm text-amber-700 mt-1">
            คุณจะยังใช้ Pro ได้จนถึงสิ้นสุดรอบบิลปัจจุบัน หลังจากนั้นจะเปลี่ยนเป็น Free อัตโนมัติ
          </p>
        </div>
      )}
      {cancelStatus === 'cancelled' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium text-green-800">ยกเลิก Subscription เรียบร้อยแล้ว</p>
          <p className="text-sm text-green-700 mt-1">
            แพลนของคุณเปลี่ยนเป็น Free แล้ว กำลังรีเฟรชหน้า...
          </p>
        </div>
      )}

      {/* Invoice History */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">ประวัติการชำระเงิน</h3>
            <p className="text-sm text-muted-foreground">รายการ invoice ทั้งหมดจาก Stripe</p>
          </div>
        </div>

        {billingInfo.invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีประวัติการชำระเงิน</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium">จำนวน</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {billingInfo.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {new Date(invoice.date).toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {invoice.amount.toLocaleString('th-TH')} {invoice.currency.toUpperCase() === 'THB' ? '฿' : invoice.currency.toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          ดาวน์โหลด
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    paid: { label: 'ชำระแล้ว', className: 'bg-green-100 text-green-700' },
    open: { label: 'รอชำระ', className: 'bg-amber-100 text-amber-700' },
    void: { label: 'ยกเลิก', className: 'bg-gray-100 text-gray-600' },
    uncollectible: { label: 'เก็บเงินไม่ได้', className: 'bg-red-100 text-red-700' },
    draft: { label: 'แบบร่าง', className: 'bg-gray-100 text-gray-600' },
  };

  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
