# Thai Creator Store - Project Status

## Overview
แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Creator ชาวไทย คล้าย Stan Store แต่ปรับให้เหมาะกับตลาดไทย

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (buckets: avatars, products, digital-files, slips)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **UI Components:** Shadcn-style custom components
- **Charts:** Recharts
- **Email:** Resend

## Project Structure
```
new/
├── app/
│   ├── dashboard/           # Creator dashboard
│   │   ├── page.tsx         # Dashboard overview
│   │   ├── products/        # Product management
│   │   ├── orders/          # Order management
│   │   ├── analytics/       # Analytics with date filter
│   │   ├── calendar/        # Booking calendar view
│   │   ├── coupons/         # Coupon management
│   │   ├── customers/       # Customer list
│   │   ├── reviews/         # Review management
│   │   ├── settings/        # Creator settings + SEO
│   │   └── my-store/        # Store preview
│   ├── u/[username]/        # Public store pages
│   │   ├── page.tsx         # Store homepage
│   │   └── [productId]/     # Product detail + checkout
│   ├── checkout/[orderId]/  # Payment flow
│   └── (auth)/              # Login/Register
├── actions/                 # Server Actions
├── components/
│   ├── ui/                  # Base UI components
│   ├── dashboard/           # Dashboard components
│   ├── landing/             # Landing page components
│   └── shared/              # Shared components
├── lib/
│   ├── supabase/            # Supabase client
│   ├── validations/         # Zod schemas
│   └── utils.ts             # Utility functions
├── types/                   # TypeScript types
└── supabase/migrations/     # SQL migrations
```

## Completed Features ✅

### 1. Dashboard Overview
- Stats cards (orders, revenue, pending)
- Today's/This week's stats
- Recent orders list
- Quick actions

### 2. Analytics Dashboard
- Revenue & Orders charts (Recharts)
- Date filter: 7, 14, 30, 90 days, all-time, custom range
- Top products, status breakdown, product type breakdown

### 3. Product Types
- **Digital** - ไฟล์ดาวน์โหลด, redirect URL
- **Booking/Live** - นัดหมาย, Live Session (รวมเป็น type เดียว)
- **Link** - Affiliate link, external URL

### 4. Booking System ✨ NEW
- **Slot Management** - สร้าง slot วัน/เวลาได้
- **Max Bookings** - กำหนดจำนวนที่นั่งต่อ slot
- **Auto-block** - เมื่อเต็มจะ block อัตโนมัติ
- **Time Range Display** - แสดงช่วงเวลา (9:00 - 10:00)
- **Seat Count Display** - แสดง "ว่าง X ที่นั่ง" หรือ "เต็ม"
- **Pre-fill Meeting Details** - กรอกลิงก์/สถานที่ล่วงหน้าได้
- **Fulfillment Validation** - บังคับกรอกข้อมูลก่อนยืนยันชำระ

### 5. Calendar View ✨ NEW
- ปฏิทินรายเดือนแสดงนัดหมาย
- Badge แสดงจำนวนนัดต่อวัน (สีเขียว)
- รายละเอียดนัดหมายเมื่อคลิกวัน
- รายการนัดหมายที่กำลังจะมาถึง

### 6. Coupon System
- Create/Edit/Delete coupons
- Discount types: fixed, percentage
- Usage limits, validity dates
- **Thailand timezone handling** (UTC+7)
- Coupon validation at checkout

### 7. Customer List
- Aggregated customer data from orders
- Search, stats summary
- Export to CSV
- Contact quick actions (email, phone)

### 8. Notification System ✨ UPDATED
- Bell icon in header with badge
- **แจ้งเตือนคำสั่งซื้อใหม่** (pending_payment - 12 ชม.)
- **แจ้งเตือนรอยืนยันสลิป** (pending_confirmation)
- Expiring coupons alerts
- Auto-refresh every 30 seconds
- Initial fetch on mount

### 9. SEO Settings
- Custom meta title, description, keywords
- Dynamic OpenGraph for store pages

