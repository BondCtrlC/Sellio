# Thai Creator Store (Sellio) - Project Status

## Overview
แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Creator ชาวไทย คล้าย Stan Store แต่ปรับให้เหมาะกับตลาดไทย

**URL:** trysellio.com  
**Pricing:** Free + Pro (99 THB/เดือน)  
**Deployment:** Vercel  
**Status:** MVP Ready | ✅ i18n Complete | ✅ Yearly Subscription | ✅ Auto Slip Verification (Slip2GO) | ✅ Production Ready | ✅ Calendar Booking UI | ✅ Max Bookings Per Customer | ✅ PostHog Analytics  
**Last Updated:** February 16, 2026 (Session 14)

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (buckets: avatars, products, digital-files, slips)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **UI Components:** Shadcn-style custom components
- **Charts:** Recharts
- **i18n:** next-intl (cookie-based locale, Thai default)
- **Email:** Resend
- **Payments:** PromptPay QR เท่านั้น (Bank Transfer + Upload QR ถูกลบเพื่อความปลอดภัย, Stripe card ถูกลบรอ Stripe Connect)
- **Slip Verification:** Slip2GO API (QR Code scanning) + jsQR (client-side QR extraction)
- **Deployment:** Vercel (Hobby plan)
- **Analytics:** PostHog (product analytics, session replay, heatmaps)
- **Web Analytics:** Vercel Analytics

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
│   ├── shared/              # Shared components
│   ├── posthog-provider.tsx # PostHog init + pageview tracking
│   └── posthog-identifier.tsx # PostHog user identification
├── lib/
│   ├── supabase/            # Supabase client
│   ├── validations/         # Zod schemas
│   ├── posthog-server.ts    # PostHog server-side helper
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
- **Recurring Slots** - สร้าง slot ซ้ำรายสัปดาห์ (เลือกวัน, จำนวนสัปดาห์ หรือ ช่วงวันที่เริ่ม-สิ้นสุด)
- **Max Bookings** - กำหนดจำนวนที่นั่งต่อ slot
- **Max Bookings Per Customer** - จำกัดจำนวนการจองต่อคนต่อสินค้า (ตรวจสอบจาก buyer_email, case-insensitive)
- **Auto-block** - เมื่อเต็มจะ block อัตโนมัติ
- **Multi-select & Bulk Actions** - เลือกหลาย slot แล้ว ลบ/ซ่อน/แสดง ทีเดียว
- **Inline Edit** - แก้ไขเวลาและจำนวนที่นั่งของแต่ละ slot ได้
- **Time Range Display** - แสดงช่วงเวลา (9:00 - 10:00)
- **Seat Count Display** - แสดง "ว่าง X ที่นั่ง" หรือ "เต็ม"
- **Pre-fill Meeting Details** - กรอกลิงก์/สถานที่ล่วงหน้าได้
- **Fulfillment Validation** - บังคับกรอกข้อมูลก่อนยืนยันชำระ
- **Calendar UI** - ลูกค้าเลือกวัน/เวลาผ่านตาราง calendar แทน list (Thai month/weekday, Buddhist era year)
- **Calendar UX** - วันเต็มเป็นสีแดง, วันนี้มี ring, hover/selected เป็นวงกลม, จุดบอกวันที่มี slot
- **Booking Location Settings** - ตั้งค่า Online (platform/link) / Offline (สถานที่) แยกจากฟอร์มหลัก เซฟอิสระ
- **Meeting Link Required** - บังคับกรอก meeting link ก่อนวางขายสินค้า booking

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
- **Tab การรับเงิน** - PromptPay เท่านั้น (กรอกเบอร์โทร/เลขบัตร → ระบบสร้าง QR อัตโนมัติ)
- **Tab ร้านค้า** - เปิด/ปิดร้าน + ลิงก์ร้านค้าพร้อมปุ่มคัดลอก + เปลี่ยน URL slug (ต้องมีช่องทางติดต่อก่อนเปิดร้าน)
- **Tab SEO** - meta title, description, keywords + Google Preview
- **Tab แจ้งเตือน** - ตั้งค่าอีเมลรับแจ้งเตือน (คำสั่งซื้อใหม่, อัพโหลดสลิป, ยกเลิก/เปลี่ยนนัด)
- **Tab การเรียกเก็บเงิน** - แพลนปัจจุบัน, ยกเลิก subscription (ทันที/หมดรอบบิล), ประวัติ invoice

### 10. Payment System
- **PromptPay QR Code** - สร้าง QR อัตโนมัติจากเบอร์โทร/เลขบัตรประชาชน (พร้อมยอดเงิน)
- **Upload Slip** - อัพโหลดสลิปการโอนเงิน
- **Slip2GO Auto-Verify** - ตรวจสอบสลิปอัตโนมัติ + เช็คผู้รับเงินตรงกับ creator
- **Download QR** - บันทึกรูป QR Code ได้
- **Stripe Card Payment** - ถูกลบแล้ว (รอ Stripe Connect เพื่อให้เงินเข้า creator โดยตรง)

### 24. Auto Slip Verification (Slip2GO) ✅
- **ระบบตรวจสอบสลิปอัตโนมัติ** — ลูกค้าอัปสลิป → ระบบตรวจ QR ในสลิปกับธนาคารจริง → auto-confirm ทันที
- **Client-side QR Extraction** — ใช้ `jsQR` + Canvas API ใน browser อ่าน QR จากรูปสลิป (4 strategies: full image, bottom-right 50%, bottom-right 35%+scale, bottom half)
- **Slip2GO QR Code API** — ส่ง QR text ไปตรวจสอบที่ `/api/verify-slip/qr-code/info` ด้วย Bearer token
- **checkCondition** — ตรวจยอดเงิน (`checkAmount: eq`) + ตรวจสลิปซ้ำ (`checkDuplicate: true`)
- **Response Code Handling:**
  - `200200` (Slip is Valid) → **Auto-confirm order** ทันที ไม่ต้องรอ creator
  - `200000` (Slip Found but not validated) → ไม่ผ่าน
  - `200402` (Amount mismatch) → ไม่ผ่าน
  - `200501` (Duplicate slip) → ไม่ผ่าน
  - `200500` (Fraud) → ไม่ผ่าน
  - `200404` (Not found) → ไม่ผ่าน
