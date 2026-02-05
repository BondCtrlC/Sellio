# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Pages     │  │   Server    │  │   API Routes    │   │  │
│  │  │ (App Router)│  │   Actions   │  │   (webhooks)    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  PostgreSQL │  │       Storage           │  │
│  │  (email/pw) │  │  (+ RLS)    │  │ (avatars, products,     │  │
│  │             │  │             │  │  digital-files, slips)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure (Detailed)

```
thai-creator-store/
├── app/                              # Next.js App Router
│   │
│   ├── (auth)/                       # Auth route group (no layout nesting)
│   │   ├── login/
│   │   │   └── page.tsx              # Login form
│   │   ├── signup/
│   │   │   └── page.tsx              # Signup form (Creator registration)
│   │   ├── layout.tsx                # Centered auth layout
│   │   └── auth-form.tsx             # Shared auth form component
│   │
│   ├── (public)/                     # Public pages route group
│   │   ├── u/
│   │   │   └── [username]/
│   │   │       ├── page.tsx          # Creator Store page
│   │   │       └── loading.tsx       # Loading state
│   │   ├── p/
│   │   │   └── [productId]/
│   │   │       └── page.tsx          # Product detail (optional)
│   │   └── layout.tsx                # Minimal public layout
│   │
│   ├── (checkout)/                   # Checkout flow route group
│   │   ├── checkout/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx          # Upload slip, show QR
│   │   ├── success/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx          # Status + download/access
│   │   └── layout.tsx                # Checkout layout (simple)
│   │
│   ├── dashboard/                    # Protected Creator Dashboard
│   │   ├── page.tsx                  # Overview/stats
│   │   ├── products/
│   │   │   ├── page.tsx              # Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create product
│   │   │   └── [productId]/
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit product
│   │   ├── orders/
│   │   │   ├── page.tsx              # Order list
│   │   │   └── [orderId]/
│   │   │       └── page.tsx          # Order detail + confirm
│   │   ├── settings/
│   │   │   └── page.tsx              # Profile, payment QR
│   │   └── layout.tsx                # Dashboard layout (sidebar)
│   │
│   ├── api/                          # API Route Handlers
│   │   └── webhooks/
│   │       └── route.ts              # Future: payment webhooks
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── not-found.tsx                 # 404 page
│   ├── error.tsx                     # Error boundary
│   └── globals.css                   # Global styles
│
├── components/                       # Reusable Components
│   │
│   ├── ui/                           # Base UI (Button, Input, Card, etc.)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown.tsx
│   │   ├── toast.tsx
│   │   ├── spinner.tsx
│   │   └── index.ts                  # Barrel export
│   │
│   ├── forms/                        # Form Components
│   │   ├── product-form.tsx          # Create/Edit product
│   │   ├── settings-form.tsx         # Creator settings
│   │   ├── checkout-form.tsx         # Buyer info + slip upload
│   │   └── image-upload.tsx          # Image upload component
│   │
│   ├── dashboard/                    # Dashboard-specific
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   ├── order-table.tsx
│   │   ├── product-card.tsx
│   │   └── confirm-payment-modal.tsx
│   │
│   ├── store/                        # Public store components
│   │   ├── creator-header.tsx        # Profile header
│   │   ├── product-grid.tsx          # Product listing
│   │   ├── product-card.tsx          # Product card
│   │   ├── product-modal.tsx         # Quick view modal
│   │   ├── order-status.tsx          # Order tracking
│   │   └── qr-display.tsx            # PromptPay QR display
│   │
│   └── shared/                       # Shared across app
│       ├── navbar.tsx
│       ├── footer.tsx
│       ├── logo.tsx
│       └── copy-button.tsx           # Copy to clipboard
│
├── lib/                              # Library/Utilities
│   │
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient
│   │   ├── server.ts                 # createServerClient
│   │   ├── admin.ts                  # createServiceRoleClient
│   │   └── middleware.ts             # Auth middleware helper
│   │
│   ├── validations/                  # Zod Schemas
│   │   ├── auth.ts                   # Login/signup schemas
│   │   ├── product.ts                # Product schemas
│   │   ├── order.ts                  # Order schemas
│   │   └── settings.ts               # Settings schemas
│   │
│   ├── utils.ts                      # General utilities
│   ├── constants.ts                  # App constants
│   └── format.ts                     # Formatting helpers
│
├── types/                            # TypeScript Types
│   ├── index.ts                      # Main type exports
│   ├── database.ts                   # Supabase generated types
│   └── api.ts                        # API response types
│
├── actions/                          # Server Actions
│   ├── auth.ts                       # Login, signup, logout
│   ├── creators.ts                   # Creator profile CRUD
│   ├── products.ts                   # Product CRUD
│   ├── orders.ts                     # Create order, get orders
│   ├── payments.ts                   # Upload slip, confirm payment
│   └── fulfillments.ts               # Get download URL, etc.
│
├── hooks/                            # Custom React Hooks
│   ├── use-creator.ts                # Current creator data
│   ├── use-products.ts               # Products data
│   ├── use-orders.ts                 # Orders data
│   └── use-toast.ts                  # Toast notifications
│
├── docs/                             # Documentation
│   ├── architecture.md               # This file
│   ├── db-schema.md                  # Database schema
│   ├── user-flows.md                 # User flows
│   └── backlog.md                    # Task backlog
│
├── public/                           # Static assets
│   ├── logo.svg
│   └── og-image.png
│
├── middleware.ts                     # Next.js middleware (auth check)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .env.local                        # (gitignored)
└── .gitignore
```

