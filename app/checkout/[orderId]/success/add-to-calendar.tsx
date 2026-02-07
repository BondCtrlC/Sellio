'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';

interface AddToCalendarProps {
  orderId: string;
  productTitle: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm or HH:mm:ss
  durationMinutes?: number;
  meetingUrl?: string;
  location?: string;
  creatorName: string;
}

export function AddToCalendar({
  orderId,
  productTitle,
  bookingDate,
  bookingTime,
  durationMinutes = 60,
  meetingUrl,
  location,
  creatorName,
}: AddToCalendarProps) {
  const t = useTranslations('OrderSuccess');
  const [isOpen, setIsOpen] = useState(false);

  // Parse date and time
  const timeParts = bookingTime.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  const dateParts = bookingDate.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);

  // Create UTC date (Thailand is UTC+7)
  const startDate = new Date(Date.UTC(year, month, day, hours - 7, minutes, 0));
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Format for Google Calendar
  const formatForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Build description
  let description = t('appointmentWith', { name: creatorName });
  if (meetingUrl) {
    description += '\n\n' + t('joinLink', { url: meetingUrl });
  }

  // Google Calendar URL
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    productTitle
  )}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${encodeURIComponent(
    description
  )}${location ? `&location=${encodeURIComponent(location)}` : ''}`;

  // Outlook.com URL
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    productTitle
  )}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(
    description
  )}${location ? `&location=${encodeURIComponent(location)}` : ''}`;

  // Download .ics file
  const downloadICS = () => {
    window.open(`/api/calendar/${orderId}`, '_blank');
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('addCalendar')}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google Calendar</span>
          </a>

          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#0078D4"
                d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.354.228-.588.228h-8.174v-6.83l1.83 1.14 1.17-.91V9.58l-1.17-.91-1.83 1.14V3.33h8.174c.234 0 .43.076.588.228.158.152.238.346.238.576v3.253zM8.174 3.33h5.652V10H0V6.22c0-.46.162-.854.486-1.178.324-.325.72-.487 1.188-.487h6.5v-1.225zm5.652 8.175v8.174c0 .234-.076.43-.228.588-.152.158-.346.238-.576.238H1.674c-.46 0-.854-.162-1.178-.486-.325-.324-.487-.72-.487-1.188V11.505h13.826z"
              />
            </svg>
            <span>Outlook Calendar</span>
          </a>

          <button
            onClick={downloadICS}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t w-full text-left"
          >
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>{t('downloadICS')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
