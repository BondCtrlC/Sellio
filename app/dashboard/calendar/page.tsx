'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  Video,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { getCalendarBookings, type CalendarBooking } from '@/actions/calendar';

// Thai month names
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current month's start and end dates
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Load bookings for current month
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
      
      const result = await getCalendarBookings(startDate, endDate);
      if (result.success) {
        setBookings(result.bookings);
      }
      setLoading(false);
    };
    loadBookings();
  }, [year, month, daysInMonth]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(formatDateKey(new Date()));
  };

  // Format date to YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get bookings for a specific date
  const getBookingsForDate = (dateKey: string) => {
    return bookings.filter(b => b.booking_date === dateKey);
  };

  // Get selected date's bookings
  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Format time
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const todayKey = formatDateKey(today);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ปฏิทิน</h1>
          <p className="text-muted-foreground">ดูตารางนัดหมายกับลูกค้า</p>
        </div>
        <Button variant="outline" onClick={goToToday}>
          วันนี้
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">
                {THAI_MONTHS[month]} {year + 543}
              </h2>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {THAI_DAYS.map((day, i) => (
                <div 
                  key={day} 
                  className={`text-center text-sm font-medium py-2 ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayBookings = getBookingsForDate(dateKey);
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDate;
                const hasBookings = dayBookings.length > 0;
                const dayOfWeek = new Date(year, month, day).getDay();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`
                      aspect-square p-1 rounded-lg text-sm relative transition-colors flex flex-col items-center justify-center gap-0.5
                      ${isSelected ? 'bg-primary text-white' : 'hover:bg-muted'}
                      ${isToday && !isSelected ? 'ring-2 ring-primary' : ''}
                      ${dayOfWeek === 0 && !isSelected ? 'text-red-500' : ''}
                      ${dayOfWeek === 6 && !isSelected ? 'text-blue-500' : ''}
                    `}
                  >
                    <span className="font-medium">{day}</span>
                    {hasBookings && (
                      <div 
                        className={`
                          min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold
                          ${isSelected 
                            ? 'bg-white text-green-600' 
                            : 'bg-green-500 text-white'
                          }
                        `}
                      >
                        {dayBookings.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate ? (
                <>
                  {new Date(selectedDate).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Bangkok',
                  })}
                </>
              ) : (
                'เลือกวันที่'
              )}
            </h3>

            {loading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                กำลังโหลด...
              </p>
            ) : selectedDate ? (
              selectedBookings.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  ไม่มีนัดหมายในวันนี้
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedBookings.map((booking) => {
                    const content = booking.fulfillment?.content || {};
                    const meetingType = content.meeting_type as string || 'online';
                    const meetingUrl = content.meeting_url as string;
                    const location = content.location as string;

                    return (
                      <div 
                        key={booking.id}
                        className={`p-4 rounded-lg border ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        {/* Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatTime(booking.booking_time)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                          </span>
                        </div>

                        {/* Product */}
                        <p className="font-medium text-sm mb-2">
                          {booking.product.title}
                        </p>

                        {/* Customer */}
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span>{booking.buyer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <a href={`mailto:${booking.buyer_email}`} className="hover:underline">
                              {booking.buyer_email}
                            </a>
                          </div>
                          {booking.buyer_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" />
                              <a href={`tel:${booking.buyer_phone}`} className="hover:underline">
                                {booking.buyer_phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Meeting Info */}
                        {booking.status === 'confirmed' && (
                          <div className="mt-3 pt-3 border-t">
                            {meetingType === 'online' && meetingUrl ? (
                              <a
                                href={meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <Video className="h-4 w-4" />
                                เข้าร่วมประชุม
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : meetingType === 'offline' && location ? (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <span>{location}</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                คลิกที่วันที่เพื่อดูนัดหมาย
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">นัดหมายที่กำลังจะมาถึง</h3>
          
          {loading ? (
            <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
          ) : (
            <div className="space-y-3">
              {bookings
                .filter(b => b.booking_date >= todayKey)
                .slice(0, 5)
                .map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(booking.booking_date)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {new Date(booking.booking_date).getDate()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {THAI_MONTHS[new Date(booking.booking_date).getMonth()].slice(0, 3)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{booking.product.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(booking.booking_time)} • {booking.buyer_name}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                    </span>
                  </div>
                ))}

              {bookings.filter(b => b.booking_date >= todayKey).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  ไม่มีนัดหมายที่กำลังจะมาถึง
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
