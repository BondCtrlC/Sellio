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
  Building2,
  QrCode
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { uploadSlip, type OrderDetails } from '@/actions/orders';
import { generatePromptPayQR, canGeneratePromptPayQR } from '@/lib/promptpay';
import { useTranslations } from 'next-intl';
import jsQR from 'jsqr';

/**
 * Extract QR code text from an image file using browser Canvas API + jsQR
 */
async function extractQrCodeFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      // Strategy 1: Full image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let qr = jsQR(imageData.data, imageData.width, imageData.height);
      if (qr) { resolve(qr.data); return; }

      // Strategy 2: Bottom-right 50% (QR is usually bottom-right on Thai slips)
      const cropW = Math.floor(img.width * 0.5);
      const cropH = Math.floor(img.height * 0.5);
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(img, img.width - cropW, img.height - cropH, cropW, cropH, 0, 0, cropW, cropH);
      imageData = ctx.getImageData(0, 0, cropW, cropH);
      qr = jsQR(imageData.data, imageData.width, imageData.height);
      if (qr) { resolve(qr.data); return; }

      // Strategy 3: Bottom-right 35% scaled up
      const cropW2 = Math.floor(img.width * 0.35);
      const cropH2 = Math.floor(img.height * 0.35);
      const scaleUp = 600;
      canvas.width = scaleUp;
      canvas.height = scaleUp;
      ctx.drawImage(img, img.width - cropW2, img.height - cropH2, cropW2, cropH2, 0, 0, scaleUp, scaleUp);
      imageData = ctx.getImageData(0, 0, scaleUp, scaleUp);
      qr = jsQR(imageData.data, imageData.width, imageData.height);
      if (qr) { resolve(qr.data); return; }

      // Strategy 4: Bottom half
      const halfH = Math.floor(img.height * 0.5);
      canvas.width = img.width;
      canvas.height = halfH;
      ctx.drawImage(img, 0, img.height - halfH, img.width, halfH, 0, 0, img.width, halfH);
      imageData = ctx.getImageData(0, 0, img.width, halfH);
      qr = jsQR(imageData.data, imageData.width, imageData.height);
      if (qr) { resolve(qr.data); return; }

      console.log('[QR] No QR code found in slip image');
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

interface PaymentPageProps {
  order: OrderDetails;
  emvcoQrDataUrl?: string | null;
}

