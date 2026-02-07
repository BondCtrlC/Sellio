'use client';

import { useState, useEffect } from 'react';
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
  ExternalLink,
  Bell
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setLocale } from '@/actions/locale';
import { Globe } from 'lucide-react';

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

type SettingsTab = 'profile' | 'payments' | 'store' | 'seo' | 'notifications' | 'billing';

export function SettingsForm({ creator, billingInfo }: SettingsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Settings');

  const tabsList: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t('tabProfile'), icon: User },
    { id: 'payments', label: t('tabPayments'), icon: Wallet },
    { id: 'store', label: t('tabStore'), icon: Store },
    { id: 'seo', label: t('tabSEO'), icon: Search },
    { id: 'notifications', label: t('tabNotifications'), icon: Bell },
    { id: 'billing', label: t('tabBilling'), icon: CreditCard },
  ];

  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabsList.some(tab => tab.id === initialTab) ? initialTab : 'profile'
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync activeTab when URL search params change (e.g. from onboarding overlay)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab;
    if (tabFromUrl && tabsList.some(tab => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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
      notification_email: creator.notification_email || '',
      store_language: creator.store_language || 'th',
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
      
      // Sync locale cookie if language changed
      const languageChanged = data.store_language !== creator.store_language;
      if (languageChanged) {
        await setLocale(data.store_language);
      }
      
      if (data.username !== creator.username || languageChanged) {
        window.location.reload();
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const storeUrl = `${baseUrl}/u/${watchedUsername || creator.username}`;

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabsList.map((tab) => {
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
          {t('saveSuccess')}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ============================== */}
        {/* TAB: Profile */}
        {/* ============================== */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Avatar */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{t('profileImage')}</h3>
                <p className="text-sm text-muted-foreground">{t('profileImageDesc')}</p>
              </div>
              <AvatarUpload 
                currentAvatarUrl={creator.avatar_url} 
                displayName={creator.display_name}
              />
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{t('basicInfo')}</h3>
                <p className="text-sm text-muted-foreground">{t('basicInfoDesc')}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_name" required>{t('displayName')}</Label>
                <Input
                  id="display_name"
                  placeholder={t('displayNamePlaceholder')}
                  error={!!errors.display_name}
                  {...register('display_name')}
                />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  placeholder={t('bioPlaceholder')}
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
                <h3 className="font-semibold text-lg">{t('contactInfo')}</h3>
                <p className="text-sm text-muted-foreground">{t('contactInfoDesc')}</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {t('phone')}
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
                    {t('lineId')}
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
                    {t('instagram')}
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
                    {t('email')}
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
              {t('saveChanges')}
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: Payments */}
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
                  <h3 className="font-semibold text-lg">{t('promptpay')}</h3>
                  <p className="text-sm text-muted-foreground">{t('promptpayDesc')}</p>
                </div>
              </div>
              
              <div className="ml-0 space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="promptpay_phone">{t('promptpayPhone')}</Label>
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
                    {t('promptpayPhoneHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promptpay_name">{t('accountName')}</Label>
                  <Input
                    id="promptpay_name"
                    placeholder={t('accountNameOnQR')}
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
                  <h3 className="font-semibold text-lg">{t('bankAccount')}</h3>
                  <p className="text-sm text-muted-foreground">{t('bankAccountDesc')}</p>
                </div>
              </div>
              
              <div className="ml-0 space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">{t('bankName')}</Label>
                  <Input
                    id="bank_name"
                    placeholder={t('bankNamePlaceholder')}
                    error={!!errors.bank_name}
                    {...register('bank_name')}
                  />
                  {errors.bank_name && (
                    <p className="text-sm text-destructive">{errors.bank_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">{t('bankAccountNumber')}</Label>
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
                  <Label htmlFor="bank_account_name">{t('bankAccountName')}</Label>
                  <Input
                    id="bank_account_name"
                    placeholder={t('bankAccountNamePlaceholder')}
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
                <span className="font-medium">{t('paymentInfoNote')}</span>
                <br />
                <span className="text-blue-700">{t('paymentInfoNoteDesc')}</span>
              </p>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: Store */}
        {/* ============================== */}
        {activeTab === 'store' && (
          <div className="space-y-8">
            {/* Store Language */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('storeLanguage')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('storeLanguageDesc')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {(['th', 'en'] as const).map((lang) => {
                  const isSelected = watch('store_language') === lang;
                  return (
                    <label
                      key={lang}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        value={lang}
                        className="sr-only"
                        {...register('store_language')}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary' : 'border-muted-foreground/40'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium">
                        {lang === 'th' ? t('languageThai') : t('languageEnglish')}
                      </span>
                    </label>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t('languageNote')}
              </p>
            </div>

            {/* Store Status */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{t('storeStatus')}</h3>
                <p className="text-sm text-muted-foreground">{t('storeStatusDesc')}</p>
              </div>
              
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('is_published')}
                />
                <div>
                  <p className="font-medium">{t('openStore')}</p>
                  <p className="text-sm text-muted-foreground">{t('openStoreDesc')}</p>
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('openStoreNote')}
              </p>
            </div>

            {/* Store Link / Username */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {t('storeLink')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('storeLinkDesc')}</p>
              </div>

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')}</Label>
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
                  {t('usernameHint')}
                </p>
              </div>

              {/* Warning if username changed */}
              {watchedUsername && watchedUsername !== creator.username && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">{t('usernameWarning')}</p>
                    <p className="text-amber-700">
                      {t('usernameWarningDesc', { old: creator.username, new: watchedUsername })}
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
                  {t('copyLink')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {creator.is_published 
                  ? `✅ ${t('storeOpen')}` 
                  : `⚠️ ${t('storeClosed')}`}
              </p>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: SEO */}
        {/* ============================== */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">{t('seoTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('seoDesc')}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seo_title">{t('seoTitleLabel')}</Label>
              <Input
                id="seo_title"
                placeholder={t('seoTitlePlaceholder')}
                maxLength={70}
                error={!!errors.seo_title}
                {...register('seo_title')}
              />
              {errors.seo_title && (
                <p className="text-sm text-destructive">{errors.seo_title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('seoTitleHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">{t('seoDescLabel')}</Label>
              <Textarea
                id="seo_description"
                placeholder={t('seoDescPlaceholder')}
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
              <Label htmlFor="seo_keywords">{t('seoKeywords')}</Label>
              <Input
                id="seo_keywords"
                placeholder={t('seoKeywordsPlaceholder')}
                error={!!errors.seo_keywords}
                {...register('seo_keywords')}
              />
              <p className="text-xs text-muted-foreground">{t('seoKeywordsHint')}</p>
            </div>

            {/* Preview */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3 text-sm text-muted-foreground">{t('seoPreview')}</h4>
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-blue-700 text-lg font-medium truncate">
                  {creator.seo_title || creator.display_name || t('seoPreviewStoreName')} - Creator Store
                </p>
                <p className="text-green-700 text-sm truncate">
                  {storeUrl}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {creator.seo_description || creator.bio || t('seoPreviewDesc')}
                </p>
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </div>
        )}

        {/* ============================== */}
        {/* TAB: Notifications */}
        {/* ============================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-8">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('notifEmailTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('notifEmailDesc')}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">{t('notifEmailInfo')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_email">{t('notifEmail')}</Label>
                <Input
                  id="notification_email"
                  type="email"
                  placeholder="your@email.com"
                  error={!!errors.notification_email}
                  {...register('notification_email')}
                />
                {errors.notification_email && (
                  <p className="text-sm text-destructive">{errors.notification_email.message}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('notifEmailHint')}</p>
              </div>
            </div>

            {/* What you'll receive */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-lg">{t('notifTypesTitle')}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🛒</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('notifNewOrder')}</p>
                    <p className="text-xs text-muted-foreground">{t('notifNewOrderDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">💳</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('notifSlipUpload')}</p>
                    <p className="text-xs text-muted-foreground">{t('notifSlipUploadDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📅</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('notifBookingChange')}</p>
                    <p className="text-xs text-muted-foreground">{t('notifBookingChangeDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📧</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('notifCustomerEmail')}</p>
                    <p className="text-xs text-muted-foreground">{t('notifCustomerEmailDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </div>
        )}
      </form>

      {/* ============================== */}
      {/* TAB: Billing (outside form) */}
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
  const t = useTranslations('Settings');

  const handleCancel = async (immediate: boolean) => {
    const msg = immediate ? t('billingConfirmImmediate') : t('billingConfirmEnd');
    
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
          setTimeout(() => router.refresh(), 2000);
        } else {
          setCancelStatus('scheduled');
          router.refresh();
        }
      } else {
        alert(data.error || t('billingError'));
      }
    } catch {
      alert(t('billingErrorRetry'));
    } finally {
      setCancelling(false);
    }
  };

  const invoiceStatusConfig: Record<string, { label: string; className: string }> = {
    paid: { label: t('invoicePaid'), className: 'bg-green-100 text-green-700' },
    open: { label: t('invoiceOpen'), className: 'bg-amber-100 text-amber-700' },
    void: { label: t('invoiceVoid'), className: 'bg-gray-100 text-gray-600' },
    uncollectible: { label: t('invoiceUncollectible'), className: 'bg-red-100 text-red-700' },
    draft: { label: t('invoiceDraft'), className: 'bg-gray-100 text-gray-600' },
  };

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{t('billingCurrentPlan')}</h3>
          <p className="text-sm text-muted-foreground">{t('billingCurrentPlanDesc')}</p>
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
                  {isPro ? t('billingProPrice') : t('billingFreePrice')}
                </p>
                {isPro && billingInfo.planExpiresAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('billingNextRenewal', { date: new Date(billingInfo.planExpiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) })}
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
                    {cancelling ? t('billingCancelling') : t('billingCancelAtEnd')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleCancel(true)}
                    disabled={cancelling}
                    className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                  >
                    {t('billingCancelNow')}
                  </button>
                </>
              ) : isPro && cancelStatus === 'scheduled' ? (
                <>
                  <span className="text-sm text-amber-600 font-medium">{t('billingScheduled')}</span>
                  <button
                    type="button"
                    onClick={() => handleCancel(true)}
                    disabled={cancelling}
                    className="text-xs text-muted-foreground hover:text-red-600 hover:underline transition-colors"
                  >
                    {cancelling ? t('billingCancelling') : t('billingCancelNow')}
                  </button>
                </>
              ) : isPro && cancelStatus === 'cancelled' ? (
                <span className="text-sm text-green-600 font-medium">{t('billingCancelled')}</span>
              ) : (
                <Link href="/dashboard/upgrade">
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    {t('billingUpgradePro')}
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
          <p className="font-medium text-amber-800">{t('billingScheduledMsg')}</p>
          <p className="text-sm text-amber-700 mt-1">{t('billingScheduledMsgDesc')}</p>
        </div>
      )}
      {cancelStatus === 'cancelled' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium text-green-800">{t('billingCancelledMsg')}</p>
          <p className="text-sm text-green-700 mt-1">{t('billingCancelledMsgDesc')}</p>
        </div>
      )}

      {/* Invoice History */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{t('invoiceHistory')}</h3>
            <p className="text-sm text-muted-foreground">{t('invoiceHistoryDesc')}</p>
          </div>
        </div>

        {billingInfo.invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noInvoices')}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('invoiceDate')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('invoiceAmount')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('invoiceStatus')}</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {billingInfo.invoices.map((invoice) => {
                  const statusConf = invoiceStatusConfig[invoice.status] || { label: invoice.status, className: 'bg-gray-100 text-gray-600' };
                  return (
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.className}`}>
                          {statusConf.label}
                        </span>
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
                            {t('invoiceDownload')}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
