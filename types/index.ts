// ============================================
// ENUMS
// ============================================

export type PlanType = 'free' | 'pro';

export type ProductType = 'digital' | 'booking' | 'link';

export type OrderStatus = 
  | 'pending_payment' 
  | 'pending_confirmation' 
  | 'confirmed' 
  | 'cancelled' 
  | 'refunded';

export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export type FulfillmentType = 'download' | 'booking_details' | 'live_access';

// ============================================
// BASE ENTITY
// ============================================

interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// CREATOR
// ============================================

export interface Creator extends BaseEntity {
  user_id: string;
  
  // Profile
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  
  // Payment (PromptPay)
  promptpay_id: string | null;  // เบอร์โทร PromptPay
  promptpay_name: string | null;
  promptpay_qr_url: string | null; // URL of uploaded QR image
  promptpay_qr_data: string | null; // Raw EMVCo QR text for generating QR with amount
  
  // Payment (Bank Transfer)
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  
  // Contact
  contact_phone: string | null;
  contact_line: string | null;
  contact_ig: string | null;
  contact_email: string | null;
  
  // Settings
  is_published: boolean;
  store_theme: string;
  
  // Plan & Subscription
  plan: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_expires_at: string | null;
  
  // Design
  store_design: StoreDesign | null;
  
  // SEO
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
  
  // Email Notifications
  notification_email: string | null;
  
  // Language
  store_language: 'th' | 'en';
}

export type CreatorInsert = Omit<Creator, 'id' | 'created_at' | 'updated_at'>;
export type CreatorUpdate = Partial<Omit<Creator, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// ============================================
// PRODUCT
// ============================================

export interface Product extends BaseEntity {
  creator_id: string;
  
  // Basic Info
  type: ProductType;
  title: string;
  description: string | null;
  price: number;
  
  // Media
  image_url: string | null;
  
  // Type-specific config
  type_config: ProductTypeConfig;
  
  // Settings
  is_published: boolean;
  sort_order: number;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'creator_id' | 'created_at' | 'updated_at'>>;

// Type-specific configurations
export type ProductTypeConfig = 
  | DigitalConfig 
  | BookingConfig 
  | LiveConfig;

export interface DigitalConfig {
  // Delivery type
  delivery_type: 'file' | 'redirect';
  
  // File delivery
  file_url?: string;
  file_name?: string;
  file_size?: number;
  max_downloads?: number;
  
  // Redirect delivery
  redirect_url?: string;
  redirect_name?: string; // Display name (e.g., "Course 101")
}

export interface BookingConfig {
  duration_minutes: number;
  location_type: 'online' | 'offline';
  location_details: string;
  available_days?: string[];
  available_hours?: { start: string; end: string };
  buffer_minutes?: number;
  advance_booking_days?: number;
}

export interface LiveConfig {
  scheduled_at: string;
  duration_minutes: number;
  platform: string;
  max_participants: number;
  access_details?: string;
}

// ============================================
// ORDER
// ============================================

export interface Order extends BaseEntity {
  product_id: string;
  creator_id: string;
  
  // Buyer info
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string | null;
  buyer_note: string | null;
  
  // Order details
  status: OrderStatus;
  quantity: number;
  unit_price: number;
  total: number;
  
  // Booking specific
  booking_date: string | null;
  booking_time: string | null;
  booking_timezone: string;
  
  // Timestamps
  expires_at: string | null;
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'product_id' | 'creator_id' | 'created_at' | 'updated_at'>>;

// Order with relations
export interface OrderWithProduct extends Order {
  product: Product;
}

export interface OrderWithDetails extends Order {
  product: Product;
  payment: Payment | null;
  fulfillment: Fulfillment | null;
}

// ============================================
// PAYMENT
// ============================================

export interface Payment extends BaseEntity {
  order_id: string;
  
  // Slip
  slip_url: string | null;
  slip_uploaded_at: string | null;
  
  // Status
  status: PaymentStatus;
  
  // Confirmation
  confirmed_at: string | null;
  confirmed_by: string | null;
  rejection_reason: string | null;
  
  // Metadata
  amount: number;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'order_id' | 'created_at' | 'updated_at'>>;

// ============================================
// FULFILLMENT
// ============================================

export interface Fulfillment extends BaseEntity {
  order_id: string;
  
