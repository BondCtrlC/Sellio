'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { uploadSlip } from '@/actions/orders';
import { generatePromptPayQR } from '@/lib/promptpay';

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  buyer_name: string;
  buyer_email: string;
  booking_date: string | null;
  booking_time: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    type: string;
    image_url: string | null;
  };
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    promptpay_id: string | null;
    promptpay_name: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    contact_line: string | null;
    contact_ig: string | null;
  };
  payment: {
    id: string;
    status: string;
    slip_url: string | null;
    slip_uploaded_at: string | null;
  } | null;
}

interface PaymentPageProps {
  order: OrderDetails;
}

export function PaymentPage({ order }: PaymentPageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isPendingPayment = order.status === 'pending_payment';
  const isPendingConfirmation = order.status === 'pending_confirmation';
  const hasSlip = order.payment?.slip_url;

  // Payment method availability
  const hasPromptPay = !!order.creator.promptpay_id;
  const hasBank = !!(order.creator.bank_name && order.creator.bank_account_number && order.creator.bank_account_name);
  const hasAnyPayment = hasPromptPay || hasBank;
  
  // Default to PromptPay if available, otherwise bank
  const [paymentTab, setPaymentTab] = useState<'promptpay' | 'bank'>(hasPromptPay ? 'promptpay' : 'bank');

  // Generate QR code URL
  const qrCodeUrl = order.creator.promptpay_id 
    ? generatePromptPayQR(order.creator.promptpay_id, order.total)
    : null;

  // Download QR code via server proxy (avoids CORS issues)
  const handleDownloadQR = async () => {
    if (!qrCodeUrl) return;
    
    const filename = `promptpay-${order.id.slice(0, 8)}.png`;
    const downloadUrl = `/api/download-qr?url=${encodeURIComponent(qrCodeUrl)}&filename=${encodeURIComponent(filename)}`;
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      // Try Web Share API for mobile (allows save to album)
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'PromptPay QR Code',
          });
          return;
        }
      } catch (err) {
        console.log('Share failed, falling back to download');
      }
    }
    
    // Desktop or share not available - direct download
    const link = document.createElement('a');
    link.href = downloadUrl;
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
      setError('รองรับเฉพาะไฟล์ภาพ (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
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
      setError('กรุณาเลือกไฟล์สลิป');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('slip', selectedFile);

      const result = await uploadSlip(order.id, formData);

      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาด');
        setUploading(false);
        return;
      }

      // Refresh page to show updated status
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">ชำระเงิน</h1>
          <p className="text-muted-foreground text-sm mt-1">
            หมายเลขคำสั่งซื้อ: #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Status Badge */}
        {isPendingConfirmation && (
          <div className="space-y-3 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">รอตรวจสอบการชำระเงิน</p>
                <p className="text-sm text-yellow-700">ระบบได้รับสลิปของคุณแล้ว กรุณารอการยืนยันจากผู้ขาย</p>
              </div>
            </div>
            
            {/* Info: Can close tab */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">📧 คุณสามารถปิดหน้านี้ได้เลย</span>
                <br />
                <span className="text-blue-700">
                  เมื่อผู้ขายยืนยันการชำระเงินแล้ว เราจะส่งอีเมลแจ้งไปที่ <strong>{order.buyer_email}</strong> พร้อมลิงก์รับสินค้า/บริการ
                </span>
              </p>
            </div>
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
                  โอนผ่านธนาคาร
                </button>
              </div>
            )}

            {/* PromptPay QR Code */}
            {hasPromptPay && paymentTab === 'promptpay' && qrCodeUrl && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-center mb-4">สแกนจ่ายผ่าน PromptPay</h3>
                  
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
                      บันทึกรูป QR
                    </Button>

                    {/* Account Info */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">โอนเข้าบัญชี</p>
                      <p className="font-semibold">{order.creator.promptpay_name || 'PromptPay'}</p>
                      <p className="text-muted-foreground">{order.creator.promptpay_id}</p>
                    </div>

                    {/* Amount */}
                    <div className="mt-4 bg-primary/5 rounded-lg px-6 py-3 text-center">
                      <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer */}
            {hasBank && paymentTab === 'bank' && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-center mb-4">โอนเงินผ่านธนาคาร</h3>
                  
                  <div className="space-y-4">
                    {/* Bank Info */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ธนาคาร</span>
                        <span className="font-semibold">{order.creator.bank_name}</span>
                      </div>
                      <div className="border-t border-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">เลขที่บัญชี</span>
                        <span className="font-semibold font-mono tracking-wider">{order.creator.bank_account_number}</span>
                      </div>
                      <div className="border-t border-gray-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ชื่อบัญชี</span>
                        <span className="font-semibold">{order.creator.bank_account_name}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-primary/5 rounded-lg px-6 py-3 text-center">
                      <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
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
                    ไม่พบวิธีการชำระเงิน กรุณาติดต่อผู้ขาย
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upload Slip Section */}
            {hasAnyPayment && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">อัพโหลดสลิปการโอนเงิน</h3>

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
                    <p className="font-medium">คลิกเพื่อเลือกรูปสลิป</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      รองรับ JPG, PNG, WebP (ไม่เกิน 5MB)
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
                      กำลังอัพโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      ส่งสลิป
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
                <h3 className="font-semibold">อัพโหลดสลิปเรียบร้อยแล้ว</h3>
              </div>
              
              <img
                src={order.payment!.slip_url!}
                alt="Uploaded slip"
                className="w-full rounded-lg border mb-4"
              />

              <p className="text-sm text-muted-foreground text-center">
                อัพโหลดเมื่อ {new Date(order.payment!.slip_uploaded_at!).toLocaleString('th-TH')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Creator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">มีปัญหา? ติดต่อผู้ขาย</p>
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
            ← กลับไปร้านค้า
          </Link>
        </div>
      </div>
    </div>
  );
}