export function PaymentPage({ order, emvcoQrDataUrl }: PaymentPageProps) {
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

  // Payment method availability
  const hasUploadedQR = !!order.creator.promptpay_qr_url;
  const hasPromptPay = !!order.creator.promptpay_id || hasUploadedQR || !!emvcoQrDataUrl;
  const hasBank = !!(order.creator.bank_name && order.creator.bank_account_number && order.creator.bank_account_name);
  const hasAnyPayment = hasPromptPay || hasBank;
  
  // Default to PromptPay if available, otherwise bank
  const [paymentTab, setPaymentTab] = useState<'promptpay' | 'bank'>(hasPromptPay ? 'promptpay' : 'bank');

  // QR code priority:
  // 1. EMVCo-generated QR (from uploaded QR data + amount injected) — best: has amount embedded
  // 2. Generated from phone/national ID via promptpay.io — good: has amount embedded
  // 3. Uploaded QR image as-is — fallback: no amount, customer enters manually
  const promptpayIoQrUrl = order.creator.promptpay_id && canGeneratePromptPayQR(order.creator.promptpay_id)
    ? generatePromptPayQR(order.creator.promptpay_id, order.total)
    : null;
  const qrCodeUrl = emvcoQrDataUrl || promptpayIoQrUrl || (hasUploadedQR ? order.creator.promptpay_qr_url : null);
  // Only show "enter amount manually" if using the raw uploaded image (no amount embedded)
  const isUploadedQR = !emvcoQrDataUrl && !promptpayIoQrUrl && hasUploadedQR;

  // Download QR code
  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;
    
    const filename = `promptpay-${order.id.slice(0, 8)}.png`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // For data URLs (EMVCo-generated QR), download directly
    const isDataUrl = qrCodeUrl.startsWith('data:');
    
    if (isMobile && navigator.share) {
      try {
        let blob: Blob;
        if (isDataUrl) {
          const res = await fetch(qrCodeUrl);
          blob = await res.blob();
        } else {
          const downloadUrl = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}&filename=${encodeURIComponent(filename)}`;
          const res = await fetch(downloadUrl);
          blob = await res.blob();
        }
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
    if (isDataUrl) {
      link.href = qrCodeUrl;
    } else {
      link.href = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}&filename=${encodeURIComponent(filename)}`;
    }
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
      // Extract QR code from slip image on client side (browser Canvas + jsQR)
      let qrCode: string | null = null;
      try {
        qrCode = await extractQrCodeFromFile(selectedFile);
      } catch (qrErr) {
        // QR extraction failed — will fall back to manual verification
      }

      const formData = new FormData();
      formData.append('slip', selectedFile);
      if (qrCode) {
        formData.append('qrCode', qrCode);
      }

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
            {/* Payment Method Tabs (only show if both are available) */}
            {hasPromptPay && hasBank && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPaymentTab('promptpay')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors text-sm font-medium ${
                    paymentTab === 'promptpay'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-white text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  PromptPay
                </button>
                <button
                  onClick={() => setPaymentTab('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors text-sm font-medium ${
                    paymentTab === 'bank'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-white text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  {t('bankTransfer')}
                </button>
              </div>
            )}

            {/* PromptPay QR Code */}
            {hasPromptPay && paymentTab === 'promptpay' && qrCodeUrl && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-center mb-4">{t('scanPromptPay')}</h3>
                  
                  <div className="flex flex-col items-center">
                    {/* Amount (show prominently BEFORE QR when using uploaded QR) */}
                    {isUploadedQR && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-6 py-3 text-center">
                        <p className="text-sm text-amber-700 font-medium">{t('amountToPay')}</p>
                        <p className="text-2xl font-bold text-amber-800">{formatPrice(order.total)}</p>
                      </div>
                    )}

                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl border-2 border-dashed mb-3">
                      <img
                        src={qrCodeUrl}
                        alt="PromptPay QR Code"
                        className={isUploadedQR ? "w-56 h-auto max-h-72 object-contain" : "w-48 h-48"}
                      />
                    </div>

                    {/* Save QR Button (only for generated QR, not uploaded) */}
                    {!isUploadedQR && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQR}
                        className="mb-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('saveQR')}
                      </Button>
                    )}

                    {/* Account Info */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t('transferTo')}</p>
                      <p className="font-semibold">{order.creator.promptpay_name || 'PromptPay'}</p>
                      {/* Show PromptPay ID only if it's a phone/national ID (not e-wallet 15 digits) */}
                      {order.creator.promptpay_id && order.creator.promptpay_id.replace(/[-\s]/g, '').length <= 13 && (
                        <p className="text-muted-foreground">{order.creator.promptpay_id}</p>
                      )}
                    </div>

                    {/* Amount (below QR for generated QR) */}
                    {!isUploadedQR && (
                      <div className="mt-4 bg-primary/5 rounded-lg px-6 py-3 text-center">
                        <p className="text-sm text-muted-foreground">{t('amountToPay')}</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer */}
            {hasBank && paymentTab === 'bank' && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-center mb-4">{t('bankTransferTitle')}</h3>
                  
                  <div className="space-y-4">
                    {/* Bank Info */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('bank')}</span>
                        <span className="font-semibold">{order.creator.bank_name}</span>
                      </div>
                      <div className="border-t border-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('accountNumber')}</span>
                        <span className="font-semibold font-mono tracking-wider">{order.creator.bank_account_number}</span>
                      </div>
                      <div className="border-t border-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t('accountName')}</span>
                        <span className="font-semibold">{order.creator.bank_account_name}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-primary/5 rounded-lg px-6 py-3 text-center">
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
