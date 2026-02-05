// App Configuration
export const APP_NAME = 'Thai Creator Store';
export const APP_DESCRIPTION = 'ขายของออนไลน์ผ่านลิงก์เดียว สำหรับ Content Creator ไทย';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Product Types
export const PRODUCT_TYPES = {
  digital: { label: 'Digital', description: 'ไฟล์ดาวน์โหลด เช่น E-book, Template' },
  booking: { label: 'Booking/Live', description: 'นัดหมาย, Live Session เช่น Coaching, Workshop' },
  link: { label: 'Link/URL', description: 'Affiliate, YouTube, Website อื่นๆ' },
} as const;

// Link Styles
export const LINK_STYLES = {
  button: { label: 'Button', description: 'ปุ่มกดลิงก์' },
  callout: { label: 'Callout', description: 'กล่องข้อความพร้อมรูป' },
  embed: { label: 'Embed', description: 'ฝัง YouTube, Spotify' },
} as const;

// Order Status
export const ORDER_STATUS = {
  pending_payment: { label: 'รอชำระเงิน', color: 'gray' },
  pending_confirmation: { label: 'รอตรวจสอบ', color: 'yellow' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'green' },
  cancelled: { label: 'ยกเลิก', color: 'red' },
  refunded: { label: 'คืนเงิน', color: 'purple' },
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  pending: { label: 'รอตรวจสอบ', color: 'yellow' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'green' },
  failed: { label: 'ไม่ผ่าน', color: 'red' },
} as const;

// File Upload Limits
export const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  digital: 100 * 1024 * 1024, // 100MB
  slip: 5 * 1024 * 1024, // 5MB
};

// Accepted File Types
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPTED_DIGITAL_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'video/mp4',
  'audio/mpeg',
  'image/jpeg',
  'image/png',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

// Fulfillment
export const DEFAULT_MAX_DOWNLOADS = 5;
export const DEFAULT_ACCESS_DAYS = 7;

// Routes
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  dashboardProducts: '/dashboard/products',
  dashboardOrders: '/dashboard/orders',
  dashboardSettings: '/dashboard/settings',
  store: (username: string) => `/u/${username}`,
  product: (productId: string) => `/p/${productId}`,
  checkout: (orderId: string) => `/checkout/${orderId}`,
  success: (orderId: string) => `/success/${orderId}`,
} as const;