  // Type
  type: FulfillmentType;
  
  // Content
  content: FulfillmentContent;
  
  // Access control
  access_token: string;
  access_until: string | null;
  is_accessed: boolean;
  accessed_at: string | null;
}

export type FulfillmentInsert = Omit<Fulfillment, 'id' | 'created_at' | 'updated_at'>;
export type FulfillmentUpdate = Partial<Omit<Fulfillment, 'id' | 'order_id' | 'created_at' | 'updated_at'>>;

// Fulfillment content types
export type FulfillmentContent = 
  | DownloadContent 
  | BookingDetailsContent 
  | LiveAccessContent;

export interface DownloadContent {
  file_url: string;
  file_name: string;
  download_count: number;
  max_downloads: number;
}

export interface BookingDetailsContent {
  meeting_url: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  notes: string | null;
  calendar_event_id: string | null;
}

export interface LiveAccessContent {
  access_url: string;
  access_code: string | null;
  instructions: string | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================
// FORM TYPES
// ============================================

export interface SignupFormData {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreatorSettingsFormData {
  display_name: string;
  bio?: string;
  avatar_url?: string;
  promptpay_id?: string;
  promptpay_name?: string;
  contact_line?: string;
  contact_ig?: string;
  contact_email?: string;
  is_published: boolean;
}

export interface ProductFormData {
  type: ProductType;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  is_published: boolean;
  type_config: ProductTypeConfig;
}

export interface CheckoutFormData {
  buyer_email: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_note?: string;
  // For booking
  booking_date?: string;
  booking_time?: string;
}

export interface BookingDetailsFormData {
  meeting_url: string;
  notes?: string;
}

// ============================================
// STORE DISPLAY TYPES
// ============================================

export interface StorePageData {
  creator: Creator;
  products: Product[];
}

export interface ProductCardData {
  id: string;
  type: ProductType;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  total_revenue: number;
}

export interface OrderListItem {
  id: string;
  product_title: string;
  product_type: ProductType;
  buyer_email: string;
  buyer_name: string;
  status: OrderStatus;
  total: number;
  payment_status: PaymentStatus | null;
  created_at: string;
}

// ============================================
// STORE DESIGN TYPES
// ============================================

export interface StoreDesign {
  // Layout
  profile_layout: 'centered' | 'with_cover' | 'minimal' | 'hero';
  product_layout: 'horizontal' | 'vertical' | 'compact';
  avatar_size: 'sm' | 'md' | 'lg';
  
  // Colors
  theme_color: string;
  background_type: 'solid' | 'gradient';
  background_color: string;
  background_gradient_from: string;
  background_gradient_to: string;
  
  // Card (kept for compatibility)
  card_style: 'default' | 'minimal' | 'bordered';
  card_rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  card_shadow: 'none' | 'sm' | 'md' | 'lg';
  
  // Font
  font_family: 'default' | 'sarabun' | 'prompt' | 'noto' | 'ibm' | 'pridi';
}

export const DEFAULT_STORE_DESIGN: StoreDesign = {
  // Layout
  profile_layout: 'centered',
  product_layout: 'horizontal',
  avatar_size: 'lg',
  
  // Colors
  theme_color: '#6366f1',
  background_type: 'solid',
  background_color: '#ffffff',
  background_gradient_from: '#f8fafc',
  background_gradient_to: '#ffffff',
  
  // Card
  card_style: 'default',
  card_rounded: 'xl',
  card_shadow: 'sm',
  
  // Font
  font_family: 'default',
};

// ============================================
// STORE LAYOUT TYPES
// ============================================

export interface StoreSection {
  id: string;
  creator_id: string;
  title: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreItem {
  id: string;
  creator_id: string;
  product_id: string;
  section_id: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreItemWithProduct extends StoreItem {
  product: Product;
}

export interface StoreSectionWithItems extends StoreSection {
  items: StoreItemWithProduct[];
}

export interface StoreLayoutData {
  creator: Creator;
  sections: StoreSectionWithItems[];
  unsectionedItems: StoreItemWithProduct[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type WithRelations<T, R extends Record<string, unknown>> = T & R;

// For Supabase query returns
export type QueryResult<T> = T | null;
export type QueryResults<T> = T[];
