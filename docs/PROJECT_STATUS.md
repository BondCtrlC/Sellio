# Thai Creator Store (Sellio) - Project Status

## Overview
แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Creator ชาวไทย คล้าย Stan Store แต่ปรับให้เหมาะกับตลาดไทย

**URL:** sellio.me  
**Pricing:** Free + Pro (99 THB/เดือน)  
**Deployment:** Vercel  
**Status:** MVP Ready (MUST + SHOULD เสร็จหมดแล้ว, เหลือ M2 Resend Domain + NICE TO HAVE)

---

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
- **Payments:** PromptPay QR + Bank Transfer (Stripe card ถูกลบแล้ว, รอ Stripe Connect)
- **Deployment:** Vercel (Hobby plan)

---

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
│   │   ├── settings/        # Creator settings (tabbed UI)
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

---

## Completed Features ✅

### 1. Dashboard Overview
- Stats cards (orders, revenue, pending)
- Today's/This week's stats
- Recent orders list
- Quick actions (ตั้งค่าการรับเงิน, สร้างสินค้า, เปิดร้าน)

### 2. Analytics Dashboard
- Revenue & Orders charts (Recharts)
- Date filter: 7, 14, 30, 90 days, all-time, custom range
- Top products, status breakdown, product type breakdown

### 3. Product Types
- **Digital** - ไฟล์ดาวน์โหลด, redirect URL
- **Booking/Live** - นัดหมาย, Live Session (รวมเป็น type เดียว)
- **Link** - Affiliate link, external URL

### 4. Booking System
- **Slot Management** - สร้าง slot วัน/เวลาได้ (single, batch, recurring)
- **Recurring Slots** - สร้าง slot ซ้ำรายสัปดาห์ (เลือกวัน, จำนวนสัปดาห์)
- **Max Bookings** - กำหนดจำนวนที่นั่งต่อ slot
- **Auto-block** - เมื่อเต็มจะ block อัตโนมัติ
- **Multi-select & Bulk Actions** - เลือกหลาย slot แล้ว ลบ/ซ่อน/แสดง ทีเดียว
- **Inline Edit** - แก้ไขเวลาและจำนวนที่นั่งของแต่ละ slot ได้
- **Time Range Display** - แสดงช่วงเวลา (9:00 - 10:00)
- **Seat Count Display** - แสดง "ว่าง X ที่นั่ง" หรือ "เต็ม"
- **Pre-fill Meeting Details** - กรอกลิงก์/สถานที่ล่วงหน้าได้
- **Fulfillment Validation** - บังคับกรอกข้อมูลก่อนยืนยันชำระ

### 5. Calendar View
- ปฏิทินรายเดือนแสดงนัดหมาย
- Badge แสดงจำนวนนัดต่อวัน (สีเขียว)
- รายละเอียดนัดหมายเมื่อคลิกวัน
- รายการนัดหมายที่กำลังจะมาถึง

### 6. Coupon System
- Create/Edit/Delete coupons
- Discount types: fixed, percentage
- Usage limits, validity dates
- Thailand timezone handling (UTC+7)
- Coupon validation at checkout

### 7. Customer List
- Aggregated customer data from orders
- Search, stats summary
- Export to CSV
- Contact quick actions (email, phone)

### 8. Notification System
- Bell icon in header with badge
- แจ้งเตือนคำสั่งซื้อใหม่ (pending_payment - 12 ชม.)
- แจ้งเตือนรอยืนยันสลิป (pending_confirmation)
- Expiring coupons alerts
- Auto-refresh every 30 seconds

### 9. Settings Page (Tabbed UI)
- **Tab โปรไฟล์** - รูปโปรไฟล์, ชื่อ, Bio, ช่องทางติดต่อ (โทร, Line, IG, Email)
- **Tab การรับเงิน** - PromptPay (QR Code) + บัญชีธนาคาร (โอนธนาคาร)
- **Tab ร้านค้า** - เปิด/ปิดร้าน + ลิงก์ร้านค้าพร้อมปุ่มคัดลอก + เปลี่ยน URL slug
- **Tab SEO** - meta title, description, keywords + Google Preview
- **Tab การเรียกเก็บเงิน** - แพลนปัจจุบัน, ยกเลิก subscription (ทันที/หมดรอบบิล), ประวัติ invoice