- **Auto-confirm flow:** อัปเดต order status, payment status, ส่งอีเมลยืนยันถึงลูกค้า, fulfill สินค้าดิจิทัลอัตโนมัติ
- **Verification Failed UI:** กล่องแดงแจ้งลูกค้าว่าสลิปไม่ผ่าน + แนะนำให้ตรวจสอบและลองใหม่
- **Creator Dashboard:** แสดง badge "ยืนยันอัตโนมัติแล้ว" (เขียว) หรือ "รอตรวจสอบ" (เหลือง) ในหน้าจัดการ order
- **Database:** เพิ่ม columns `slip_verified`, `slip_verified_at`, `slip_verify_ref`, `slip_verify_message` ใน payments table
- **Fallback:** ถ้าตรวจสลิปไม่ผ่าน ยังสามารถรอ creator ยืนยันด้วยตนเองได้ (manual flow เหมือนเดิม)
- **Auto-confirm booking/live:** สินค้า booking/live ยืนยันอัตโนมัติพร้อม pre-fill fulfillment จาก meeting link/location
- **Retry Logic:** Retry สูงสุด 2 ครั้ง (delay 5 วินาที) สำหรับ `200404` (Not found) เท่านั้น + `200501` (duplicate) ไม่ retry (hard fail)
- **checkReceiver:** ตรวจสอบผู้รับเงินตรง creator PromptPay ID
- **Verify Failed UI (Creator Dashboard):** แสดงเหตุผลสลิปไม่ผ่านใน order detail modal + badge "สลิปไม่ผ่าน" ใน order list + email แจ้ง creator พร้อมเหตุผล
- **Slip QR Guide:** แนะนำลูกค้าให้อัปโหลดสลิปที่มี QR Code ชัดเจนบนหน้าชำระเงิน

### 25. PostHog Analytics ✅
- **Product Analytics** — track user behavior, pageviews, custom events ทั้งฝั่ง client และ server
- **Client-side Provider** — `PostHogProvider` component ครอบ app ใน root layout, init เมื่อ window load
- **Pageview Tracking** — ใช้ `PostHogPageView` component จับ `$pageview` event ทุกครั้งที่เปลี่ยนหน้า (pathname + searchParams)
- **User Identification** — `PostHogIdentifier` component ใน dashboard layout ดึง user data จาก Supabase แล้ว `posthog.identify()` พร้อม properties (username, email, plan)
- **Server-side Events** — `trackServerEvent()` helper ใน `lib/posthog-server.ts` ใช้ `posthog-node` SDK
- **Tracked Events:**
  - `user_signed_up` — เมื่อสมัครสมาชิกสำเร็จ (properties: username)
  - `product_created` — เมื่อสร้างสินค้าสำเร็จ (properties: product_id, product_type, price, plan)
  - `order_created` — เมื่อสร้าง order สำเร็จ (properties: order_id, product_id, amount, payment_method, has_coupon)
  - `payment_confirmed` — เมื่อยืนยันชำระเงินสำเร็จ (properties: order_id, product_type)
- **Session Replay** — บันทึก session ลูกค้าเพื่อดูพฤติกรรมการใช้งานจริง
- **Heatmaps** — แสดงจุดที่ผู้ใช้คลิก/สนใจมากที่สุดบนหน้าเว็บ
- **Web Vitals** — ติดตาม performance metrics (LCP, CLS, INP)
- **Autocapture** — จับ click, form submission, page leave events อัตโนมัติ
- **Environment:** `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` (us.i.posthog.com)

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

### 14. Email Notifications (Resend)
- **ส่งถึงลูกค้า (Buyer):**
  - Order confirmation email
  - Payment confirmation email
  - Payment rejection email
  - Refund notification email (พร้อมสลิปคืนเงิน)
  - Booking reminder email (24 ชม. ก่อนนัด)
  - Booking cancellation / reschedule email
  - CTA Button - "คลิกเพื่อรับสินค้า/บริการ" link ไปหน้า success
  - Booking: ปุ่ม "ดูรายละเอียดนัดหมาย" + "เปลี่ยนเวลานัด/ยกเลิกนัด"
- **ส่งถึง Creator (Notification Email):**
  - แจ้งเตือนคำสั่งซื้อใหม่ (`sendNewOrderNotificationEmail`)
  - แจ้งเตือนลูกค้าอัพโหลดสลิป (`sendSlipUploadedNotificationEmail`)
  - Booking cancellation / reschedule notification
  - Creator ตั้งค่าอีเมลรับแจ้งเตือนได้ในหน้าตั้งค่า > แจ้งเตือน
- **หมายเหตุ:** เดิมใช้ LINE Notify แต่ LINE Notify ปิดบริการ 31 มี.ค. 2025 จึงเปลี่ยนเป็น Email ผ่าน Resend

### 15. Store Link in Header
- Always visible `/u/username` link
- Copy to clipboard button
- Open in new tab button

### 16. Landing Page
- **Navbar** - Responsive navigation with mobile menu + Sellio logo + **centered menu tabs**
- **Hero Section** - Phone mockup preview ร้านจริง, floating stat cards (asymmetric), headline "ขายโคตรเร็ว แค่ผ่านลิงก์เดียว" / "Sell crazy fast with just one link"
- **Features** - 12 feature cards with icons (incl. "ตรวจสลิปอัตโนมัติ" — auto slip verification)
- **How It Works** - 4-step guide (video section removed)
- **Pricing** - 2 tiers: Free + Pro (3.3 บาท/วัน = 99 บาท/เดือน)
- **Testimonials** - 6 reviews with stats
- **CTA Section** - Final call-to-action
- **Footer** - Links, newsletter, social media + Sellio logo + anchor links to Terms/Privacy sections

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

### 23. Onboarding Flow
- **Floating overlay** มุมขวาล่าง แสดงทุกหน้า dashboard (จนกว่าจะทำครบ)
- **ขั้นตอนบังคับ (6 ขั้น):** ตั้งค่าโปรไฟล์, เพิ่มช่องทางติดต่อ, ตั้งค่าการรับเงิน, สร้างสินค้าแรก, เพิ่มสินค้าในร้านค้า (บังคับ), เปิดร้านค้า
- **ขั้นตอนไม่บังคับ (1 ขั้น):** ตั้งค่าอีเมลแจ้งเตือน (ข้ามได้)
- Progress bar แสดงความคืบหน้า
- ยุบ/ขยายได้, auto-refresh ทุก 15 วินาที + เมื่อเปลี่ยนหน้า
- คลิกขั้นตอนจะนำไปหน้าที่เกี่ยวข้อง (ใช้ `router.push` + sync tab)
- **บังคับช่องทางติดต่อก่อนเปิดร้าน** (server-side enforcement)
- **Auto-fill notification email** - user ใหม่ได้ notification_email จาก signup email อัตโนมัติ (DB trigger + backfill)

