# Thai Creator Store

> SaaS platform สำหรับ Content Creator ไทย - ขายของออนไลน์ผ่าน "ลิงก์เดียว"

## Overview

Thai Creator Store ช่วยให้ Creator สามารถ:
- สร้างหน้า Store ของตัวเอง (`/u/{username}`)
- ขายสินค้า 3 ประเภท: Digital Products, Booking, Live Sessions
- รับชำระเงินผ่าน PromptPay QR + Upload Slip
- จัดการ Order และยืนยันการชำระเงินผ่าน Dashboard

**ลด friction**: DM → Link → Buy → Receive ให้สั้นที่สุด

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) หรือ npm
- Supabase account

### Installation

```bash
# Clone repository
git clone <repo-url>
cd thai-creator-store

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

สร้างไฟล์ `.env.local` และใส่ค่าต่อไปนี้:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### วิธีหา Supabase Keys

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project > Settings > API
3. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (เก็บไว้ server-side เท่านั้น!)

---

## Supabase Setup

### 1. สร้าง Tables

ไปที่ Supabase Dashboard > SQL Editor และรัน SQL จากไฟล์ `/docs/db-schema.md`

### 2. ตั้งค่า Storage Buckets

สร้าง buckets ต่อไปนี้:

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Public | รูปโปรไฟล์ Creator |
| `products` | Public | รูปสินค้า |
| `digital-files` | Private | ไฟล์ Digital Products |
| `slips` | Private | Slip การชำระเงิน |

```sql
-- Storage Buckets (รันใน SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('digital-files', 'digital-files', false),
  ('slips', 'slips', false);
```

### 3. Storage Policies

```sql
-- Avatars: Public read, Creator upload own
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Products: Public read, Creator upload own
CREATE POLICY "Public can view products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Creators can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Digital files: Only creator and verified buyer
CREATE POLICY "Creator can manage digital files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'digital-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Slips: Buyer upload, Creator view
CREATE POLICY "Buyer can upload slip" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'slips');

CREATE POLICY "Creator can view own order slips" ON storage.objects
  FOR SELECT USING (bucket_id = 'slips');
```

---

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── u/[username]/page.tsx      # Creator Store
│   │   ├── p/[productId]/page.tsx     # Product Detail
│   │   └── layout.tsx
│   ├── (checkout)/
│   │   ├── checkout/[orderId]/page.tsx
│   │   └── success/[orderId]/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                   # Overview
│   │   ├── products/page.tsx          # Product CRUD
│   │   ├── orders/page.tsx            # Order Management
│   │   ├── settings/page.tsx          # Profile & Payment
│   │   └── layout.tsx
│   ├── api/
│   │   └── webhooks/
│   ├── layout.tsx
│   ├── page.tsx                       # Landing
│   └── globals.css
├── components/
│   ├── ui/                            # Base UI components
│   ├── forms/                         # Form components
│   ├── dashboard/                     # Dashboard components
│   └── store/                         # Store/public components
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   ├── server.ts                  # Server client
│   │   └── admin.ts                   # Admin client
│   ├── validations/                   # Zod schemas
│   └── utils.ts
├── types/
│   └── index.ts                       # TypeScript types
├── actions/                           # Server Actions
│   ├── auth.ts
│   ├── products.ts
│   ├── orders.ts
│   └── payments.ts
├── hooks/                             # Custom hooks
├── docs/                              # Documentation
└── public/
```

---

## Key Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login |
| `/signup` | Public | Register as Creator |
| `/u/[username]` | Public | Creator's Store |
| `/p/[productId]` | Public | Product Detail |
| `/checkout/[orderId]` | Public | Upload slip & track |
| `/success/[orderId]` | Public | Post-payment status |
| `/dashboard` | Protected | Creator Dashboard |
| `/dashboard/products` | Protected | Manage Products |
| `/dashboard/orders` | Protected | Manage Orders |
| `/dashboard/settings` | Protected | Profile & Payment |

---

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

---

## Documentation

- [Architecture](/docs/architecture.md) - โครงสร้างระบบ
- [Database Schema](/docs/db-schema.md) - ตาราง + RLS
- [User Flows](/docs/user-flows.md) - Flow การใช้งาน
- [Backlog](/docs/backlog.md) - Task checklist

---

## Phase Roadmap

### Phase 1 (MVP) - Current
- [x] Creator Auth & Profile
- [x] Product CRUD (Digital/Booking/Live)
- [x] Public Store Page
- [x] Order Creation
- [x] Slip Upload + Manual Confirm
- [x] Fulfillment (Download/Access)

### Phase 2 (Future)
- [ ] Opn Payments Integration
- [ ] Auto Payment Confirmation
- [ ] Payout to Creator
- [ ] Google Calendar Integration
- [ ] Advanced Analytics

---

## License

Private - All rights reserved
