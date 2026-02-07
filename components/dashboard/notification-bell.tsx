'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, ShoppingCart, CreditCard, Ticket, X, CalendarCheck, CalendarX, CalendarClock, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';
import { getNotifications, type Notification } from '@/actions/notifications';
import { useTranslations } from 'next-intl';

interface NotificationBellProps {
  initialCount?: number;
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('Notifications');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const fetchInitialCount = async () => {
      const result = await getNotifications();
      if (result.success) {
        const importantTypes = ['payment_pending', 'new_order', 'new_booking', 'booking_cancelled', 'booking_rescheduled', 'new_review'];
        const importantCount = result.notifications.filter(
          n => importantTypes.includes(n.type)
        ).length;
        setCount(importantCount);
      }
    };
    fetchInitialCount();
  }, []);

  // Fetch notifications when opening
  const handleOpen = async () => {
    if (!isOpen) {
      setLoading(true);
      const result = await getNotifications();
      if (result.success) {
        setNotifications(result.notifications);
        const importantTypes = ['payment_pending', 'new_order', 'new_booking', 'booking_cancelled', 'booking_rescheduled', 'new_review'];
        const importantCount = result.notifications.filter(
          n => importantTypes.includes(n.type)
        ).length;
        setCount(importantCount);
      }
      setLoading(false);
    }
    setIsOpen(!isOpen);
  };

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getNotifications();
      if (result.success) {
        const importantTypes = ['payment_pending', 'new_order', 'new_booking', 'booking_cancelled', 'booking_rescheduled', 'new_review'];
        const importantCount = result.notifications.filter(
          n => importantTypes.includes(n.type)
        ).length;
        setCount(importantCount);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'payment_pending':
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      case 'payment_confirmed':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'coupon_expiring':
        return <Ticket className="h-4 w-4 text-orange-500" />;
      case 'new_booking':
        return <CalendarCheck className="h-4 w-4 text-purple-500" />;
      case 'booking_cancelled':
        return <CalendarX className="h-4 w-4 text-red-500" />;
      case 'booking_rescheduled':
        return <CalendarClock className="h-4 w-4 text-amber-500" />;
      case 'new_review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleOpen}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">{t('title')}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '#'}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-2">
              <Link
                href="/dashboard/orders"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-primary hover:underline py-1"
              >
                {t('viewAllOrders')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