---

## Pre-Launch TODO List 📋

### MUST (ต้องทำก่อนเปิด MVP)

| # | Task | Status | Description |
|---|------|--------|-------------|
| M1 | Stripe Live Mode Setup | ✅ Done | เปลี่ยนจาก test key เป็น live key + webhook |
| M2 | Resend Domain Verification | ✅ Done | Domain verified, noreply@trysellio.com + DMARC record |
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
| N1 | Email Notifications (Creator) | ✅ Done | แจ้งเตือน creator ทางอีเมลเมื่อมีออเดอร์/อัพสลิป (เดิมเป็น LINE Notify แต่ปิดบริการ 31 มี.ค. 2025) |
| N2 | Pro Badge on Store | ✅ Done | แสดง badge บนหน้าร้านว่าเป็น Pro |
| N3 | Onboarding Flow | ✅ Done | Floating overlay ทุกหน้า, 5+2 ขั้นตอน, บังคับช่องทางติดต่อก่อนเปิดร้าน |
| N4 | Advanced Analytics (Pro) | ✅ Done | Analytics dashboard ขั้นสูง |

### IN PROGRESS (กำลังทำ)

| # | Task | Status | Description |
|---|------|--------|-------------|
| I1 | Multi-language (i18n) | ✅ Done | รองรับ ไทย/อังกฤษ ทั้ง platform ด้วย next-intl (cookie-based, ไม่เปลี่ยน URL) — 9 steps + polish ครบ! |
| I2 | Onboarding: Customize Store | ✅ Done | เพิ่มขั้นตอน "ปรับแต่งร้านค้า" (ไม่บังคับ) ใน onboarding flow |
| I3 | i18n Polish (Session 9) | ✅ Done | แปลภาษาที่เหลือ (~100 keys), แก้ navbar, เพิ่มปุ่มเปลี่ยนภาษาหน้าร้าน, แก้ auth bug |

**i18n Rollout Plan (Incremental - ทำทีละส่วน, server รันได้ตลอด):**

| Step | Area | Status | Files |
|------|------|--------|-------|
| 1 | Infrastructure (next-intl, provider, LanguageSwitcher) | ✅ Done | `i18n/request.ts`, `next.config.ts`, `layout.tsx`, `messages/*.json`, `language-switcher.tsx`, `actions/locale.ts` |
| 2 | Landing Page (~8 files) | ✅ Done | `components/landing/*.tsx`, `app/page.tsx` |
| 3 | Auth Pages (~4 files) | ✅ Done | `app/(auth)/login/`, `app/(auth)/signup/` |
| 4 | Dashboard Navigation (~4 files) | ✅ Done | `sidebar.tsx`, `header.tsx`, `notification-bell.tsx`, `store-link.tsx`, `dashboard/layout.tsx` |
| 5a | Dashboard Overview + Analytics | ✅ Done | `dashboard/page.tsx`, `analytics/*.tsx` |
| 5b | Products (~10 files) | ✅ Done | `products/*.tsx`, `product-form.tsx`, `product-actions.tsx`, `booking-slots-manager.tsx`, `booking-settings.tsx`, `digital-file-upload.tsx`, `product-image-upload.tsx` |
| 5c | Orders (~4 files) | ✅ Done | `orders/page.tsx`, `orders-list.tsx`, `order-detail-modal.tsx`, `fulfillment-editor.tsx` |
| 5d | Other Dashboard Pages (~13 files) | ✅ Done | `customers/page+list`, `reviews/page+list`, `coupons/page+list+form`, `calendar/layout+page`, `upgrade/page+client`, `my-store/page+client`, `quick-reply.tsx` |
| 5e | Settings (~3 files, heaviest) | ✅ Done | `settings/page.tsx`, `settings-form.tsx`, `avatar-upload.tsx` |
| 6 | Store + Checkout (~24 files) | ✅ Done | `app/u/` (11 files), `app/checkout/` (8 files), `components/shared/` (4 files) — namespaces: StoreFront, ProductDetail, Checkout, Payment, OrderSuccess, ManageBooking, ReviewSection, ProductReviews, ShareButtons, DownloadButton |
| 7 | Server Actions + Emails (~18 files) | ✅ Done | `actions/*.ts` (13 files), `lib/email.ts` — namespaces: ServerActions, Notifications, Emails |
| 8 | DB + Store Language Setting | ✅ Done | `016_store_language.sql`, `types/index.ts`, `settings-form.tsx`, `settings.ts`, `validations/settings.ts`, `store page.tsx` — store_language column + UI selector + cookie sync |
| 9 | Onboarding: Customize Store Step | ✅ Done | `onboarding-checklist.tsx` — namespace: Onboarding |
| 10 | **i18n Polish & Fixes (Session 9)** | ✅ Done | แปล my-store (7 files), UI components (3 files), เพิ่ม language switcher หน้าร้าน, แก้ navbar centering, แก้ auth errorCode bug — ~100 keys ใหม่ใน 4 namespaces |

### FUTURE (Roadmap หลัง MVP)

| # | Task | Description |
|---|------|-------------|
| F1 | Stripe Connect | ให้ creator เชื่อม Stripe รับเงินโดยตรง (Stan Store model) |
| F2 | Remove Manual PromptPay | ลบ upload slip แบบ manual หลัง Stripe Connect พร้อม |
| F3 | LINE Messaging API | แจ้งเตือนผ่าน LINE OA (ทดแทน LINE Notify ที่ปิดบริการแล้ว) |
| F4 | i18n: Zod Validation Messages | แปล validation messages ใน `lib/validations/*.ts` (ต้องใช้ custom Zod error map) |
| F5 | i18n: Constants & Calendar | แปล `lib/constants.ts` labels + `lib/ics.ts` calendar descriptions |
| F6 | i18n: Time Format | แก้ hardcoded "น." suffix ให้ใช้ locale-aware time formatting |
| F7 | Remove Debug UI | ✅ Done — ลบ `[DEBUG]` text จากหน้าชำระเงิน + ลบ `/api/test-slip2go` endpoint |
| F8 | Slip2GO Receiver Check | ✅ Done — `checkReceiver` ตรวจสอบผู้รับเงินตรง creator PromptPay ID (format ใช้ array ของ object) |
| F9 | M2: Resend Domain Verification | ✅ Done — Domain verified, ส่งอีเมลจาก noreply@trysellio.com + DMARC record เพิ่มแล้ว |
| F10 | PostHog Feature Flags | ใช้ PostHog feature flags สำหรับ gradual rollout ฟีเจอร์ใหม่ |
| F11 | PostHog A/B Testing | A/B test pricing, landing page CTA, onboarding flow |
| F12 | PostHog Funnels & Retention | สร้าง funnel: signup → create product → open store → first sale + retention analysis |

