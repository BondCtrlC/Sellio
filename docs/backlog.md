# Product Backlog

## Priority Legend
- **P0** = Must have for MVP launch
- **P1** = Nice to have, reduces friction

---

## P0: Core MVP

### 1. Project Setup
- [ ] Initialize Next.js 14 with App Router
- [ ] Configure TypeScript strict mode
- [ ] Setup Tailwind CSS
- [ ] Setup Supabase client (browser + server)
- [ ] Create environment variables (.env.example)
- [ ] Setup middleware for auth
- [ ] Create base UI components (Button, Input, Card, etc.)

### 2. Database Setup
- [ ] Create Supabase project
- [ ] Run SQL schema (tables + indexes)
- [ ] Setup RLS policies
- [ ] Create storage buckets (avatars, products, digital-files, slips)
- [ ] Setup storage policies
- [ ] Test RLS policies work correctly

### 3. Authentication
- [ ] Create `/login` page
- [ ] Create `/signup` page
- [ ] Implement email/password signup
- [ ] Implement email/password login
- [ ] Implement logout
- [ ] Auto-create creator profile on signup (trigger)
- [ ] Redirect authenticated users to dashboard
- [ ] Redirect unauthenticated users from protected routes

### 4. Creator Dashboard - Layout
- [ ] Create dashboard layout with sidebar
- [ ] Create dashboard header with user info
- [ ] Create sidebar navigation
- [ ] Mobile responsive sidebar (hamburger menu)

### 5. Creator Settings
- [ ] Create `/dashboard/settings` page
- [ ] Profile form (display_name, bio)
- [ ] Avatar upload
- [ ] PromptPay settings (ID, name)
- [ ] Contact info (Line, IG, email)
- [ ] Publish/unpublish store toggle
- [ ] Form validation with Zod

### 6. Product Management
- [ ] Create `/dashboard/products` page (list)
- [ ] Create `/dashboard/products/new` page
- [ ] Create `/dashboard/products/[id]/edit` page
- [ ] Product form component
- [ ] Product type selection (digital/booking/live)
- [ ] Basic fields: title, description, price, image
- [ ] Digital product: file upload
- [ ] Digital product: auto-deliver toggle
- [ ] Booking product: duration, location type
- [ ] Live product: date/time, platform, capacity
- [ ] Publish/unpublish product
- [ ] Delete product
- [ ] Product image upload to storage

### 7. Public Store Page
- [ ] Create `/u/[username]` page
- [ ] Creator profile header (avatar, name, bio)
- [ ] Product grid
- [ ] Product card component
- [ ] Product detail modal
- [ ] Handle 404 for non-existent/unpublished stores
- [ ] Mobile-first responsive design
- [ ] Fast loading (server components)

### 8. Checkout Flow
- [ ] Create order creation flow
- [ ] Buyer info form (email, name, phone)
- [ ] Booking: date/time selection
- [ ] Create `/checkout/[orderId]` page
- [ ] Display PromptPay QR code
- [ ] Display payment amount
- [ ] Slip upload component
- [ ] Upload slip to storage
- [ ] Create payment record
- [ ] Redirect to success page

### 9. Order Status Page
- [ ] Create `/success/[orderId]` page
- [ ] Display order status
- [ ] Status: pending payment
- [ ] Status: pending confirmation
- [ ] Status: confirmed + fulfillment
- [ ] Display creator contact info
- [ ] Copy order link button

### 10. Order Management
- [ ] Create `/dashboard/orders` page (list)
- [ ] Order list with filters (all, pending, confirmed, cancelled)
- [ ] Order card component
- [ ] Create `/dashboard/orders/[id]` page (detail)
- [ ] Display order info
- [ ] Display buyer info
- [ ] Display slip image (expandable)
- [ ] Confirm payment button
- [ ] Reject payment button (with reason)
- [ ] Idempotent confirmation (prevent double confirm)

### 11. Fulfillment
- [ ] Auto-create fulfillment record on confirmation
- [ ] Digital: generate download access
- [ ] Digital: download count tracking
- [ ] Booking: input meeting details form
- [ ] Booking: display meeting details to buyer
- [ ] Live: display access info to buyer
- [ ] Copy buttons for all links

### 12. Dashboard Overview
- [ ] Create `/dashboard` page
- [ ] Basic stats: total orders, pending, revenue
- [ ] Recent orders list
- [ ] Quick actions (add product, view store)

---

## P1: Friction Reducers

### 13. Auto-Reply Helper
- [ ] Generate store link message
- [ ] Generate per-product messages
- [ ] Copy button for each message
- [ ] Custom message template editor

### 14. Product Sorting
- [ ] Drag & drop reorder products
- [ ] Save sort order

### 15. UX Improvements
- [ ] Toast notifications
- [ ] Loading states/skeletons
- [ ] Error boundaries
- [ ] Empty states
- [ ] Confirmation dialogs

### 16. SEO & Meta
- [ ] Meta tags for store pages
- [ ] Open Graph images
- [ ] Structured data

### 17. Email Notifications
- [ ] Email to buyer: order created
- [ ] Email to buyer: payment confirmed
- [ ] Email to buyer: payment rejected
- [ ] Email to creator: new order received

### 18. Analytics (Basic)
- [ ] Page views per store
- [ ] Product views
- [ ] Conversion rate

### 19. Landing Page
- [ ] Hero section
- [ ] Features section
- [ ] How it works
- [ ] CTA to signup

---

## Development Sprints (Suggested)

### Sprint 1: Foundation
- Project Setup
- Database Setup
- Authentication
- Dashboard Layout

### Sprint 2: Creator Core
- Creator Settings
- Product Management (basic)

### Sprint 3: Public Store
- Store Page
- Product Display
- Product Modal

### Sprint 4: Checkout
- Order Creation
- Checkout Page
- Slip Upload
- Success Page

### Sprint 5: Order Management
- Order List
- Order Detail
- Payment Confirmation
- Fulfillment

### Sprint 6: Polish
- Dashboard Overview
- UX Improvements
- Bug Fixes
- Testing

### Sprint 7: Enhancements (P1)
- Auto-Reply Helper
- Product Sorting
- Email Notifications

---

## Technical Debt Tracker

| Item | Priority | Notes |
|------|----------|-------|
| Add proper error handling | High | Currently basic try/catch |
| Add input sanitization | High | XSS prevention |
| Add rate limiting | Medium | Prevent abuse |
| Add request logging | Medium | Debugging |
| Add unit tests | Medium | Critical paths |
| Add E2E tests | Low | Full flows |
| Optimize images | Medium | Use Next.js Image |
| Add caching | Low | revalidate strategies |

---

## Out of Scope (Phase 2+)

- ❌ Payment gateway integration (Opn Payments)
- ❌ Auto payment confirmation
- ❌ Creator payout system
- ❌ Google Calendar integration
- ❌ Course/LMS features
- ❌ Membership/subscription
- ❌ Multi-currency
- ❌ Affiliate/referral system
- ❌ Mobile app