### 10. Social Sharing
- Share buttons (Facebook, X, Line, Copy link)
- Available on store page and product pages

### 11. Reviews/Ratings
- Customers can review after confirmed order
- Star rating (1-5) + comment
- Creator can: toggle publish, set featured, respond
- Filter by product, filter by rating
- Product review stats display

### 12. Rich Text Editor (Product Description)
- Text formatting: Heading, Bold, Italic, Strikethrough, List
- **Image upload** to Supabase Storage
- **Video:** URL embed (YouTube, Loom) + file upload
- Media delete button on click
- **Memoized** - ป้องกัน video reload เมื่อเปลี่ยน slot

### 13. Email Notifications ✨ UPDATED
- Order confirmation email
- Payment confirmation email
- **CTA Button** - "คลิกเพื่อรับสินค้า/บริการ" link ไปหน้า success

### 14. Store Link in Header
- Always visible `/u/username` link
- Copy to clipboard button
- Open in new tab button

### 15. Landing Page ✨ NEW
- **Navbar** - Responsive navigation with mobile menu
- **Hero Section** - Gradient background, animated blobs, floating cards
- **Features** - 12 feature cards with icons
- **How It Works** - 4-step guide with video placeholder
- **Pricing** - 3 tiers (Free, Pro, Business)
- **Testimonials** - 6 reviews with stats
- **CTA Section** - Final call-to-action
- **Footer** - Links, newsletter, social media

### 16. Quick Reply / Auto-Reply Helper ✨ NEW
- **8 Template messages** - ยืนยัน, เตือน, ขอบคุณ, แจ้งปัญหา
- **Category filters** - แยกหมวดหมู่ข้อความ
- **Copy to clipboard** - คัดลอกไปวางใน Line/IG
- **Auto-fill order data** - ใส่ชื่อลูกค้า, สินค้า, ราคา อัตโนมัติ
- **Integrated in Order Modal** - ใช้งานได้จากหน้าคำสั่งซื้อ

### 17. Stripe Payment Integration ✨ NEW
- **Credit/Debit Cards** - รองรับ Visa, Mastercard, Amex
- **PromptPay via Stripe** - รองรับ PromptPay ผ่าน Stripe
- **Payment Method Selector** - ลูกค้าเลือกวิธีชำระได้
- **Webhook Handler** - ยืนยันคำสั่งซื้ออัตโนมัติเมื่อชำระเงิน
- **Auto Fulfillment** - สร้าง fulfillment หลังชำระเสร็จ
- **Secure Checkout** - หน้าชำระเงินจาก Stripe (PCI-DSS compliant)

## Database Migrations
Run these in order via Supabase SQL Editor:
1. `001_initial.sql` - Base tables
2. `002_...` through `011_...` - Various features
3. **NEW:** Add booking slot columns:
```sql
ALTER TABLE booking_slots 
ADD COLUMN IF NOT EXISTS max_bookings INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_bookings INTEGER DEFAULT 0;
```

## Pending Features 📋

### ~~Landing Page~~ ✅ COMPLETED
- ~~Hero section~~
- ~~Features showcase~~
- ~~How it works~~
- ~~CTA sections~~

### ~~Stripe/Payment Integration~~ ✅ COMPLETED
- ~~Alternative to PromptPay for international~~

### Stripe Live Mode Setup (Priority: High) - Before Launch
- [ ] ยืนยันตัวตนใน Stripe Dashboard (บัตรประชาชน)
- [ ] กรอกข้อมูลธุรกิจให้ครบ
- [ ] เชื่อมบัญชีธนาคารสำหรับรับเงิน
- [ ] Copy Live Mode keys (`pk_live_`, `sk_live_`)
- [ ] อัปเดต Environment Variables ใน Vercel
- [ ] สร้าง Webhook ใหม่สำหรับ Live Mode
- [ ] ทดสอบการชำระเงินจริง (จำนวนน้อยๆ)

