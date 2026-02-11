'use client';

import { useState, useMemo, useEffect, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { 
  ArrowLeft, 
  FileDown, 
  Calendar, 
  ExternalLink,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { ShareButtons } from '@/components/shared/share-buttons';
import { ProductReviews } from '@/components/shared/product-reviews';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('ProductDetail');
  const Icon = config.icon;

  // Group slots by date
  const slotsByDate = useMemo(() => availableSlots.reduce((acc, slot) => {
    if (!acc[slot.slot_date]) {
      acc[slot.slot_date] = [];
    }
    acc[slot.slot_date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>), [availableSlots]);

  // Calendar state — defer `today` to client-only to avoid SSR/client timezone mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [today, setToday] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Mark as mounted and re-compute today with correct client timezone
  useEffect(() => {
    const d = new Date();
    setToday(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    setIsMounted(true);
  }, []);

  // Set of dates that have available slots
  const datesWithSlots = useMemo(() => new Set(Object.keys(slotsByDate)), [slotsByDate]);

  // Calendar helpers
  const WEEKDAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
  const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  // Format date as YYYY-MM-DD using local time (NOT UTC)
  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => toDateStr(today), [today]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday = 0, Sunday = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; dateStr: string; inMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, dateStr: toDateStr(d), inMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: toDateStr(d), inMonth: true });
    }

    // Next month padding to fill last row
    const remainder = days.length % 7;
    if (remainder > 0) {
      const fill = 7 - remainder;
      for (let i = 1; i <= fill; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, dateStr: toDateStr(d), inMonth: false });
      }
    }

    return days;
  }, [calendarMonth]);

  const canGoPrev = calendarMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  const handleDateClick = (dateStr: string) => {
    if (datesWithSlots.has(dateStr)) {
      setSelectedDate(dateStr === selectedDate ? null : dateStr);
      setSelectedSlot(null); // reset slot when changing date
    }
  };

  const handleCheckout = () => {
    // For booking/live, need to select a slot first
    if ((product.type === 'booking' || product.type === 'live') && !selectedSlot) {
      alert(t('pleaseSelectSlot'));
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
        {t('backToStore')}
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
            <span>{t('duration', { minutes: product.type_config.duration_minutes })}</span>
          </div>
        )}

        {/* Max bookings per customer info */}
        {(product.type === 'booking' || product.type === 'live') && (product.type_config?.max_bookings_per_customer as number) > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <span className="text-base">👤</span>
            <span>{t('maxPerCustomerNote', { count: product.type_config?.max_bookings_per_customer as number })}</span>
          </div>
        )}


        {/* Price */}
        <div className="text-3xl font-bold">
          {product.price > 0 ? formatPrice(product.price) : t('free')}
        </div>

        {/* Share Buttons */}
        <ShareButtons
          url={`/u/${creator.username}/${product.id}`}
          title={product.title}
          description={product.description || undefined}
        />
      </div>

      {/* Calendar Slot Selection for Booking/Live */}
      {(product.type === 'booking' || product.type === 'live') && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t('selectDateTime')}</h3>
          {(product.type_config?.minimum_advance_hours as number) > 0 && (
            <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('advanceBooking', { hours: product.type_config?.minimum_advance_hours as number })}
            </p>
          )}
          
          {Object.keys(slotsByDate).length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center bg-muted rounded-lg">
              {t('noSlotsAvailable')}
            </p>
          ) : (
            <div className="space-y-4">
              {/* Calendar */}
              <div className="border rounded-xl overflow-hidden">
                {/* Month navigation */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-sm">
                    {MONTHS_TH[calendarMonth.getMonth()]} {calendarMonth.getFullYear() + 543}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-t">
                  {WEEKDAYS_TH.map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 border-t">
                  {calendarDays.map(({ date, dateStr, inMonth }, idx) => {
                    const hasSlots = datesWithSlots.has(dateStr);
                    const isPast = date < today;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isClickable = inMonth && hasSlots && !isPast;

                    // Check if ALL slots on this date are full
                    const allFull = hasSlots && slotsByDate[dateStr]?.every(s => (s.current_bookings || 0) >= (s.max_bookings || 1));

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => isClickable && handleDateClick(dateStr)}
                        disabled={!isClickable}
                        className={`relative py-2.5 text-center text-sm transition-all ${
                          !inMonth
                            ? 'text-gray-300'
                            : isPast && !hasSlots
                            ? 'text-gray-300'
                            : hasSlots && !isPast
                            ? 'cursor-pointer'
                            : 'text-gray-400'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          isSelected && allFull
                            ? 'bg-red-500 text-white font-bold'
                            : isSelected
                            ? 'bg-primary text-white font-bold'
                            : allFull && !isPast && inMonth
                            ? 'font-semibold text-red-500 hover:bg-red-100'
                            : hasSlots && !isPast && inMonth
                            ? 'font-semibold text-primary hover:bg-primary/10'
                            : ''
                        } ${isMounted && isToday && !isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                          {date.getDate()}
                        </span>
                        {hasSlots && !isPast && !isSelected && (
                          <span className={`absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${allFull ? 'bg-red-500' : 'bg-primary'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots for selected date */}
              {selectedDate && slotsByDate[selectedDate] && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(selectedDate + 'T00:00:00+07:00'))}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slotsByDate[selectedDate].map((slot) => {
                      const maxBookings = slot.max_bookings || 1;
                      const currentBookings = slot.current_bookings || 0;
                      const remaining = maxBookings - currentBookings;
                      const isFull = remaining <= 0;
                      
                      const minAdvanceHours = (product.type_config?.minimum_advance_hours as number) || 0;
                      let isTooClose = false;
                      if (minAdvanceHours > 0) {
                        const slotDatetime = new Date(`${slot.slot_date}T${slot.start_time}+07:00`);
                        const now = new Date();
                        const hoursUntil = (slotDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
                        isTooClose = hoursUntil < minAdvanceHours;
                      }
                      
                      const bufferMinutes = (product.type_config?.buffer_minutes as number) || 0;
                      let isInBuffer = false;
                      if (bufferMinutes > 0 && !isFull) {
                        const slotsOnDay = slotsByDate[selectedDate];
                        const bookedSlots = slotsOnDay.filter(s => (s.current_bookings || 0) > 0 && s.id !== slot.id);
                        const [slotStartH, slotStartM] = slot.start_time.split(':').map(Number);
                        const slotStartMinutes = slotStartH * 60 + slotStartM;
                        
                        for (const bookedSlot of bookedSlots) {
                          const [bookedEndH, bookedEndM] = bookedSlot.end_time.split(':').map(Number);
                          const bookedEndMinutes = bookedEndH * 60 + bookedEndM;
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
                      
                      let statusText = t('slotsAvailable', { count: remaining });
                      if (isFull) statusText = t('slotFull');
                      else if (isTooClose) statusText = t('slotTooClose');
                      else if (isInBuffer) statusText = t('slotInBuffer');
                      
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => !isDisabled && setSelectedSlot(slot.id)}
                          disabled={isDisabled}
                          className={`px-3 py-2.5 text-sm rounded-lg border-2 font-medium transition-colors ${
                            isFull
                              ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : selectedSlot === slot.id
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</div>
                          <div className={`text-xs mt-0.5 ${
                            isFull
                              ? 'text-red-400'
                              : isDisabled 
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
              )}

              {/* Prompt to select a date */}
              {!selectedDate && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t('selectDatePrompt')}
                </p>
              )}
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
            {t('openLink')}
          </Button>
        ) : (
          <Button 
            onClick={handleCheckout}
            className="w-full py-6 text-lg"
            disabled={(product.type === 'booking' || product.type === 'live') && availableSlots.length === 0}
          >
            {product.type === 'digital' && t('buyNow')}
            {(product.type === 'booking' || product.type === 'live') && t('bookNow')}
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