---

## Recent Changes Log

### Session 14 (Feb 16, 2026) - Current Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Recurring Slot Date Range** - เพิ่มตัวเลือกให้ creator เลือกได้ระหว่าง "จำนวนสัปดาห์" กับ "ช่วงวันที่เริ่ม-สิ้นสุด" สำหรับสร้าง slot ซ้ำทุกสัปดาห์ | `actions/booking-slots.ts`, `booking-slots-manager.tsx`, `messages/*.json` |
| 2 | **Fix: Date Range Off-by-One** - แก้ bug วันสิ้นสุดไม่ถูกนับรวมเมื่อสร้าง slot ด้วยช่วงวันที่ (เปลี่ยน endDate เป็น T23:59:59) | `actions/booking-slots.ts` |
| 3 | **Favicon / Domain Logo** - เพิ่ม favicon Sellio logo แทน default Vercel triangle (`app/favicon.ico` + `public/favicon.png`) | `app/favicon.ico`, `public/favicon.png`, `app/layout.tsx` |
| 4 | **PostHog Analytics Integration** - ติดตั้ง PostHog product analytics ครบ: client-side pageview tracking, user identification, server-side event tracking | `components/posthog-provider.tsx`, `components/posthog-identifier.tsx`, `lib/posthog-server.ts`, `app/layout.tsx`, `app/dashboard/layout.tsx` |
| 5 | **PostHog Event Tracking** - track key events: `user_signed_up`, `product_created`, `order_created`, `payment_confirmed` | `actions/auth.ts`, `actions/products.ts`, `actions/orders.ts` |
| 6 | **PostHog Configuration** - Autocapture frontend interactions, heatmaps, web vitals enabled | PostHog dashboard settings |

### Session 13 (Feb 12, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Slip Verify Failure UI (Dashboard)** - แสดงเหตุผลสลิปไม่ผ่านใน order detail modal (warning banner แดง) + badge "สลิปไม่ผ่าน" ใน order list | `orders/order-detail-modal.tsx`, `orders/orders-list.tsx`, `messages/*.json` |
| 2 | **Slip Verify Failed Email** - email แจ้ง creator เปลี่ยนสีเป็นแดงเมื่อสลิปไม่ผ่าน + แสดงเหตุผลเป็น Thai/English | `lib/email.ts`, `actions/orders.ts`, `messages/*.json` |
| 3 | **Fix: Slip2GO 200501 Retry Bug** - แก้ retry logic ที่ทำให้สลิปปลอม/ซ้ำผ่าน verification ได้ (200501 ไม่ retry อีกต่อไป) | `lib/slip2go.ts` |
| 4 | **Landing Page Headline** - เปลี่ยนเป็น "ขายโคตรเร็ว แค่ผ่านลิงก์เดียว" / "Sell crazy fast with just one link" | `messages/*.json`, `app/layout.tsx` |
| 5 | **Onboarding: Add Products Step** - เปลี่ยนขั้นตอน "ปรับแต่งร้านค้า" → "เพิ่มสินค้าในร้านค้า" (บังคับ) — ต้องมีสินค้าใน store จริง | `onboarding-checklist.tsx`, `actions/onboarding.ts`, `messages/*.json` |
| 6 | **Feature Box: Auto Slip Verify** - เปลี่ยนข้อความ "ส่งมอบไฟล์ปลอดภัย" → "ตรวจสลิปอัตโนมัติ" บน landing page | `messages/*.json` |
| 7 | **Slip QR Guide** - เพิ่มข้อความแนะนำบนหน้าชำระเงินให้อัปโหลดสลิปที่ QR ชัด | `payment-page.tsx`, `messages/*.json` |
| 8 | **Settings/Product Page Width** - ขยาย max-w จาก `2xl` เป็น `4xl` ในหน้าตั้งค่าและตั้งค่าสินค้า | `settings/page.tsx`, `products/new/page.tsx` |
| 9 | **Product Edit Two-Column Layout** - Desktop: ซ้าย (scrollable settings) + ขวา (sticky image+info), Mobile: single-column | `products/[productId]/edit/page.tsx` |
| 10 | **Booking Location Settings Component** - แยกตั้งค่าสถานที่จอง (Online/Offline, platform, link, location) ออกจาก ProductForm เป็น component อิสระ เซฟแยก | `booking-location-settings.tsx`, `actions/products.ts`, `product-form.tsx` |
| 11 | **Meeting Link Required** - ลบ "(ไม่บังคับ)" ออก + เปลี่ยน hint เป็น "ต้องเพิ่มก่อนวางขาย" | `messages/*.json` |
| 12 | **Auto-fill Notification Email** - user ใหม่ได้ notification_email จาก signup email อัตโนมัติ + backfill existing | `supabase/migrations/018_default_notification_email.sql`, `supabase/schema.sql` |
| 13 | **Calendar UI for Booking** - เปลี่ยน slot selection จาก list เป็น calendar grid (Thai month/weekday, Buddhist era year) | `app/u/[username]/[productId]/product-detail.tsx` |
| 14 | **Max Bookings Per Customer** - creator กำหนด max จองต่อคนได้ + enforce server-side (ilike email) + แสดงข้อมูลบนหน้าสินค้า | `booking-settings.tsx`, `actions/orders.ts`, `actions/products.ts`, `product-detail.tsx`, `edit/page.tsx`, `messages/*.json` |
| 15 | **Calendar Full Dates Red** - วันที่ slot เต็มแสดงเป็นสีแดง (ยังกดดู slot ได้) + จุดใต้วันที่เป็นสีแดงด้วย | `product-detail.tsx` |
| 16 | **Calendar Circle Hover/Selected** - เปลี่ยน hover/selected จากสี่เหลี่ยมเป็นวงกลม + today ring | `product-detail.tsx` |
| 17 | **Calendar Dot Position** - ขยับจุดบอก slot ขึ้นชิดตัวเลขเพื่อไม่ทับ today ring | `product-detail.tsx` |
| 18 | **Fix: Calendar Today Ring SSR** - แก้ bug ring แสดง 2 วัน (UTC vs UTC+7) ด้วย isMounted flag | `product-detail.tsx` |
| 19 | **Fix: updateProduct Overwrite Bug** - แก้ bug ที่บันทึกชื่อ/ราคาสินค้าจะเขียนทับ meeting link/location ที่เซฟแยกไว้ | `actions/products.ts` |
| 20 | **Security & Bug Fixes (22 issues)** - แก้ auth bypass, XSS in email, PII logging, body size limit, missing validation, etc. | 21 files |
| 21 | **Booking Slot Release on Failed Slip** - สลิปไม่ผ่าน → ปล่อย slot ให้คนอื่นจอง, creator confirm → จอง slot กลับ, reject → ปล่อย slot | `actions/orders.ts` |