### 🔥 Stripe Connect - Stan Store Model (Priority: High)
ระบบให้ Creator เชื่อมต่อ Stripe เพื่อรับเงินโดยตรง (เหมือน Stan Store)

**Flow:** `ลูกค้าจ่าย → Stripe → Creator's Connected Account (หัก Platform Fee)`

**ข้อดี:**
- Simple - ไม่ต้องสร้างระบบ Wallet
- Stripe จัดการ Payout อัตโนมัติ
- Creator ควบคุม Refund เอง
- Platform เก็บค่าธรรมเนียมผ่าน `application_fee`

#### Phase 1: Creator Stripe Connect Onboarding
- [ ] ปุ่ม "เชื่อมต่อ Stripe" ในหน้า Settings
- [ ] Stripe Connect Express Account (ง่ายที่สุด)
- [ ] บันทึก `stripe_account_id` ใน database
- [ ] ตรวจสอบสถานะ `charges_enabled`, `payouts_enabled`
- [ ] แสดงสถานะการเชื่อมต่อใน Dashboard
- [ ] Link ไป Stripe Express Dashboard (ดูรายได้, ถอนเงิน)

#### Phase 2: Payment with Connected Account
- [ ] ใช้ Destination Charges (เงินไป Creator โดยตรง)
- [ ] หัก Platform Fee ผ่าน `application_fee_amount`
- [ ] บันทึก `stripe_charge_id` ใน orders table
- [ ] Webhook: `payment_intent.succeeded` → update order

#### Phase 3: Creator Refund (Stan-like)
- [ ] ปุ่ม "Refund" ในหน้า Order Detail
- [ ] Creator กด Refund → เงินคืนจาก Creator's Stripe Balance
- [ ] Refund ได้เฉพาะเมื่อ: ไม่ได้รับสินค้า / ปัญหาทางเทคนิค
- [ ] บันทึก refund status ใน database
- [ ] หมายเหตุ: Stripe Fee ไม่คืน (Creator รับผิดชอบ)

#### Phase 4: Income Dashboard
- [ ] แสดงรายได้รวม (ดึงจาก Stripe API หรือ orders)
- [ ] แสดงค่าธรรมเนียมที่ถูกหัก
- [ ] Link ไป Stripe Express Dashboard ดูรายละเอียด
- [ ] ไม่ต้องสร้างระบบ Wallet เอง (Stripe จัดการให้)

#### Database Changes Needed
```sql
-- Update creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Update orders table for refund tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('none', 'partial', 'full'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
```

#### Files to Create/Update
```
lib/stripe-connect.ts              # Stripe Connect helpers
app/api/stripe/connect/
  ├── create-account/route.ts      # สร้าง Express Account
  ├── onboarding/route.ts          # สร้าง Account Link
  ├── refresh/route.ts             # Refresh Link (ถ้า expire)
  └── webhook/route.ts             # Connect Webhooks
app/dashboard/settings/
  └── stripe-connect.tsx           # เชื่อมต่อ Stripe Component
app/dashboard/income/
  └── page.tsx                     # แสดงรายได้ (optional)
actions/refunds.ts                 # Refund Actions
```

#### Platform Fee Structure
| รายการ | จำนวน |
|--------|-------|
| Platform Fee (Sellio) | 5% ต่อ transaction |
| Stripe Fee | ~3.4% + ฿10 |
| **Creator ได้รับ** | ~91.6% |

### 🗑️ Remove Manual PromptPay QR (Priority: Medium) - After Stripe Connect
- [ ] ลบระบบ Generate PromptPay QR แยก (ไม่ใช่ผ่าน Stripe)
- [ ] ลบ Upload Slip แบบ Manual
- [ ] เหตุผล: เงินเข้า Creator โดยตรง → อาจเกิดการโกงได้
- [ ] หมายเหตุ: ยังคง PromptPay ผ่าน Stripe ไว้ (ปลอดภัยกว่า)
- [ ] ⚠️ ทำหลังจาก Stripe Connect พร้อมใช้งานแล้ว