### 10. Payment System
- **PromptPay QR Code** - สร้าง QR อัตโนมัติจากเบอร์โทร
- **Bank Transfer** - แสดงข้อมูลบัญชีธนาคาร (ธนาคาร/เลขบัญชี/ชื่อบัญชี)
- **Payment Tabs** - ลูกค้าเลือก PromptPay หรือ โอนธนาคาร (แสดง tab เฉพาะเมื่อมี 2 ช่องทาง)
- **Upload Slip** - อัพโหลดสลิปการโอนเงิน
- **Download QR** - บันทึกรูป QR Code ได้
- **Stripe Card Payment** - ถูกลบแล้ว (รอ Stripe Connect เพื่อให้เงินเข้า creator โดยตรง)

### 11. Social Sharing
- Share buttons (Facebook, X, Line, Copy link)
- Available on store page and product pages

### 12. Reviews/Ratings
- Customers can review after confirmed order
- Star rating (1-5) + comment
- Creator can: toggle publish, set featured, respond
- Filter by product, filter by rating
- Product review stats display

### 13. Rich Text Editor (Product Description)
- Text formatting: Heading, Bold, Italic, Strikethrough, List
- Image upload to Supabase Storage
- Video: URL embed (YouTube, Loom) + file upload
- Media delete button on click
- Memoized - ป้องกัน video reload เมื่อเปลี่ยน slot

### 14. Email Notifications
- Order confirmation email
- Payment confirmation email
- Booking reminder email (24 ชม. ก่อนนัด)
- CTA Button - "คลิกเพื่อรับสินค้า/บริการ" link ไปหน้า success
- Booking: ปุ่ม "ดูรายละเอียดนัดหมาย" + "เปลี่ยนเวลานัด/ยกเลิกนัด"

### 15. Store Link in Header
- Always visible `/u/username` link
- Copy to clipboard button
- Open in new tab button

### 16. Landing Page
- **Navbar** - Responsive navigation with mobile menu + Sellio logo
- **Hero Section** - Phone mockup preview ร้านจริง, floating stat cards (asymmetric), headline "ขายของออนไลน์ง่ายๆ ผ่านลิงก์เดียว"
- **Features** - 12 feature cards with icons
- **How It Works** - 4-step guide (video section removed)
- **Pricing** - 2 tiers: Free + Pro (3.3 บาท/วัน = 99 บาท/เดือน)
- **Testimonials** - 6 reviews with stats
- **CTA Section** - Final call-to-action
- **Footer** - Links, newsletter, social media + Sellio logo

### 17. Quick Reply / Auto-Reply Helper
- 8 Template messages - ยืนยัน, เตือน, ขอบคุณ, แจ้งปัญหา
- Category filters - แยกหมวดหมู่ข้อความ
- Copy to clipboard - คัดลอกไปวางใน Line/IG
- Auto-fill order data - ใส่ชื่อลูกค้า, สินค้า, ราคา อัตโนมัติ
- Integrated in Order Modal

### 18. Stripe Integration (Live Mode)
- Stripe Live Mode configured (pk_live_, sk_live_)
- Webhook handler for checkout.session.completed
- Auto fulfillment after payment
- Card payment removed from checkout (PromptPay only until Stripe Connect ready)

### 19. Branding & Logo
- Custom Sellio logo (S with arrow) - black + white versions
- Logo ใช้ทุกที่: Navbar, Sidebar, Footer, Mobile header
- ไฟล์: `public/logo-black.png`, `public/logo-white.png`

### 20. Subscription Management (Billing)
- **Billing Tab** ในหน้าตั้งค่า - แสดงแพลนปัจจุบัน + invoice history
- **Cancel Options** - ยกเลิกเมื่อหมดรอบบิล (ปุ่มใหญ่) / ยกเลิกทันที (ปุ่มเล็ก)
- **Persistent Status** - เช็ค cancel_at_period_end จาก Stripe ทุกครั้งที่โหลดหน้า
- **Robust Cancel API** - รองรับกรณี subscription หายจาก Stripe, ไม่มี subscription ID ใน DB
- **Upgrade Page** - แสดงสถานะการยกเลิก + ลิงก์ไปหน้า billing

