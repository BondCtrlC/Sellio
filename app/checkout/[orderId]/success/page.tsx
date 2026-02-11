import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getOrderForSuccessPage } from '@/actions/orders';
import { getFulfillmentByOrderId } from '@/actions/fulfillments';
import { CheckCircle, Package, Calendar, Mail, MessageCircle, Download, Video, MapPin, ExternalLink, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils';
import { CopyLinkButton } from './copy-link-button';
import { DownloadButton } from './download-button';
import { ReviewSection } from './review-section';
import { AddToCalendar } from './add-to-calendar';
import { ManageBooking } from './manage-booking';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata(): Promise<import('next').Metadata> {
  const t = await getTranslations('OrderSuccess');
  return {
    title: t('metaTitle'),
  };
}

export default async function SuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const t = await getTranslations('OrderSuccess');

  const [order, fulfillment] = await Promise.all([
    getOrderForSuccessPage(orderId),
    getFulfillmentByOrderId(orderId),
  ]);

  if (!order) {
    notFound();
  }

  const isConfirmed = order.status === 'confirmed';
  const isPendingConfirmation = order.status === 'pending_confirmation';
  const isCancelled = order.status === 'cancelled';

  // Determine icon and colors
  const getStatusDisplay = () => {
    if (isCancelled) {
      const isBookingProduct = order.product.type === 'booking' || order.product.type === 'live';
      return {
        bgColor: 'bg-red-100',
        icon: <XCircle className="h-10 w-10 text-red-600" />,
        title: isBookingProduct ? t('bookingCancelled') : t('orderCancelled'),
        subtitle: isBookingProduct ? t('bookingCancelledDesc') : t('orderCancelledDesc'),
      };
    }
    if (isConfirmed) {
      return {
        bgColor: 'bg-green-100',
        icon: <CheckCircle className="h-10 w-10 text-green-600" />,
        title: t('paymentSuccess'),
        subtitle: t('thankYou'),
      };
    }
    return {
      bgColor: 'bg-yellow-100',
      icon: <Package className="h-10 w-10 text-yellow-600" />,
      title: t('pendingPayment'),
      subtitle: t('pendingPaymentDesc'),
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${statusDisplay.bgColor}`}>
            {statusDisplay.icon}
          </div>
          
          <h1 className="text-2xl font-bold mt-4">
            {statusDisplay.title}
          </h1>
          
          <p className="text-muted-foreground mt-2">
            {statusDisplay.subtitle}
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('orderDetails')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  #{orderId.slice(0, 8).toUpperCase()}
                </span>
                <CopyLinkButton orderId={orderId} />
              </div>
            </div>

            {/* Product */}
            <div className="flex gap-4 pb-4 border-b">
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
              <div className="flex-1">
                <p className="font-medium">{order.product.title}</p>
                <p className="text-sm text-muted-foreground">
                  {t('by', { name: order.creator.display_name || order.creator.username })}
                </p>
                {order.booking_date && order.booking_time && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(order.booking_date)} {order.booking_time.slice(0, 5)} น.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Info */}
            <div className="py-4 border-b space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('name')}</span>
                <span>{order.buyer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('email')}</span>
                <span>{order.buyer_email}</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 flex justify-between">
              <span className="font-semibold">{t('total')}</span>
              <span className="font-bold text-lg">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Info + Refund CTA */}
        {isCancelled && (
          <Card className="mb-6 border-red-200 overflow-hidden">
            {/* Red header */}
            <div className="bg-red-500 px-4 py-3">
              <h4 className="font-semibold text-white text-center">
                {order.product.type === 'booking' || order.product.type === 'live' ? t('bookingCancelled') : t('orderCancelled')}
              </h4>
            </div>
            <CardContent className="p-5 space-y-4">
              {/* Refund guidance */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  {t('requestRefund')}
                </h5>
                <p className="text-sm text-amber-700 mb-3">
                  {t('requestRefundDesc', { id: orderId.slice(0, 8).toUpperCase() })}
                </p>
                
                {/* Contact buttons */}
                <div className="flex flex-col gap-2">
                  {order.creator.contact_line && (
                    <a
                      href={`https://line.me/ti/p/~${order.creator.contact_line.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t('lineRefund')}
                    </a>
                  )}
                  {order.creator.contact_ig && (
                    <a
                      href={`https://instagram.com/${order.creator.contact_ig.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('igContact')}
                    </a>
                  )}
                  {!order.creator.contact_line && !order.creator.contact_ig && (
                    <p className="text-sm text-amber-600 text-center">
                      {t('contactSellerOther')}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional info */}
              <p className="text-xs text-muted-foreground text-center">
                {t('keepReceipt')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status Info */}
        {isPendingConfirmation && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 mb-2">{t('nextSteps')}</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {t('nextStep1')}</li>
                <li>• {t('nextStep2')}</li>
                <li>• {t('nextStep3')}</li>
              </ul>
              
              {/* Add to Calendar for pending booking orders */}
              {order.booking_date && order.booking_time && (
                <div className="mt-4 pt-3 border-t border-yellow-300">
                  <p className="text-sm text-yellow-700 mb-2">📅 {t('addToCalendar')}</p>
                  <AddToCalendar
                    orderId={orderId}
                    productTitle={order.product.title}
                    bookingDate={order.booking_date}
                    bookingTime={order.booking_time}
                    durationMinutes={((order.product as any).type_config)?.duration_minutes || 60}
                    creatorName={order.creator.display_name || order.creator.username}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isConfirmed && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('checkEmail')}
              </h4>
              <p className="text-sm text-green-700">
                {t('emailSent', { email: order.buyer_email })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fulfillment Info - Digital Product (File Download) */}
        {isConfirmed && fulfillment && fulfillment.type === 'download' && (fulfillment.content as any).delivery_type !== 'redirect' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t('downloadProduct')}
              </h4>
              {(fulfillment.content as any).file_url ? (
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    {(fulfillment.content as any).file_name 
                      ? t('file', { name: (fulfillment.content as any).file_name })
                      : t('digitalFile')}
                  </p>
                  <DownloadButton 
                    token={fulfillment.access_token} 
                    fileName={(fulfillment.content as any).file_name}
                  />
                  <p className="text-xs text-blue-600">
                    {t('downloadCount', { count: (fulfillment.content as any).download_count || 0, max: (fulfillment.content as any).max_downloads || 5 })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-600">
                  {t('sellerWillSendFile')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fulfillment Info - Digital Product (Redirect URL) */}
        {isConfirmed && fulfillment && fulfillment.type === 'download' && (fulfillment.content as any).delivery_type === 'redirect' && (
          <Card className="mb-6 border-indigo-200 bg-indigo-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {t('accessProduct')}
              </h4>
              {(fulfillment.content as any).redirect_url ? (
                <div className="space-y-3">
                  <p className="text-sm text-indigo-700">
                    {(fulfillment.content as any).redirect_name || t('clickToAccess')}
                  </p>
                  <a
                    href={(fulfillment.content as any).redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('accessProduct')}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-indigo-600">
                  {t('sellerWillSendLink')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fulfillment Info - Booking */}
        {isConfirmed && fulfillment && fulfillment.type === 'booking_details' && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('bookingDetails')}
              </h4>
              
              {/* Date/Time Info */}
              {order.booking_date && order.booking_time && (
                <div className="bg-white rounded-lg p-3 mb-3 border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(order.booking_date)}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {order.booking_time.slice(0, 5)} น.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(fulfillment.content as any).meeting_url || (fulfillment.content as any).location ? (
                <div className="space-y-3 text-sm">
                  {(fulfillment.content as any).meeting_type === 'online' ? (
                    <>
                      {(fulfillment.content as any).meeting_platform && (
                        <p className="text-purple-700">
                          <span className="font-medium">{t('platform')}:</span> {(fulfillment.content as any).meeting_platform}
                        </p>
                      )}
                      {(fulfillment.content as any).meeting_url && (
                        <a
                          href={(fulfillment.content as any).meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Video className="h-4 w-4" />
                          {t('joinMeeting')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      {(fulfillment.content as any).location && (
                        <p className="text-purple-700 flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{(fulfillment.content as any).location}</span>
                        </p>
                      )}
                    </>
                  )}
                  {(fulfillment.content as any).notes && (
                    <p className="text-purple-600 mt-2">
                      <span className="font-medium">{t('notes')}:</span> {(fulfillment.content as any).notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-purple-600">
                  {t('sellerWillSendBooking')}
                </p>
              )}

              {/* Add to Calendar Button */}
              {order.booking_date && order.booking_time && (
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <AddToCalendar
                    orderId={orderId}
                    productTitle={order.product.title}
                    bookingDate={order.booking_date}
                    bookingTime={order.booking_time}
                    durationMinutes={((order.product as any).type_config)?.duration_minutes || 60}
                    meetingUrl={(fulfillment.content as any).meeting_url}
                    location={(fulfillment.content as any).location}
                    creatorName={order.creator.display_name || order.creator.username}
                  />
                  
                  {/* Manage Booking (Cancel/Reschedule) */}
                  <ManageBooking
                    orderId={orderId}
                    buyerEmail={order.buyer_email}
                    canManage={isConfirmed || isPendingConfirmation}
                    currentDate={order.booking_date}
                    currentTime={order.booking_time}
                    rescheduleCount={(order as any).reschedule_count || 0}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fulfillment Info - Live */}
        {isConfirmed && fulfillment && fulfillment.type === 'live_access' && (
          <Card className="mb-6 border-pink-200 bg-pink-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-pink-800 mb-3 flex items-center gap-2">
                <Video className="h-4 w-4" />
                {t('liveAccess')}
              </h4>
              {(fulfillment.content as any).access_url ? (
                <div className="space-y-2 text-sm">
                  {(fulfillment.content as any).platform && (
                    <p className="text-pink-700">
                      <span className="font-medium">{t('platform')}:</span> {(fulfillment.content as any).platform}
                    </p>
                  )}
                  <a
                    href={(fulfillment.content as any).access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                  >
                    <Video className="h-4 w-4" />
                    {t('watchLive')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {(fulfillment.content as any).access_code && (
                    <p className="text-pink-700">
                      <span className="font-medium">{t('accessCode')}:</span> {(fulfillment.content as any).access_code}
                    </p>
                  )}
                  {(fulfillment.content as any).notes && (
                    <p className="text-pink-600 mt-2">
                      <span className="font-medium">{t('notes')}:</span> {(fulfillment.content as any).notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-pink-600">
                  {t('sellerWillSendLive')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Review Section - Only for confirmed orders */}
        {isConfirmed && (
          <ReviewSection orderId={orderId} productTitle={order.product.title} />
        )}

        {/* Contact Creator */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t('contactSeller')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {order.creator.contact_line && (
                <a
                  href={`https://line.me/ti/p/~${order.creator.contact_line.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-full hover:bg-green-600"
                >
                  Line
                </a>
              )}
              {order.creator.contact_ig && (
                <a
                  href={`https://instagram.com/${order.creator.contact_ig.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full hover:opacity-90"
                >
                  Instagram
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to Store */}
        <div className="text-center">
          <Link href={`/u/${order.creator.username}`}>
            <Button variant="outline" className="w-full">
              {t('backToStore')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