---

## Data Flow

### 1. Creator Onboarding
```
[Signup Page] 
    → Server Action: createUser
    → Supabase Auth: signUp
    → Trigger: auto-create creators row
    → Redirect: /dashboard/settings
```

### 2. Product Creation
```
[Dashboard/Products/New]
    → Form submit
    → Server Action: createProduct
    → Upload images to Storage
    → Insert to products table
    → Redirect: /dashboard/products
```

### 3. Purchase Flow
```
[Store /u/username]
    → Select product
    → Server Action: createOrder
    → Redirect: /checkout/{orderId}
    
[Checkout Page]
    → Show PromptPay QR
    → Buyer uploads slip
    → Server Action: uploadSlip
    → Redirect: /success/{orderId}
```

### 4. Payment Confirmation
```
[Dashboard/Orders]
    → Creator views pending orders
    → Opens order detail
    → Views slip image
    → Clicks "Confirm Payment"
    → Server Action: confirmPayment
    → Updates payment status
    → Creates fulfillment record
    → Buyer sees download/access
```

---

## Security Model

### Row Level Security (RLS)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| creators | Public (published) | Auth user (own) | Own only | Own only |
| products | Public (published) | Creator (own) | Own only | Own only |
| orders | Creator (own orders) | Anyone | Own order only | - |
| payments | Creator + Buyer | Anyone | Creator only | - |
| fulfillments | Buyer (own) | Creator | Creator | - |

### Authentication Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Middleware │────▶│  Dashboard  │
│  (Browser)  │     │ (check auth)│     │   Pages     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │   Redirect  │
       │            │  to /login  │
       │            └─────────────┘
       │
       ▼
┌─────────────────────────────────┐
│         Supabase Auth           │
│  - Session management           │
│  - JWT in cookies               │
│  - Refresh token rotation       │
└─────────────────────────────────┘
```

---

## Component Architecture

### UI Component Hierarchy
```
<RootLayout>
  ├── <Navbar /> (landing only)
  │
  ├── <AuthLayout>
  │   └── <AuthForm />
  │
  ├── <PublicLayout>
  │   ├── <CreatorHeader />
  │   └── <ProductGrid />
  │
  ├── <CheckoutLayout>
  │   ├── <QRDisplay />
  │   └── <CheckoutForm />
  │
  └── <DashboardLayout>
      ├── <Sidebar />
      ├── <Header />
      └── <PageContent />
```

### State Management
- **Server State**: Server Components + Server Actions
- **Client State**: React `useState` for UI state
- **Form State**: React Hook Form
- **No global state library** (keep simple for MVP)

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files/Folders | kebab-case | `product-form.tsx` |
| Components | PascalCase | `ProductForm` |
| Functions | camelCase | `createProduct` |
| Types/Interfaces | PascalCase | `Product`, `Creator` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Database tables | snake_case | `order_items` |
| Database columns | snake_case | `created_at` |

---

## Error Handling Strategy

```typescript
// Server Actions return consistent format
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Usage in component
const result = await createProduct(formData);
if (!result.success) {
  toast.error(result.error);
  return;
}
// Handle success
```

---

## Performance Considerations

1. **Images**: Use Next.js `<Image>` with Supabase transform
2. **Data fetching**: Server Components by default
3. **Loading states**: Streaming with `loading.tsx`
4. **Caching**: Use `revalidatePath` / `revalidateTag`
5. **Bundle size**: Dynamic imports for modals/heavy components
