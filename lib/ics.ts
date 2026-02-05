/**
 * ICS Calendar File Generator
 * สร้างไฟล์ .ics สำหรับเพิ่มนัดหมายเข้า Calendar
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  url?: string;
  organizer?: {
    name: string;
    email?: string;
  };
  attendee?: {
    name: string;
    email: string;
  };
}

/**
 * Format date to ICS format (YYYYMMDDTHHmmssZ)
 */
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape special characters for ICS
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate unique ID for calendar event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@sellio.app`;
}

/**
 * Generate .ics file content
 */
export function generateICS(event: CalendarEvent): string {
  const uid = generateUID();
  const now = formatDateToICS(new Date());
  const start = formatDateToICS(event.startDate);
  const end = formatDateToICS(event.endDate);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sellio//Booking//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }

  if (event.location) {
    icsContent.push(`LOCATION:${escapeICS(event.location)}`);
  }

  if (event.url) {
    icsContent.push(`URL:${event.url}`);
  }

  if (event.organizer) {
    const organizerEmail = event.organizer.email || 'noreply@sellio.app';
    icsContent.push(`ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${organizerEmail}`);
  }

  if (event.attendee) {
    icsContent.push(`ATTENDEE;CN=${escapeICS(event.attendee.name)}:mailto:${event.attendee.email}`);
  }

  // Add reminder (1 hour before)
  icsContent.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(event.title)} เริ่มใน 1 ชั่วโมง`,
    'END:VALARM'
  );

  // Add reminder (24 hours before)
  icsContent.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(event.title)} เริ่มพรุ่งนี้`,
    'END:VALARM'
  );

  icsContent.push('END:VEVENT', 'END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * Generate .ics for a booking
 */
export function generateBookingICS(params: {
  productTitle: string;
  creatorName: string;
  buyerName: string;
  buyerEmail: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm:ss or HH:mm
  durationMinutes?: number;
  meetingUrl?: string;
  location?: string;
  notes?: string;
}): string {
  const {
    productTitle,
    creatorName,
    buyerName,
    buyerEmail,
    bookingDate,
    bookingTime,
    durationMinutes = 60,
    meetingUrl,
    location,
    notes,
  } = params;

  // Parse date and time (assume Thailand timezone UTC+7)
  const timeParts = bookingTime.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  // Create date in Thailand timezone then convert to UTC
  const dateParts = bookingDate.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const day = parseInt(dateParts[2], 10);

  // Create local date (Thailand time)
  const startDate = new Date(Date.UTC(year, month, day, hours - 7, minutes, 0));
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  // Build description
  let description = `นัดหมายกับ ${creatorName}`;
  if (notes) {
    description += `\\n\\nหมายเหตุ: ${notes}`;
  }
  if (meetingUrl) {
    description += `\\n\\nลิงก์เข้าร่วม: ${meetingUrl}`;
  }

  // Determine location
  let eventLocation = '';
  if (meetingUrl) {
    eventLocation = 'Online Meeting';
  } else if (location) {
    eventLocation = location;
  }

  return generateICS({
    title: productTitle,
    description,
    location: eventLocation,
    startDate,
    endDate,
    url: meetingUrl,
    organizer: {
      name: creatorName,
    },
    attendee: {
      name: buyerName,
      email: buyerEmail,
    },
  });
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}): string {
  const { title, description, location, startDate, endDate } = params;

  const formatForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
  });

  if (description) {
    queryParams.set('details', description);
  }

  if (location) {
    queryParams.set('location', location);
  }

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generate booking calendar URLs for different providers
 */
export function generateCalendarUrls(params: {
  productTitle: string;
  creatorName: string;
  bookingDate: string;
  bookingTime: string;
  durationMinutes?: number;
  meetingUrl?: string;
  location?: string;
}): {
  google: string;
  icsData: string;
} {
  const {
    productTitle,
    creatorName,
    bookingDate,
    bookingTime,
    durationMinutes = 60,
    meetingUrl,
    location,
  } = params;

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

  let description = `นัดหมายกับ ${creatorName}`;
  if (meetingUrl) {
    description += `\n\nลิงก์เข้าร่วม: ${meetingUrl}`;
  }

  let eventLocation = '';
  if (meetingUrl) {
    eventLocation = 'Online Meeting';
  } else if (location) {
    eventLocation = location;
  }

  return {
    google: generateGoogleCalendarUrl({
      title: productTitle,
      description,
      location: eventLocation,
      startDate,
      endDate,
    }),
    icsData: generateICS({
      title: productTitle,
      description: description.replace(/\n/g, '\\n'),
      location: eventLocation,
      startDate,
      endDate,
      url: meetingUrl,
      organizer: { name: creatorName },
    }),
  };
}