### Session 12 (Feb 11, 2026)

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Slip2GO Retry Logic** - Retry สูงสุด 2 ครั้ง (delay 5 วินาที) สำหรับ `200404` + disable `checkDuplicate` ใน retry เพื่อป้องกัน `200501` false positive | `lib/slip2go.ts` |
| 2 | **Slip2GO checkReceiver** - ตรวจสอบผู้รับเงินตรง creator PromptPay ID | `lib/slip2go.ts`, `actions/orders.ts` |
| 3 | **Security: Magic Bytes in refundOrder** - เพิ่ม server-side file validation (JPEG/PNG/WebP magic bytes + extension whitelist) สำหรับ refund slip upload | `actions/orders.ts` |
| 4 | **Security: Optimistic Lock in rescheduleBooking** - ป้องกัน race condition เมื่อย้าย slot + rollback ถ้าล็อค fail | `actions/orders.ts` |
| 5 | **Auto-confirm Booking/Live** - สินค้า booking/live ยืนยันอัตโนมัติผ่าน Slip2GO พร้อม pre-fill fulfillment จาก meeting link/location | `actions/orders.ts` |
| 6 | **Creator Meeting Link Enforcement** - บังคับ creator กรอก meeting link/location ก่อนขาย booking product + warning badges | `actions/products.ts`, `components/dashboard/products-list.tsx` |
| 7 | **Buyer Cancellation Email** - ส่งอีเมลแจ้งเตือนลูกค้าเมื่อ order ถูกยกเลิก | `actions/orders.ts`, `lib/email.ts`, `messages/*.json` |
| 8 | **Spam Folder Warning** - เพิ่มข้อความแจ้งเตือนให้ลูกค้าเช็ค Spam/Junk folder ในหน้า success + payment | `app/checkout/[orderId]/success/page.tsx`, `payment-page.tsx`, `messages/*.json` |
| 9 | **Remove Bank Transfer + Upload QR** - ลบช่องทาง Bank Transfer และ Upload QR (e-wallet) เพื่อความปลอดภัย เหลือแค่ PromptPay | `actions/orders.ts`, `payment-page.tsx`, `settings-form.tsx` |
| 10 | **Error Pages** - เพิ่ม `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` สำหรับ production | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` |
| 11 | **SEO: Sitemap + Robots** - Dynamic sitemap กับ public store URLs + robots.txt | `app/sitemap.ts`, `app/robots.ts` |
| 12 | **Web Analytics** - ติดตั้ง `@vercel/analytics` ใน root layout | `app/layout.tsx`, `package.json` |
| 13 | **Footer Anchor Links** - แก้ `#cookies` → id="cookies" ในหน้า Privacy, `#refund` → id="refund" ในหน้า Terms | `app/privacy/page.tsx`, `app/terms/page.tsx` |

### Session 11 (Feb 11, 2026)

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Slip2GO Integration (Image URL)** - เริ่มต้นเชื่อมต่อ Slip2GO API ด้วยวิธี verify-slip/qr-image-link/info แต่ fail เพราะ Slip2GO ไม่รับ Supabase URL | `lib/slip2go.ts`, `actions/orders.ts`, `.env.example` |
| 2 | **Proxy Image URL** - สร้าง proxy endpoint `/api/slip-image/[orderId]` ให้ serve รูปจาก domain trysellio.com แต่ก็ยัง fail | `app/api/slip-image/[orderId]/route.ts` |
| 3 | **Switch to Base64** - เปลี่ยนเป็น `/api/verify-slip/qr-base64/info` ส่งรูปเป็น Base64 แต่ format ผิดหลายรอบ | `lib/slip2go.ts`, `actions/orders.ts` |
| 4 | **Fix Base64 format** - แก้ endpoint URL, field name (`imageBase64`), data URI prefix (`data:image/<mime>;base64,...`) | `lib/slip2go.ts`, `actions/orders.ts` |
| 5 | **Verification Failed UI** - เพิ่มกล่องแดงแจ้งลูกค้าเมื่อสลิปไม่ผ่าน + URL param `?verify=failed` เพื่อ persist state | `app/checkout/[orderId]/payment-page.tsx`, `messages/*.json` |
| 6 | **Creator Dashboard badges** - แสดง "ยืนยันอัตโนมัติแล้ว" / "รอตรวจสอบ" ในหน้าจัดการ order | `app/dashboard/orders/order-detail-modal.tsx`, `orders-list.tsx` |
| 7 | **DB Migration 017** - เพิ่ม `slip_verified`, `slip_verified_at`, `slip_verify_ref`, `slip_verify_message` ใน payments table | `supabase/migrations/017_slip_verification.sql` |
| 8 | **Switch to QR Code (server-side)** - เปลี่ยนมาใช้ `/api/verify-slip/qr-code/info` + ติดตั้ง `jsqr` + `sharp` เพื่ออ่าน QR จากรูปฝั่ง server | `lib/slip2go.ts`, `actions/orders.ts`, `package.json` |
| 9 | **Multi-strategy QR extraction** - ลอง 5 วิธี (full, bottom-right 50%, bottom-right 35%, bottom half, grayscale+sharpen) | `lib/slip2go.ts` |
| 10 | **sharp on Vercel fix** - เพิ่ม `sharp` ใน `serverExternalPackages` แต่ยังไม่ทำงาน | `next.config.ts` |
| 11 | **🔑 Switch to Client-side QR extraction** - ย้ายการอ่าน QR ไป browser (Canvas API + jsQR) เพราะ sharp ทำงานไม่ได้บน Vercel serverless | `app/checkout/[orderId]/payment-page.tsx`, `actions/orders.ts`, `lib/slip2go.ts` |
| 12 | **Debug UI** - เพิ่ม `[DEBUG] QR: found/none | API: [code] message` บนหน้าชำระเงินเพื่อ troubleshoot | `app/checkout/[orderId]/payment-page.tsx` |
| 13 | **Fix: 200000 vs 200200** - เปลี่ยนจาก auto-confirm ทุก `200000` (แค่พบสลิป) เป็นเฉพาะ `200200` (สลิปถูกต้อง+เงื่อนไขผ่าน) เพื่อป้องกันสลิปปลอมผ่าน | `lib/slip2go.ts` |
| 14 | **Add checkCondition** - ใส่ `checkDuplicate: true` + `checkAmount: { type: "eq", amount }` กลับคืนเพื่อให้ Slip2GO ตรวจเงื่อนไขด้วย | `lib/slip2go.ts` |
| 15 | **F7: Remove Debug UI** - ลบ `[DEBUG]` text จากหน้าชำระเงิน, ลบ debug URL params (`qr`, `msg`), ลบ debug console.logs, ลบ `/api/test-slip2go` test endpoint | `app/checkout/[orderId]/payment-page.tsx`, `app/api/test-slip2go/route.ts` (deleted) |
| 16 | **F8: checkReceiver (reverted)** - เพิ่ม `checkReceiver` แต่ format ไม่ตรง API → Slip2GO reject request ทั้งหมด → revert ออก, ต้องยืนยัน format กับ Slip2GO support ก่อน | `lib/slip2go.ts`, `actions/orders.ts` |

