'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { 
  Package, 
  Upload, 
  CheckCircle, 
  Clock, 
  Loader2,
  Image as ImageIcon,
  X,
  Download,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { uploadSlip, type OrderDetails } from '@/actions/orders';
import { generatePromptPayQR } from '@/lib/promptpay';
import { useTranslations } from 'next-intl';
// QR code extraction is done server-side for security.
// See lib/qr-extract.ts

interface PaymentPageProps {
  order: OrderDetails;
}

export function PaymentPage({ order }: PaymentPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Payment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifyFailed = searchParams.get('verify') === 'failed';
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isPendingPayment = order.status === 'pending_payment';
  const isPendingConfirmation = order.status === 'pending_confirmation';
  const hasSlip = order.payment?.slip_url;

  // Payment method availability — PromptPay only (phone/national ID)
  const hasPromptPay = !!order.creator.promptpay_id;
  const hasAnyPayment = hasPromptPay;

  // Generate QR code from PromptPay ID via promptpay.io (with amount embedded)
  const qrCodeUrl = hasPromptPay
    ? generatePromptPayQR(order.creator.promptpay_id!, order.total)
    : null;

  // Download QR code
  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;
    
    const filename = `promptpay-${order.id.slice(0, 8)}.png`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        const downloadUrl = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}&filename=${encodeURIComponent(filename)}`;
        const res = await fetch(downloadUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'PromptPay QR Code' });
          return;
        }
      } catch (err) {
        console.log('Share failed, falling back to download');
      }
    }
    
    // Desktop or share not available - direct download
    const link = document.createElement('a');
    link.href = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}&filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('imageOnly'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('maxSize5MB'));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('selectSlipFile'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // QR code extraction is now done SERVER-SIDE for security.
      // Client only sends the slip image + buyer email for identity verification.
      const formData = new FormData();
      formData.append('slip', selectedFile);
      formData.append('buyerEmail', order.buyer_email);

      const result = await uploadSlip(order.id, formData);

      if (!result.success) {
        setError(result.error || t('error'));
        setUploading(false);
        return;
      }

      if (result.autoConfirmed) {
        // Slip verified automatically — go directly to success page
        router.push(`/checkout/${order.id}/success`);
        return;
      }

      if (result.verifyFailed) {
        // Redirect with verify=failed param so UI shows warning
        router.push(`/checkout/${order.id}?verify=failed`);
        return;
      }

      // Refresh page to show updated status (pending_confirmation)
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('errorRetry'));
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('orderNumber', { id: order.id.slice(0, 8).toUpperCase() })}
          </p>
        </div>

        {/* Status Badge */}
        {isPendingConfirmation && (
          <div className="space-y-3 mb-6">
            {verifyFailed ? (
              <>
                {/* Verify Failed Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">{t('slipVerifyFailed')}</p>
                    <p className="text-sm text-red-700 mt-1">{t('slipVerifyFailedDesc')}</p>
                  </div>
                </div>

                {/* Info: Can close tab */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">📧 {t('canCloseTab')}</span>
                    <br />
                    <span className="text-blue-700">
                      {t('canCloseTabDesc', { email: order.buyer_email })}
                    </span>
                  </p>
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ {t('checkSpamFolder')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">{t('pendingConfirm')}</p>
                    <p className="text-sm text-yellow-700">{t('pendingConfirmDesc')}</p>
                  </div>
                </div>
                
                {/* Info: Can close tab */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">📧 {t('canCloseTab')}</span>
                    <br />
                    <span className="text-blue-700">
                      {t('canCloseTabDesc', { email: order.buyer_email })}
                    </span>
                  </p>
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ {t('checkSpamFolder')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {order.product.image_url ? (
                  <img
                    src={order.product.image_url}
                    alt={order.product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{order.product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {order.buyer_name}
                </p>
                {order.booking_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {formatDate(order.booking_date)} {order.booking_time?.slice(0, 5)}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-bold text-lg">{formatPrice(order.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        {isPendingPayment && (
          <>
            {/* PromptPay QR Code */}
            {hasPromptPay && qrCodeUrl && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-center mb-4">{t('scanPromptPay')}</h3>
                  
                  <div className="flex flex-col items-center">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed mb-3">
                      <img
                        src={qrCodeUrl}
                        alt="PromptPay QR Code"
                        className="w-48 h-48"
                      />
                    </div>

                    {/* Save QR Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQR}
                      className="mb-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('saveQR')}
                    </Button>

                    {/* Account Info */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('transferTo')}</p>
                      <p className="font-semibold">{order.creator.promptpay_name || 'PromptPay'}</p>
                      {order.creator.promptpay_id && (
                        <p className="text-muted-foreground">{order.creator.promptpay_id}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="mt-4 bg-primary/5 rounded-lg px-6 py-3 text-center">
                      <p className="text-sm text-muted-foreground">{t('amountToPay')}</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No payment method available */}
            {!hasAnyPayment && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    {t('noPaymentMethod')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upload Slip Section */}
            {hasAnyPayment && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">{t('uploadSlip')}</h3>

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewUrl ? (
                  /* Preview */
                  <div className="relative mb-4">
                    <img
                      src={previewUrl}
                      alt="Slip preview"
                      className="w-full rounded-lg border"
                    />
                    <button
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Drop Zone */
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors mb-4"
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">{t('clickSelectSlip')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('slipFormats')}
                    </p>
                  </button>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full py-6"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      {t('sendSlip')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            )}
          </>
        )}

        {/* Already uploaded slip */}
        {isPendingConfirmation && hasSlip && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">{t('slipUploaded')}</h3>
              </div>
              
              <img
                src={order.payment!.slip_url!}
                alt="Uploaded slip"
                className="w-full rounded-lg border mb-4"
              />

              <p className="text-sm text-muted-foreground text-center">
                {t('slipUploadedAt', { date: new Date(order.payment!.slip_uploaded_at!).toLocaleString('th-TH') })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Creator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">{t('contactSeller')}</p>
          <div className="flex justify-center gap-3">
            {order.creator.contact_line && (
              <a
                href={`https://line.me/ti/p/~${order.creator.contact_line.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Line: {order.creator.contact_line}
              </a>
            )}
            {order.creator.contact_ig && (
              <a
                href={`https://instagram.com/${order.creator.contact_ig.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                IG: {order.creator.contact_ig}
              </a>
            )}
          </div>
        </div>

        {/* Back to store */}
        <div className="mt-6 text-center">
          <Link 
            href={`/u/${order.creator.username}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t('backToStore')}
          </Link>
        </div>
      </div>
    </div>
  );
}