### 21. SEO & Metadata
- Title template: `"%s | Sellio"` ทุกหน้า
- Root layout: OG tags, Twitter card, keywords, metadataBase
- ทุกหน้ามี title สำหรับ browser tab (23 หน้า)
- Store pages: dynamic generateMetadata จากข้อมูลร้าน/สินค้า

### 22. Dashboard Sidebar
- Sellio logo (image) แทนข้อความ
- User profile section ด้านล่าง (avatar, display name, @username)
- PRO badge หลังชื่อสำหรับ Pro users
- Upgrade CTA สำหรับ Free users / จัดการ Subscription สำหรับ Pro users

---

## Pre-Launch TODO List 📋

### MUST (ต้องทำก่อนเปิด MVP)

| # | Task | Status | Description |
|---|------|--------|-------------|
| M1 | Stripe Live Mode Setup | ✅ Done | เปลี่ยนจาก test key เป็น live key + webhook |
| M2 | Resend Domain Verification | ⬜ Pending | Verify domain เพื่อส่ง email จริง (ไม่ใช่ sandbox) |
| M3 | Product Limit Enforcement | ✅ Done | Free plan จำกัด 2 สินค้า, Pro ไม่จำกัด |
| M4 | Pro Plan Subscription | ✅ Done | Stripe Subscription สำหรับ Pro plan 99 บาท/เดือน |
| M5 | Feature Gating by Plan | ✅ Done | จำกัด feature ตาม plan (export, review management, branding) |
| M6 | Terms & Privacy Policy | ✅ Done | Terms of Service & Privacy Policy (PDPA compliance) |
| M7 | Error Handling & Edge Cases | ✅ Done | ตรวจสอบ flow ต่างๆ ให้ครบถ้วน |

### SHOULD (ควรทำก่อนเปิด แต่ไม่ block launch)

| # | Task | Status | Description |
|---|------|--------|-------------|
| S1 | Landing Page Review | ✅ Done | ตรวจข้อความ, pricing, CTA, Hero section redesign |
| S2 | Mobile Responsive Check | ✅ Done | แก้ table scroll, pricing text size, floating card min-width |
| S3 | SEO Basics | ✅ Done | title template, meta, OG tags, Twitter card ทุกหน้า (23 หน้า) |
| S4 | Upgrade CTA at Limit | ✅ Done | แสดง upgrade prompt เมื่อ Free ชน limit (ใน products page + sidebar) |
| S5 | Supabase Free Tier Monitoring | ✅ Done | ต้องตั้ง alert ใน Supabase Dashboard (ไม่ใช่โค้ด) |

### NICE TO HAVE (ทำทีหลังได้)

| # | Task | Status | Description |
|---|------|--------|-------------|
| N1 | LINE Notify Integration | ⬜ Pending | แจ้งเตือน creator ผ่าน LINE เมื่อมีออเดอร์ |
| N2 | Pro Badge on Store | ⬜ Pending | แสดง badge บนหน้าร้านว่าเป็น Pro |
| N3 | Onboarding Flow | ⬜ Pending | Flow แนะนำสำหรับ creator ใหม่ |
| N4 | Advanced Analytics (Pro) | ⬜ Pending | Analytics dashboard ขั้นสูง |

### FUTURE (Roadmap หลัง MVP)

| # | Task | Description |
|---|------|-------------|
| F1 | Stripe Connect | ให้ creator เชื่อม Stripe รับเงินโดยตรง (Stan Store model) |
| F2 | Remove Manual PromptPay | ลบ upload slip แบบ manual หลัง Stripe Connect พร้อม |
| F3 | LINE Messaging API | ส่งข้อความหาลูกค้าผ่าน LINE OA |
| F4 | Multi-language | รองรับภาษาอังกฤษ |

---

## Recent Changes Log

