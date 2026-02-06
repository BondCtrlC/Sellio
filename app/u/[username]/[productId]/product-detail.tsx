'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { 
  ArrowLeft, 
  FileDown, 
  Calendar, 
  ExternalLink,
  Package,
  Clock
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShareButtons } from '@/components/shared/share-buttons';
import { ProductReviews } from '@/components/shared/product-reviews';

// Memoized Description component to prevent video reload on slot change
const ProductDescription = memo(function ProductDescription({ html }: { html: string }) {
  return (
    <div 
      className="prose prose-sm max-w-none text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

interface Product {
  id: string;
  title: string;
  description: string | null;
  type: 'digital' | 'booking' | 'live' | 'link'; // keep 'live' for backward compatibility
  price: number;
  image_url: string | null;
  type_config: Record<string, unknown> | null;
}

interface Creator {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  promptpay_id: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
}

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  current_bookings: number;
}

interface ProductDetailProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
  creator: Creator;
  availableSlots: Slot[];
}

const typeConfig = {
  digital: {
    icon: FileDown,
    label: 'Digital Product',
    color: 'bg-blue-500',
  },
  booking: {
    icon: Calendar,
    label: 'Booking/Live',
    color: 'bg-green-500',
  },
  live: {
    icon: Calendar,
    label: 'Booking/Live',
    color: 'bg-green-500',
  },
  link: {
    icon: ExternalLink,
    label: 'Link',
    color: 'bg-orange-500',
  },
};

export function ProductDetail({ product, creator, availableSlots }: ProductDetailProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config.icon;

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const handleCheckout = () => {
    // For booking/live, need to select a slot first
    if ((product.type === 'booking' || product.type === 'live') && !selectedSlot) {
      alert('กรุณาเลือกวัน/เวลาก่อน');
      return;
    }

    // Navigate to checkout
    const checkoutUrl = selectedSlot 
      ? `/u/${creator.username}/${product.id}/checkout?slot=${selectedSlot}`
      : `/u/${creator.username}/${product.id}/checkout`;
    
    window.location.href = checkoutUrl;
  };

  const handleLinkClick = () => {
    const linkUrl = product.type_config?.link_url as string;
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Link 
        href={`/u/${creator.username}`}
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับไปร้านค้า
      </Link>

      {/* Product Image */}
      <div className="aspect-video rounded-2xl overflow-hidden bg-muted mb-6">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-4 mb-6">
        {/* Type Badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm text-white ${config.color}`}>
          <Icon className="h-4 w-4" />
          {config.label}
        </span>

        {/* Title */}
        <h1 className="text-2xl font-bold">{product.title}</h1>

        {/* Description - Memoized to prevent video reload on slot change */}
        {product.description && (
          <ProductDescription html={product.description} />
        )}

        {/* Type-specific info */}
        {(product.type === 'booking' || product.type === 'live') && product.type_config?.duration_minutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>ระยะเวลา {product.type_config.duration_minutes} นาที</span>
          </div>
        )}


        {/* Price */}
        <div className="text-3xl font-bold">
          {product.price > 0 ? formatPrice(product.price) : 'ฟรี'}
        </div>

        {/* Share Buttons */}
        <ShareButtons
          url={`/u/${creator.username}/${product.id}`}
          title={product.title}
          description={product.description || undefined}
        />
      </div>

      {/* Slot Selection for Booking/Live */}
      {(product.type === 'booking' || product.type === 'live') && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">เลือกวัน/เวลา</h3>
          {(product.type_config?.minimum_advance_hours as number) > 0 && (
            <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ต้องจองล่วงหน้าอย่างน้อย {product.type_config?.minimum_advance_hours as number} ชั่วโมง
            </p>
          )}
          
          {Object.keys(slotsByDate).length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center bg-muted rounded-lg">
              ไม่มีช่วงเวลาที่ว่างในขณะนี้
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDate).map(([date, slots]) => (
                <div key={date}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {formatDate(date)}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const maxBookings = slot.max_bookings || 1;
                      const currentBookings = slot.current_bookings || 0;
                      const remaining = maxBookings - currentBookings;
                      const isFull = remaining <= 0;
                      
                      // Check minimum advance booking
                      const minAdvanceHours = (product.type_config?.minimum_advance_hours as number) || 0;
                      let isTooClose = false;
                      if (minAdvanceHours > 0) {
                        const slotDatetime = new Date(`${slot.slot_date}T${slot.start_time}+07:00`);
                        const now = new Date();
                        const hoursUntil = (slotDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
                        isTooClose = hoursUntil < minAdvanceHours;
                      }
                      
                      // Check buffer time conflict
                      const bufferMinutes = (product.type_config?.buffer_minutes as number) || 0;
                      let isInBuffer = false;
                      if (bufferMinutes > 0 && !isFull) {
                        // Get all booked slots on the same day
                        const bookedSlots = slots.filter(s => (s.current_bookings || 0) > 0 && s.id !== slot.id);
                        
                        // Convert slot start time to minutes from midnight
                        const [slotStartH, slotStartM] = slot.start_time.split(':').map(Number);
                        const slotStartMinutes = slotStartH * 60 + slotStartM;
                        
                        // Check if this slot starts within buffer time after any booked slot ends
                        for (const bookedSlot of bookedSlots) {
                          const [bookedEndH, bookedEndM] = bookedSlot.end_time.split(':').map(Number);
                          const bookedEndMinutes = bookedEndH * 60 + bookedEndM;
                          
                          // Slot is blocked if it starts before (booked end + buffer)
                          // and starts after booked start (to only block AFTER, not before)
                          const [bookedStartH, bookedStartM] = bookedSlot.start_time.split(':').map(Number);
                          const bookedStartMinutes = bookedStartH * 60 + bookedStartM;
                          
                          if (slotStartMinutes >= bookedStartMinutes && 
                              slotStartMinutes < bookedEndMinutes + bufferMinutes) {
                            isInBuffer = true;
                            break;
                          }
                        }
                      }
                      
                      const isDisabled = isFull || isTooClose || isInBuffer;
                      
                      // Determine status text
                      let statusText = `ว่าง ${remaining} ที่นั่ง`;
                      if (isFull) statusText = 'เต็ม';
                      else if (isTooClose) statusText = 'จองล่วงหน้าไม่ทัน';
                      else if (isInBuffer) statusText = 'ติดช่วงพักนัด';
                      
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => !isDisabled && setSelectedSlot(slot.id)}
                          disabled={isDisabled}
                          className={`px-3 py-2 text-sm rounded-lg border-2 font-medium transition-colors ${
                            isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : selectedSlot === slot.id
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                          <div className={`text-xs mt-0.5 ${
                            isDisabled 
                              ? 'text-gray-400' 
                              : selectedSlot === slot.id 
                              ? 'text-white/80' 
                              : 'text-muted-foreground'
                          }`}>
                            {statusText}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="sticky bottom-4">
        {product.type === 'link' ? (
          <Button 
            onClick={handleLinkClick}
            className="w-full py-6 text-lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            เปิดลิงก์
          </Button>
        ) : (
          <Button 
            onClick={handleCheckout}
            className="w-full py-6 text-lg"
            disabled={(product.type === 'booking' || product.type === 'live') && availableSlots.length === 0}
          >
            {product.type === 'digital' && 'ซื้อเลย'}
            {(product.type === 'booking' || product.type === 'live') && 'จองเลย'}
            {product.price > 0 && ` • ${formatPrice(product.price)}`}
          </Button>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-8 pt-6 border-t">
        <ProductReviews productId={product.id} />
      </div>

      {/* Creator Info */}
      <div className="mt-8 pt-6 border-t">
        <Link 
          href={`/u/${creator.username}`}
          className="flex items-center gap-3 hover:bg-muted p-3 -m-3 rounded-lg transition-colors"
        >
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.display_name || creator.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {(creator.display_name || creator.username).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{creator.display_name || creator.username}</p>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
