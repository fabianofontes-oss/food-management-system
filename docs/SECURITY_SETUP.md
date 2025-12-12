# 🔐 Security Setup Guide

**Status:** ⚠️ PARTIAL IMPLEMENTATION  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

This document describes the security implementation for the Food Management SaaS:
- ✅ Database migrations (store_users + RLS policies)
- ⏳ Real Supabase Auth (pending)
- ⏳ Route protection middleware (pending)
- ⏳ Auth pages (pending)

---

## 🗄️ DATABASE SETUP

### **Migrations Applied:**

1. **005_store_users_and_auth.sql**
   - Creates `store_users` table
   - Creates `user_role` enum (owner/manager/staff)
   - Implements RLS on store_users
   - Creates helper functions:
     - `user_has_store_access(store_id)`
     - `get_user_stores()`

2. **006_rls_policies.sql**
   - Enables RLS on critical tables:
     - stores
     - products
     - orders
     - order_items
     - deliveries
     - customers
     - customer_addresses
   - Implements store-scoped policies (SELECT/INSERT/UPDATE/DELETE)

### **Run Migrations:**

```bash
# Connect to Supabase and run migrations in order
psql $DATABASE_URL -f migrations/005_store_users_and_auth.sql
psql $DATABASE_URL -f migrations/006_rls_policies.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste migration content
3. Execute

---

## 👥 USER MANAGEMENT

### **1. Create a User**

Users are created via Supabase Auth:

**Option A: Supabase Dashboard**
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. User receives confirmation email

**Option B: Signup Page (when implemented)**
- Navigate to `/signup`
- Fill form and submit
- Verify email

### **2. Add Store Membership**

After user is created, add them to a store:

```sql
-- Add user as store owner
INSERT INTO store_users (store_id, user_id, role)
VALUES (
  'store-uuid-here',
  'user-uuid-here',
  'owner'
);

-- Add user as manager
INSERT INTO store_users (store_id, user_id, role)
VALUES (
  'store-uuid-here',
  'user-uuid-here',
  'manager'
);

-- Add user as staff
INSERT INTO store_users (store_id, user_id, role)
VALUES (
  'store-uuid-here',
  'user-uuid-here',
  'staff'
);
```

**Get user UUID:**
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

**Get store UUID:**
```sql
SELECT id, slug, name FROM stores WHERE slug = 'store-slug';
```

---

## 🔑 SUPER ADMIN ACCESS

### **Configuration:**

Add super admin emails to `.env.local`:

```env
SUPER_ADMIN_EMAILS=admin@example.com,owner@example.com
```

**Rules:**
- Super admins can access `/admin/*` routes
- Checked via middleware (when implemented)
- Comma-separated list of emails

---

## 🛡️ RLS POLICIES

### **Policy Logic:**

All critical tables use store-scoped policies:

```sql
-- Example: Users can only read orders from their stores
CREATE POLICY "Users can read orders from their stores"
  ON orders
  FOR SELECT
  USING (user_has_store_access(store_id));
```

**Helper Function:**
```sql
-- Returns true if user has access to store
user_has_store_access(p_store_id UUID) RETURNS BOOLEAN
```

### **Affected Tables:**
- ✅ stores (read only for members)
- ✅ products (full CRUD for members)
- ✅ orders (full CRUD for members)
- ✅ order_items (full CRUD via order.store_id)
- ✅ deliveries (full CRUD via order.store_id)
- ✅ customers (full CRUD for members)
- ✅ customer_addresses (full CRUD via customer.store_id)

---

## 🧪 TESTING

### **Test RLS Policies:**

```sql
-- Set user context (simulate logged-in user)
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to read orders (should only see user's stores)
SELECT * FROM orders;

-- Try to read another store's orders (should return empty)
SELECT * FROM orders WHERE store_id = 'other-store-uuid';
```

### **Test Store Access Function:**

```sql
-- Check if user has access to store
SELECT user_has_store_access('store-uuid-here');
-- Returns: true or false
```

### **Get User Stores:**

```sql
-- Get all stores user has access to
SELECT * FROM get_user_stores();
-- Returns: store_id, store_slug, store_name, user_role
```

---

## 🚧 PENDING IMPLEMENTATION

### **Auth Pages (TODO):**
- [ ] `/login` - Email/password login
- [ ] `/signup` - User registration
- [ ] `/logout` - Session cleanup
- [ ] `/reset-password` - Password reset flow
- [ ] `/unauthorized` - 403 error page

### **Middleware (TODO):**
- [ ] `middleware.ts` - Route protection
- [ ] Protect `/admin/*` (super admin only)
- [ ] Protect `/:slug/dashboard/*` (store members only)
- [ ] Redirect unauthenticated to `/login`
- [ ] Check store membership via `store_users`

### **Supabase Client (TODO):**
- [ ] Update to use `@supabase/ssr` or auth helpers
- [ ] Persist session with cookies
- [ ] Replace fake auth redirects

---

## 📝 ROLES & PERMISSIONS

### **Role Hierarchy:**

1. **Super Admin**
   - Access: `/admin/*`
   - Can manage all tenants and stores
   - Configured via `SUPER_ADMIN_EMAILS`

2. **Store Owner**
   - Access: `/:slug/dashboard/*`
   - Full control of their store
   - Can manage store users
   - Can view all reports

3. **Store Manager**
   - Access: `/:slug/dashboard/*`
   - Can manage orders, products, deliveries
   - Cannot manage store users (future)

4. **Store Staff**
   - Access: `/:slug/dashboard/*`
   - Can view and update orders
   - Limited access (future refinement)

---

## 🔒 SECURITY CHECKLIST

### **Database:**
- ✅ RLS enabled on critical tables
- ✅ Store-scoped policies implemented
- ✅ Helper functions created
- ✅ Indexes on store_users for performance

### **Auth (Pending):**
- ⏳ Real Supabase Auth
- ⏳ Email verification
- ⏳ Password reset
- ⏳ Session persistence

### **Routes (Pending):**
- ⏳ Middleware protection
- ⏳ Store membership check
- ⏳ Super admin check
- ⏳ Unauthorized page

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

1. **Run Migrations:**
   - ✅ 005_store_users_and_auth.sql
   - ✅ 006_rls_policies.sql

2. **Configure Environment:**
   - [ ] Set `SUPER_ADMIN_EMAILS` in production env
   - [ ] Verify Supabase project URL and keys
   - [ ] Enable email verification in Supabase

3. **Create Initial Users:**
   - [ ] Create super admin user
   - [ ] Create store owner users
   - [ ] Add store_users memberships

4. **Test Security:**
   - [ ] Verify RLS policies work
   - [ ] Test cross-store access (should fail)
   - [ ] Test unauthenticated access (should redirect)
   - [ ] Test unauthorized store access (should 403)

---

## 📚 RESOURCES

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## ⚠️ KNOWN ISSUES

1. **Auth pages not implemented yet**
   - Current login/signup are fake redirects
   - Need to implement real Supabase Auth

2. **Middleware not implemented yet**
   - Routes are not protected
   - Anyone can access any store dashboard

3. **Type definitions may need updates**
   - `payment_status` and `updated_at` missing from Order type
   - Need to sync types with database schema

---

**Status:** Migrations ready, awaiting auth implementation.  
**Next Steps:** Implement auth pages, middleware, and test security flow.