### Session 5 (Feb 7, 2026) - Current Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Sellio Logo** - เปลี่ยนจากข้อความ/icon เป็นรูปโลโก้ Sellio (S with arrow) ทุกที่ | `navbar.tsx`, `sidebar.tsx`, `footer.tsx`, `layout.tsx`, `public/logo-*.png` |
| 2 | **Billing Tab** - เพิ่ม tab การเรียกเก็บเงินในตั้งค่า (แพลนปัจจุบัน, invoice history) | `settings-form.tsx`, `settings/page.tsx`, `actions/plan.ts` |
| 3 | **Cancel Subscription UX** - สลับปุ่ม (หมดรอบบิล=ใหญ่, ทันที=เล็ก), persistent status จาก Stripe | `settings-form.tsx`, `upgrade-client.tsx`, `upgrade/page.tsx`, `cancel-subscription/route.ts` |
| 4 | **Robust Cancel API** - รองรับ missing subscription ID, stale Stripe data, no-sub-but-pro cases | `api/stripe/cancel-subscription/route.ts` |
| 5 | **Hero Section Redesign** - Phone mockup ร้านจริง, floating stat cards, headline ใหม่ | `components/landing/hero.tsx`, `globals.css` |
| 6 | **Sidebar Profile** - แสดง avatar + display name + PRO badge ด้านล่าง sidebar | `components/dashboard/sidebar.tsx` |
| 7 | **Booking Email** - เพิ่มปุ่ม "เปลี่ยนเวลานัด/ยกเลิกนัด" ในอีเมลยืนยัน + reminder | `lib/email.ts` |
| 8 | **S3: SEO Metadata** - เพิ่ม title, meta, OG tags, Twitter card ทุกหน้า (23 หน้า) | `layout.tsx`, `page.tsx`, ทุก dashboard page |
| 9 | **S2: Mobile Responsive** - แก้ table scroll, pricing text, floating card sizing | `settings-form.tsx`, `pricing.tsx`, `hero.tsx` |
| 10 | **CTA Button Fix** - แก้ปุ่ม "ดูวิธีใช้งาน" มองไม่เห็นตัวอักษรบนพื้นมืด | `components/landing/cta.tsx` |

### Session 4 (Feb 6, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Username Edit** - Creator เปลี่ยนชื่อลิงก์ร้านค้า (u/xxx) ได้ | `settings-form.tsx`, `actions/settings.ts`, `lib/validations/settings.ts` |
| 2 | **Plan System** - เพิ่ม plan field (free/pro) + migration 013 | `supabase/migrations/013_plan_subscription.sql`, `types/index.ts` |
| 3 | **Plan Utility** - getPlanLimits, hasFeature, canCreateProduct | `lib/plan.ts` |
| 4 | **M3: Product Limit** - Free จำกัด 2 สินค้า + UI warning | `actions/products.ts`, `products-list.tsx`, `products/page.tsx` |
| 5 | **M5: Feature Gating** - ProGate component + lock export/reviews/branding | `components/shared/pro-gate.tsx`, `customers-list.tsx`, `reviews/page.tsx`, `u/[username]/page.tsx` |
| 6 | **M4: Stripe Subscription** - Pro 99 THB/month + webhook handlers | `api/stripe/create-subscription/`, `api/stripe/cancel-subscription/`, `api/stripe/webhook/route.ts` |
| 7 | **Upgrade Page** - หน้าอัปเกรด Pro สวยๆ + FAQ | `app/dashboard/upgrade/page.tsx`, `upgrade-client.tsx` |
| 8 | **M6: Terms & Privacy** - หน้า Terms of Service + Privacy Policy (PDPA) | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| 9 | **M7: Error Handling** - Order expiration check, upload slip validation | `actions/orders.ts`, `app/checkout/[orderId]/page.tsx` |
| 10 | **Sidebar Upgrade CTA** - ปุ่มอัปเกรด Pro ใน sidebar | `components/dashboard/sidebar.tsx` |
| 11 | **Footer Legal Links** - ลิงก์ไป Terms/Privacy ใน Footer | `components/landing/footer.tsx` |

