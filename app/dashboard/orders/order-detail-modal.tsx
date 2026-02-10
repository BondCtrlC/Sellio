'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Label, Input } from '@/components/ui';
import { 
  X, 
  Package, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCcw,
  Upload,
  Image as ImageIcon,
  CreditCard
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { confirmPayment, rejectPayment, refundOrder } from '@/actions/orders';
import { FulfillmentEditor } from './fulfillment-editor';
import { QuickReply } from '@/components/dashboard';
import { useTranslations } from 'next-intl';

interface Order {
  id: string;
  status: string;
  total: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_note: string | null;
  refund_promptpay: string | null;
  booking_date: string | null;
  booking_time: string | null;
  cancel_reason: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    type: string;
    image_url: string | null;
  } | null;
  payment: {
    id: string;
    status: string;
    slip_url: string | null;
    slip_uploaded_at: string | null;
    refund_slip_url: string | null;
    slip_verified: boolean | null;
    slip_verify_ref: string | null;
  } | null;
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('Orders');
  
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundSlipFile, setRefundSlipFile] = useState<File | null>(null);
  const [refundSlipPreview, setRefundSlipPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSlipFullscreen, setShowSlipFullscreen] = useState(false);
  const [fulfillmentValid, setFulfillmentValid] = useState(true);

  // Check if this is a booking/live product that needs fulfillment info
  const needsFulfillmentInfo = order.product && 
    (order.product.type === 'booking' || order.product.type === 'live');
  
  const canConfirm = order.status === 'pending_confirmation' && 
    (!needsFulfillmentInfo || fulfillmentValid);
  const canRefund = ['confirmed', 'pending_confirmation', 'cancelled'].includes(order.status);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    const result = await confirmPayment(order.id);
    
    if (!result.success) {
      setError(result.error || t('error'));
      setConfirming(false);
      return;
    }

    router.refresh();
    onClose();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError(t('enterRejectReason'));
      return;
    }

    setRejecting(true);
    setError(null);

    const result = await rejectPayment(order.id, rejectReason);
    
    if (!result.success) {
      setError(result.error || t('error'));
      setRejecting(false);
      return;
    }

    router.refresh();
    onClose();
  };

  const handleSlipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('imageOnly'));
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError(t('maxSize5MB'));
      return;
    }

    setRefundSlipFile(file);
    setRefundSlipPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRefund = async () => {
    if (!refundSlipFile) {
      setError(t('uploadRefundSlipRequired'));
      return;
    }

    setRefunding(true);
    setError(null);

    const formData = new FormData();
    formData.append('refund_slip', refundSlipFile);
    formData.append('refund_note', refundNote);

    const result = await refundOrder(order.id, formData);
    
    if (!result.success) {
      setError(result.error || t('error'));
      setRefunding(false);
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-xl z-50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">{t('orderDetail')}</h3>
            <p className="text-sm text-muted-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Product Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {order.product?.image_url ? (
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
                <div className="flex-1">
                  <p className="font-semibold">{order.product?.title || t('product')}</p>
                  <p className="text-sm text-muted-foreground capitalize">{order.product?.type}</p>
                  <p className="font-bold text-lg mt-1">{formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Booking Info */}
              {order.booking_date && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(order.booking_date)}</span>
                  </div>
                  {order.booking_time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{order.booking_time.slice(0, 5)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">{t('buyerInfo')}</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.buyer_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.buyer_email}`} className="text-primary hover:underline">
                  {order.buyer_email}
                </a>
              </div>
              
              {order.buyer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.buyer_phone}`} className="text-primary hover:underline">
                    {order.buyer_phone}
                  </a>
                </div>
              )}
              
              {order.buyer_note && (
                <div className="flex items-start gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{order.buyer_note}</span>
                </div>
              )}

              {/* Refund PromptPay */}
              {order.refund_promptpay && (
                <div className="flex items-center gap-2 text-sm pt-2 border-t">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">
                    {t('promptPayRefund', { number: order.refund_promptpay })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reply - Auto Reply Helper */}
          <QuickReply 
            order={{
              id: order.id,
              buyer_name: order.buyer_name,
              buyer_email: order.buyer_email,
              total: order.total,
              product_title: order.product?.title || t('product'),
              product_type: order.product?.type || 'digital',
              booking_date: order.booking_date,
              booking_time: order.booking_time,
              status: order.status,
            }}
          />

          {/* Payment Slip */}
          {order.payment?.slip_url && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{t('paymentSlip')}</h4>
                    {order.payment.slip_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        {t('slipVerified')}
                      </span>
                    )}
                    {order.payment.slip_verified === false && order.payment.slip_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        {t('slipUnverified')}
                      </span>
                    )}
                  </div>
                  {order.payment.slip_uploaded_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.payment.slip_uploaded_at).toLocaleString('th-TH')}
                    </span>
                  )}
                </div>
                
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => setShowSlipFullscreen(true)}
                >
                  <img
                    src={order.payment.slip_url}
                    alt="Payment slip"
                    className="w-full rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refund Slip (if refunded) */}
          {order.status === 'refunded' && order.payment?.refund_slip_url && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-purple-800 mb-3">{t('refundSlip')}</h4>
                <img
                  src={order.payment.refund_slip_url}
                  alt="Refund slip"
                  className="w-full rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* Fulfillment Editor for booking/live orders - show from pending_confirmation */}
          {['pending_confirmation', 'confirmed'].includes(order.status) && order.product && 
           (order.product.type === 'booking' || order.product.type === 'live') && (
            <FulfillmentEditor 
              orderId={order.id} 
              productType={order.product.type}
              isPendingConfirmation={order.status === 'pending_confirmation'}
              onValidationChange={setFulfillmentValid}
            />
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && canConfirm && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-red-800">{t('rejectReasonTitle')}</h4>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReasonPlaceholder')}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg resize-none h-20 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={rejecting}
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      t('confirmReject')
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refund Form */}
          {showRefundForm && canRefund && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  {t('refundTitle')}
                </h4>

                {/* Buyer's PromptPay Info */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-500 mb-1">{t('refundTo')}</p>
                  {order.refund_promptpay ? (
                    <p className="text-lg font-bold text-purple-700 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {order.refund_promptpay}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t('noPromptPay')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{t('name', { name: order.buyer_name })}</p>
                </div>

                {/* Amount */}
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-500">{t('refundAmount')}</p>
                  <p className="text-xl font-bold text-purple-700">{formatPrice(order.total)}</p>
                </div>

                {/* Upload Refund Slip */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-800">{t('uploadRefundSlip')}</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSlipSelect}
                    className="hidden"
                  />
                  
                  {refundSlipPreview ? (
                    <div className="relative">
                      <img 
                        src={refundSlipPreview} 
                        alt="Refund slip preview" 
                        className="w-full rounded-lg border border-purple-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRefundSlipFile(null);
                          setRefundSlipPreview(null);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-purple-300 rounded-lg bg-white hover:bg-purple-50 transition-colors flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-purple-400" />
                      <span className="text-sm text-purple-600">{t('clickUploadSlip')}</span>
                      <span className="text-xs text-gray-400">{t('slipFormats')}</span>
                    </button>
                  )}
                </div>

                {/* Refund Note */}
                <div className="space-y-2">
                  <Label className="text-sm text-purple-800">{t('refundNote')}</Label>
                  <textarea
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    placeholder={t('refundNotePlaceholder')}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg resize-none h-16 text-sm bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRefundForm(false);
                      setRefundSlipFile(null);
                      setRefundSlipPreview(null);
                      setRefundNote('');
                    }}
                    className="flex-1"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRefund}
                    disabled={refunding || !refundSlipFile}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {refunding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        {t('confirmRefund')}
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-purple-600 text-center">
                  {t('refundEmailNote')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        {order.status === 'pending_confirmation' && !showRejectForm && !showRefundForm && (
          <div className="p-4 border-t space-y-2">
            {/* Warning if fulfillment info needed */}
            {needsFulfillmentInfo && !fulfillmentValid && (
              <div className="text-amber-600 text-sm text-center mb-2">
                ⚠️ {t('fillFulfillmentWarning')}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectForm(true)}
                disabled={confirming}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('reject')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                onClick={handleConfirm}
                disabled={confirming || !canConfirm}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('processing')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('confirmPayment')}
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => setShowRefundForm(true)}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t('refundTitle')}
            </Button>
          </div>
        )}

        {/* Actions for confirmed orders */}
        {order.status === 'confirmed' && !showRefundForm && (
          <div className="p-4 border-t">
            <div className="text-center text-sm text-green-600 mb-3">
              ✅ {t('paymentConfirmed')}
            </div>
            <Button
              variant="outline"
              className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => setShowRefundForm(true)}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t('refundTitle')}
            </Button>
          </div>
        )}

        {/* Actions for cancelled orders - can still refund */}
        {order.status === 'cancelled' && !showRefundForm && (
          <div className="p-4 border-t">
            <div className="text-center text-sm text-red-600 mb-3">
              ❌ {t('orderCancelled')}
            </div>
            
            {/* Cancel reason from customer */}
            {order.cancel_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-red-800 mb-1">{t('cancelReason')}</p>
                <p className="text-sm text-red-700">{order.cancel_reason}</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => setShowRefundForm(true)}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t('refundTitle')}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t('refundIfMistake')}
            </p>
          </div>
        )}

        {/* Status message for non-actionable orders */}
        {!canConfirm && order.status !== 'confirmed' && order.status !== 'cancelled' && (
          <div className="p-4 border-t text-center text-sm text-muted-foreground">
            {order.status === 'pending_payment' && `⏳ ${t('waitingPayment')}`}
            {order.status === 'refunded' && `💰 ${t('alreadyRefunded')}`}
          </div>
        )}
      </div>

      {/* Fullscreen Slip View */}
      {showSlipFullscreen && order.payment?.slip_url && (
        <div 
          className="fixed inset-0 bg-black z-[60] flex items-center justify-center p-4"
          onClick={() => setShowSlipFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            onClick={() => setShowSlipFullscreen(false)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={order.payment.slip_url}
            alt="Payment slip"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