**Key learnings จาก Slip2GO integration:**
- Image URL method: Slip2GO ปฏิเสธ URL จาก Supabase Storage (format validation strict)
- Base64 method: ต้องมี `data:image/<mime>;base64,` prefix + field name `imageBase64` + endpoint เฉพาะ
- QR Code method (สำเร็จ!): อ่าน QR จากรูปแล้วส่งแค่ text — เรียบง่ายและน่าเชื่อถือที่สุด
- sharp ไม่ทำงานบน Vercel serverless → ต้องอ่าน QR ฝั่ง browser แทน
- `200000` ≠ verified! ต้องใช้ `checkCondition` แล้วรอ `200200` เท่านั้น

### Session 10 (Feb 8, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **I2: Onboarding Customize Store** - เพิ่มขั้นตอน "ปรับแต่งร้านค้า" (ไม่บังคับ, ข้ามได้) ใน onboarding flow — เช็คจาก store_items, store_sections, store_design | `actions/onboarding.ts`, `onboarding-checklist.tsx`, `messages/*.json` |
| 2 | **Yearly Subscription** - เพิ่ม toggle Monthly/Yearly บน pricing (landing) + upgrade page, API รองรับ yearly 899 บาท/ปี (ลด 25%) | `pricing.tsx`, `upgrade-client.tsx`, `create-subscription/route.ts`, `messages/*.json` |

### Session 9 (Feb 7, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Center Navbar Tabs** - จัดเมนู landing page ให้อยู่กลาง (absolute + translate) | `components/landing/navbar.tsx` |
| 2 | **Translate My Store** - แปล 7 components: store-editor, design-editor, add-product-modal, add-section-modal, draggable-product-item, draggable-section, mobile-preview | `components/my-store/*.tsx` (7 files) |
| 3 | **Translate UI Components** - แปล rich-text-editor (~30 strings), pro-gate (3 strings), spinner | `components/ui/rich-text-editor.tsx`, `components/shared/pro-gate.tsx`, `components/ui/spinner.tsx` |
| 4 | **Language Switcher on Store** - เพิ่มปุ่มเปลี่ยนภาษาบนหน้าร้านสาธารณะสำหรับลูกค้า | `app/u/[username]/page.tsx` |
| 5 | **Fix Auth Error Bug (Critical)** - เปลี่ยนจากเทียบ string ไทย `'กรุณาเข้าสู่ระบบ'` → `errorCode: 'AUTH_REQUIRED'` เพื่อให้ทำงานทุกภาษา | `actions/*.ts` (10 files), `app/dashboard/coupons/page.tsx`, `reviews/page.tsx`, `customers/page.tsx` |
| 6 | **Add errorCode to Action Types** - เพิ่ม `errorCode?: string` ใน return types ของ server actions ทั้งหมด | `actions/auth.ts`, `booking-slots.ts`, `calendar.ts`, `fulfillments.ts`, `orders.ts`, `products.ts`, `settings.ts`, `store-layout.ts` |
| 7 | **~100 New Translation Keys** - เพิ่ม 4 namespaces ใหม่: MyStore (50+ keys), ProGate (3 keys), RichTextEditor (25+ keys), Spinner (1 key) | `messages/th.json`, `messages/en.json` |

### Session 8 (Feb 7, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **i18n Rollout Steps 1-9** - ทำ i18n ทั้ง platform ผ่าน 9 steps (infrastructure, landing, auth, dashboard nav, all dashboard pages, store+checkout, server actions+emails, DB+store language, onboarding) | ~80 files, ~1000 translation keys |
| 2 | **DB Migration 016** - เพิ่ม `store_language` column ใน creators table | `016_store_language.sql` |
| 3 | **Cookie-based Locale** - ระบบเปลี่ยนภาษาผ่าน cookie (ไม่เปลี่ยน URL) + sync กับ store_language ของ creator | `i18n/request.ts`, `actions/locale.ts`, `settings-form.tsx`, `store/page.tsx` |
| 4 | **Audit & Deploy** - ตรวจสอบงาน i18n ทั้งหมด, พบ bugs (auth string, น. suffix), commit + push to Vercel | All i18n files |