### LINE Notify Integration (Priority: Medium) - Business Plan
- แจ้งเตือน Creator ผ่าน LINE เมื่อมีออเดอร์ใหม่
- แจ้งเตือนเมื่อลูกค้าชำระเงิน
- Creator ใส่ LINE Notify Token ในหน้าตั้งค่า
- เป็นฟีเจอร์สำหรับ Business Plan

### LINE Messaging API (Priority: Low) - Business Plan
- ส่งข้อความหาลูกค้าโดยตรงผ่าน LINE OA
- ต้องมี LINE Official Account
- ฟรี 500 ข้อความ/เดือน

### ~~Auto-Reply Helper~~ ✅ COMPLETED
- ~~Generate response messages~~
- ~~Copy button for quick replies~~

## Known Issues / Notes

### Timezone
- All date handling for Thai users uses UTC+7
- Coupon start/end dates converted with `+07:00` offset
- See `coupon-form.tsx` for `toThailandStartOfDay()` helper

### Backward Compatibility
- Product type "live" ยังรองรับในฐานข้อมูลเก่า
- จะถูก treat เหมือน "booking" ใน UI
- ไม่สามารถสร้างสินค้า type "live" ใหม่ได้

### Hydration
- `suppressHydrationWarning` added to html/body
- ป้องกัน error จาก browser extensions

### Storage Buckets
Required Supabase Storage buckets:
- `avatars` - Creator profile images
- `products` - Product images, description media
- `digital-files` - Downloadable files for digital products
- `slips` - Payment slip uploads

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=

# Stripe (optional - for card payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Quick Commands
```bash
# Development
cd new
npm run dev

# Open at http://localhost:3000
```

## File Locations for Common Tasks

| Task | File(s) |
|------|---------|
| Add dashboard menu | `components/dashboard/sidebar.tsx` |
| Add server action | `actions/*.ts` |
| Add UI component | `components/ui/*.tsx` + export in `index.ts` |
| Add validation schema | `lib/validations/*.ts` |
| Add type definitions | `types/index.ts` |
| Database migration | `supabase/migrations/*.sql` |
| Booking slots | `actions/booking-slots.ts`, `booking-slots-manager.tsx` |
| Calendar | `app/dashboard/calendar/page.tsx`, `actions/calendar.ts` |
| Notifications | `actions/notifications.ts`, `notification-bell.tsx` |
| Email | `lib/email.ts` |
| Landing Page | `app/page.tsx`, `components/landing/*.tsx` |
| Quick Reply | `components/dashboard/quick-reply.tsx` |
| Stripe | `lib/stripe.ts`, `app/api/stripe/*` |

## Recent Changes (Feb 4, 2026)

### Session Summary
1. ✅ **Calendar Feature** - สร้างปฏิทินดูนัดหมาย
2. ✅ **Booking Max Seats** - ตั้งค่าจำนวนที่นั่งต่อ slot
3. ✅ **Remove "Live" Type** - รวมเข้า Booking/Live
4. ✅ **Email CTA** - เพิ่มปุ่มในอีเมลยืนยัน
5. ✅ **Time Slot Range** - แสดงช่วงเวลา
6. ✅ **Fix Notification** - แจ้งเตือนคำสั่งซื้อใหม่
7. ✅ **Fix Hydration** - suppress warning
8. ✅ **Fix Video Reload** - memo description
9. ✅ **Backward Compat** - รองรับ "live" type เก่า
10. ✅ **Landing Page** - สร้างหน้า Landing Page สวยงาม พร้อม:
    - Navbar พร้อม responsive mobile menu
    - Hero section พร้อม gradient background และ floating cards
    - Features grid (12 ฟีเจอร์)
    - How It Works (4 ขั้นตอน)
    - Pricing (Free, Pro, Business plans)
    - Testimonials (6 รีวิว + stats)
    - CTA section
    - Footer พร้อม newsletter และ social links

## Last Updated
February 4, 2026

---

**Contact:** Continue from where this document leaves off. The codebase is well-structured and follows consistent patterns.