### Session 3 (Feb 4-5, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Recurring Booking Slots** - สร้าง slot ซ้ำรายสัปดาห์ (เลือกวัน Mon-Fri/Sat-Sun, 2-12 สัปดาห์) | `actions/booking-slots.ts`, `booking-slots-manager.tsx` |
| 2 | **Multi-select & Bulk Actions** - เลือกหลาย slot, ลบ/ซ่อน/แสดงทีเดียว | `booking-slots-manager.tsx` |
| 3 | **Inline Slot Edit** - แก้ไขเวลา/จำนวนที่นั่ง per slot | `actions/booking-slots.ts`, `booking-slots-manager.tsx` |
| 4 | **Pricing Update** - เปลี่ยนเป็น 2 plans: Free + Pro (99 THB) | `components/landing/pricing.tsx` |
| 5 | **Remove Demo Video Section** - ลบ "ดูการใช้งานจริง" ออก | `components/landing/how-it-works.tsx` |
| 6 | **Stripe Live Mode** - เปลี่ยนเป็น live key + webhook | Vercel env variables |
| 7 | **Remove Stripe Card Payment** - ลบ Stripe card checkout, เหลือแค่ PromptPay | `app/checkout/[orderId]/payment-page.tsx` |
| 8 | **Bank Transfer Payment** - เพิ่มช่องทางโอนผ่านธนาคาร | DB migration, types, settings, checkout |
| 9 | **Settings Tabbed UI** - จัดหมวดหมู่ตั้งค่าเป็น 4 tabs (โปรไฟล์/การรับเงิน/ร้านค้า/SEO) | `settings-form.tsx`, `page.tsx` |

### Session 2 (Feb 4, 2026) - Previous Session

| # | Change |
|---|--------|
| 1 | Calendar Feature - ปฏิทินดูนัดหมาย |
| 2 | Booking Max Seats - ตั้งค่าจำนวนที่นั่งต่อ slot |
| 3 | Remove "Live" Type - รวมเข้า Booking/Live |
| 4 | Email CTA - เพิ่มปุ่มในอีเมลยืนยัน |
| 5 | Time Slot Range - แสดงช่วงเวลา |
| 6 | Fix Notification - แจ้งเตือนคำสั่งซื้อใหม่ |
| 7 | Fix Hydration - suppress warning |
| 8 | Fix Video Reload - memo description |
| 9 | Backward Compat - รองรับ "live" type เก่า |
| 10 | Landing Page - สร้างหน้า Landing Page ครบ |

---

## Database Migrations
Run in order via Supabase SQL Editor:
1. `001_initial.sql` - Base tables
2. `002` through `012` - Various features
3. `013_plan_subscription.sql` - Plan & subscription fields

**Latest migration (013):**
```sql
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
```

---

## Pricing Model

| Feature | Free | Pro (99 THB/เดือน) |
|---------|------|---------------------|
| สินค้า | 2 ชิ้น | ไม่จำกัด |
| หน้าร้านสวย | ✅ | ✅ |
| PromptPay QR | ✅ | ✅ |
| Bank Transfer | ✅ | ✅ |
| คูปอง | ✅ | ✅ |
| ปฏิทินนัดหมาย | ✅ | ✅ |
| Export ข้อมูล | ❌ | ✅ |
| จัดการรีวิว | ❌ | ✅ |
| ลบ Branding | ❌ | ✅ |
| Analytics ขั้นสูง | ❌ | ✅ |

**Landing page message:** "3.3 บาท/วัน" (99 บาท/เดือน)

---

## Known Issues / Notes

### Timezone
- All date handling for Thai users uses UTC+7
- Coupon start/end dates converted with `+07:00` offset

### Backward Compatibility
- Product type "live" ยังรองรับในฐานข้อมูลเก่า
- จะถูก treat เหมือน "booking" ใน UI

### Payment Flow
- ลูกค้าชำระผ่าน PromptPay QR หรือ โอนธนาคาร
- อัพโหลดสลิป → Creator ตรวจสอบและยืนยัน
- Stripe Card ถูกลบแล้ว (เงินเข้า platform ไม่ใช่ creator, รอ Stripe Connect)

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
CRON_SECRET=

# Stripe (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

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
| Settings | `app/dashboard/settings/settings-form.tsx` (tabbed: profile/payments/store/SEO/billing) |
| Billing/Subscription | `settings-form.tsx` (BillingTab), `api/stripe/cancel-subscription/route.ts` |
| Upgrade Page | `app/dashboard/upgrade/page.tsx`, `upgrade-client.tsx` |
| Payment Page | `app/checkout/[orderId]/payment-page.tsx` |
| Logo | `public/logo-black.png`, `public/logo-white.png` |

---

## Quick Commands
```bash
# Development
cd new
npm run dev

# Open at http://localhost:3000
```

---

## Last Updated
February 7, 2026

---

**Contact:** Continue from where this document leaves off. The codebase is well-structured and follows consistent patterns.