### Session 7 (Feb 7, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **Onboarding Overlay** - ย้ายจาก dashboard page เป็น floating overlay มุมขวาล่างทุกหน้า | `onboarding-checklist.tsx`, `dashboard/layout.tsx`, `dashboard/page.tsx` |
| 2 | **Onboarding: เพิ่มขั้นตอน** - เพิ่ม "ช่องทางติดต่อ" (บังคับ) + "อีเมลแจ้งเตือน" (ไม่บังคับ/ข้ามได้) | `onboarding-checklist.tsx`, `actions/onboarding.ts` |
| 3 | **บังคับช่องทางติดต่อก่อนเปิดร้าน** - Server-side enforcement + UI hint | `actions/settings.ts`, `settings-form.tsx` |
| 4 | **Fix: Tab navigation** - Settings form sync activeTab กับ URL ?tab= params (แก้ปุ่ม onboarding ไม่เปลี่ยน tab) | `settings-form.tsx`, `onboarding-checklist.tsx` |
| 5 | **Replace LINE Notify → Email (Resend)** - LINE Notify ปิดบริการ 31 มี.ค. 2025, เปลี่ยนเป็นส่งอีเมลแจ้งเตือนผ่าน Resend | `actions/orders.ts`, `lib/email.ts`, `settings-form.tsx`, `types/index.ts`, `validations/settings.ts`, `actions/settings.ts`, `actions/onboarding.ts`, `015_notification_email.sql` |
| 6 | **ลบ LINE Notify** - ลบ `lib/line-notify.ts`, เปลี่ยน DB column `line_notify_token` → `notification_email` | `lib/line-notify.ts` (deleted), `015_notification_email.sql` |
| 7 | **Email Template ใหม่** - `sendSlipUploadedNotificationEmail` แจ้ง creator เมื่อลูกค้าอัพสลิป | `lib/email.ts` |

### Session 6 (Feb 7, 2026) - Previous Session

| # | Change | Files Modified |
|---|--------|----------------|
| 1 | **SHOULD Fixes** - Fix 6 issues: server-side export check, calendar SEO, product limit on new page, pricing text, broken links, footer placeholders | `actions/customers.ts`, `calendar/layout.tsx`, `products/new/page.tsx`, `pricing.tsx`, `footer.tsx` |
| 2 | **N1: LINE Notify** - แจ้งเตือน creator ผ่าน LINE (ต่อมาเปลี่ยนเป็น Email ใน Session 7) | `lib/line-notify.ts`, `actions/orders.ts`, `settings-form.tsx`, `validations/settings.ts`, `actions/settings.ts`, `014_line_notify.sql` |
| 3 | **N2: Pro Badge on Store** - แสดง verified badge (✓) ข้างชื่อ creator ที่เป็น Pro ทุก layout | `store-header.tsx` |
| 4 | **N3: Onboarding Flow** - Checklist progress bar สำหรับ creator ใหม่ (โปรไฟล์/การรับเงิน/สินค้า/เปิดร้าน) | `onboarding-checklist.tsx`, `dashboard/page.tsx` |
| 5 | **N4: Advanced Analytics (Pro)** - การเติบโต, ช่วงเวลาขายดี, วันที่ขายดี, ข้อมูลลูกค้า + Pro gate | `actions/analytics.ts`, `analytics-charts.tsx`, `analytics/page.tsx` |
| 6 | **Settings Notifications Tab** - เพิ่ม tab แจ้งเตือนในตั้งค่า | `settings-form.tsx` |

### Session 5 (Feb 7, 2026) - Previous Session

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
4. `014_line_notify.sql` - LINE Notify token field (ถูกแทนที่ด้วย 015)
5. `015_notification_email.sql` - Replace LINE Notify → Email Notifications
6. `016_store_language.sql` - Store language preference (th/en)
7. `017_slip_verification.sql` - Slip2GO auto-verification columns
8. `018_default_notification_email.sql` - Auto-set notification_email from signup email + backfill existing

**Latest migration (018):**
```sql
-- Update trigger to auto-set notification_email for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creators (user_id, username, display_name, notification_email)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)), ' ', '')),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing creators
UPDATE public.creators
SET notification_email = auth.users.email
FROM auth.users
WHERE creators.user_id = auth.users.id
  AND (creators.notification_email IS NULL OR creators.notification_email = '');
```

---

## Pricing Model

| Feature | Free | Pro |
|---------|------|-----|
| สินค้า | 2 ชิ้น | ไม่จำกัด |
| หน้าร้านสวย | ✅ | ✅ |
| PromptPay QR | ✅ | ✅ |
| ตรวจสลิปอัตโนมัติ | ✅ | ✅ |
| คูปอง | ✅ | ✅ |
| ปฏิทินนัดหมาย (Calendar UI) | ✅ | ✅ |
| จำกัดจองต่อคน | ✅ | ✅ |
| Export ข้อมูล | ❌ | ✅ |
| จัดการรีวิว | ❌ | ✅ |
| ลบ Branding | ❌ | ✅ |
| Analytics ขั้นสูง | ❌ | ✅ |

**Pro Pricing:**
- **Monthly:** 99 บาท/เดือน (3.3 บาท/วัน)
- **Yearly:** 899 บาท/ปี (2.4 บาท/วัน — ลด 25%)
- Toggle สลับ monthly/yearly บน landing page + upgrade page

---

## Known Issues / Notes

### i18n Remaining Items (ไม่ block launch)
| Item | Priority | Description |
|------|----------|-------------|
| `lib/constants.ts` labels | Low | ORDER_STATUS, PAYMENT_STATUS, PRODUCT_TYPES descriptions ยังเป็นไทย (ใช้ในไม่กี่ที่, label ภาษาอังกฤษแล้ว) |
| Zod validation messages | Low | Error messages ใน `lib/validations/*.ts` ยังเป็นไทย (module-level, ต้องใช้ custom error map) |
| Hardcoded "น." suffix | Low | Thai time suffix "น." (นาฬิกา) hardcoded ใน `lib/email.ts`, `checkout/success/page.tsx`, `manage-booking.tsx` |
| `lib/constants.ts` APP_DESCRIPTION | Low | "ขายของออนไลน์ผ่านลิงก์เดียว สำหรับ Content Creator ไทย" - ใช้ใน SEO metadata |
| `lib/ics.ts` calendar strings | Low | Calendar event descriptions ยังเป็นไทย |
| Quick Reply templates | OK | เป็น Thai intentional content (template สำหรับตลาดไทย) |
| Terms/Privacy pages | OK | เป็น Thai legal content (intentional) |

### Auth Error Handling (Fixed in Session 9)
- ~~เดิมเช็ค `result.error === 'กรุณาเข้าสู่ระบบ'` ซึ่ง fail เมื่อเปลี่ยนเป็นภาษาอังกฤษ~~
- ✅ แก้แล้ว: ใช้ `errorCode: 'AUTH_REQUIRED'` ซึ่งทำงานได้ทุกภาษา

### Timezone
- All date handling for Thai users uses UTC+7
- Coupon start/end dates converted with `+07:00` offset
- Calendar UI: ใช้ `isMounted` flag เพื่อป้องกัน SSR timezone mismatch (Vercel=UTC, Client=UTC+7)
- **Minor issue:** `getAvailableSlotsForReschedule` parse date ไม่มี `+07:00` offset ซึ่งอาจทำให้ advance hour calculation เพี้ยนเล็กน้อย (ไม่ critical สำหรับ MVP)

### Backward Compatibility
- Product type "live" ยังรองรับในฐานข้อมูลเก่า
- จะถูก treat เหมือน "booking" ใน UI

### Payment Flow
- ลูกค้าชำระผ่าน PromptPay QR เท่านั้น (ลบ Bank Transfer + Upload QR แล้วเพื่อความปลอดภัย)
- อัพโหลดสลิป → **ระบบตรวจ QR อัตโนมัติผ่าน Slip2GO**
  - ✅ สลิปถูกต้อง (`200200`) → Auto-confirm ทันที ไปหน้า success (ทุกประเภทสินค้ารวม booking)
  - ❌ สลิปไม่ผ่าน → แจ้งเตือนลูกค้า + แจ้ง creator พร้อมเหตุผล (email + dashboard badge) + รอ Creator ตรวจสอบ manual
  - 🔄 Retry: ถ้า `200404` (Not found) → retry สูงสุด 2 ครั้ง (delay 5 วินาที, disable checkDuplicate ใน retry)
  - 🚫 `200501` (Duplicate slip) → hard fail ทันที ไม่ retry (ป้องกันสลิปปลอมผ่าน)
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
RESEND_FROM_EMAIL=Sellio <noreply@trysellio.com>
NEXT_PUBLIC_APP_URL=
CRON_SECRET=

# Stripe (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Slip2GO (Auto Slip Verification)
SLIP2GO_API_URL=https://connect.slip2go.com
SLIP2GO_SECRET_KEY=<your-secret-key>

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
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
| Settings | `app/dashboard/settings/settings-form.tsx` (tabbed: profile/payments/store/SEO/notifications/billing) |
| Booking Location Settings | `app/dashboard/products/[productId]/edit/booking-location-settings.tsx` + `actions/products.ts` (`updateProductLocationSettings`) |
| Booking Time Settings | `app/dashboard/products/[productId]/edit/booking-settings.tsx` + `actions/products.ts` (`updateProductBookingSettings`) |
| Calendar Booking UI | `app/u/[username]/[productId]/product-detail.tsx` (calendar grid, slot selection) |
| Billing/Subscription | `settings-form.tsx` (BillingTab), `api/stripe/cancel-subscription/route.ts` |
| Upgrade Page | `app/dashboard/upgrade/page.tsx`, `upgrade-client.tsx` |
| Payment Page | `app/checkout/[orderId]/payment-page.tsx` |
| Slip Verification (API) | `lib/slip2go.ts` (`verifySlipByQrCode`) |
| Slip Verification (QR read) | `app/checkout/[orderId]/payment-page.tsx` (`extractQrCodeFromFile` — client-side Canvas + jsQR) |
| Slip Verification (debug) | `app/api/test-slip2go/route.ts` (test endpoint — remove after testing) |
| Email Notifications (Creator) | `lib/email.ts` (`sendNewOrderNotificationEmail`, `sendSlipUploadedNotificationEmail`) |
| Onboarding | `components/dashboard/onboarding-checklist.tsx`, `actions/onboarding.ts` |
| Logo | `public/logo-black.png`, `public/logo-white.png` |
| i18n Config | `i18n/request.ts`, `messages/th.json`, `messages/en.json` |
| Language Switcher | `components/shared/language-switcher.tsx` (ใช้ใน navbar, dashboard header, store page) |
| My Store Components | `components/my-store/*.tsx` (store-editor, design-editor, modals, draggables, preview) |
| Store Design | `components/my-store/design-editor.tsx` (templates, colors, fonts) |
| PostHog (Client) | `components/posthog-provider.tsx` (init + pageview), `components/posthog-identifier.tsx` (user identify) |
| PostHog (Server) | `lib/posthog-server.ts` (`getPostHogServer`, `trackServerEvent`) |
| Favicon | `app/favicon.ico`, `public/favicon.png`, `app/layout.tsx` (metadata.icons) |

---

## Quick Commands
```bash
# Development
cd new
npm run dev

# Open at http://localhost:3000
```

---

## i18n Translation Summary

### Namespaces (ทั้งหมดใน `messages/th.json` + `messages/en.json`)

| Namespace | Keys | Used In |
|-----------|------|---------|
| Navbar | 6 | Landing page navigation |
| Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer | ~80 | Landing page sections |
| Auth | ~20 | Login/Signup pages |
| Dashboard | ~15 | Dashboard overview |
| Sidebar, Header | ~20 | Dashboard navigation |
| Analytics, DateFilter | ~30 | Analytics page |
| Products, ProductForm, ProductNew, ProductEdit | ~60 | Product management |
| BookingSettings, BookingSlots | ~50 | Booking system (incl. date range mode) |
| Orders, Fulfillment | ~30 | Order management |
| Customers | ~15 | Customer list |
| Reviews | ~20 | Review management |
| Coupons | ~25 | Coupon management |
| CalendarPage | ~10 | Calendar view |
| Settings | ~50 | Settings page (all tabs) |
| Upgrade | ~20 | Upgrade page |
| **MyStore** | **~50** | **Store editor, design, modals, preview** |
| QuickReply | ~15 | Quick reply templates |
| StoreFront, ProductDetail | ~25 | Public store pages |
| Checkout, Payment, OrderSuccess, ManageBooking | ~60 | Checkout flow |
| ReviewSection, ProductReviews | ~15 | Public reviews |
| ShareButtons, DownloadButton | ~10 | Shared components |
| ServerActions | ~140 | Server action error/success messages |
| Notifications | ~14 | Dashboard notifications |
| Emails | ~60 | Email templates |
| Onboarding | ~20 | Onboarding checklist |
| **ProGate** | **3** | **Pro feature gate** |
| **RichTextEditor** | **~25** | **Rich text editor UI** |
| **Spinner** | **1** | **Loading spinner** |
| LanguageSwitcher | 2 | Language switcher component |
| **Total** | **~1,200+** | **ทั้ง platform** |

(Bold = เพิ่มใน Session 9)

---

## Last Updated
February 16, 2026 (Session 14)

---

**Contact:** Continue from where this document leaves off. The codebase is well-structured and follows consistent patterns.
