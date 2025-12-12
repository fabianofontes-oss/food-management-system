# 👥 Team Management Guide

**Status:** ✅ IMPLEMENTED  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

This document describes the team management system for multi-store accounts:
- Select Store page for users with multiple stores
- Team management page for inviting and managing store members
- Role-based permissions (owner/manager/staff)
- Invite flow using Supabase Admin API

---

## 🎯 PURPOSE & ROLES

### **User Roles:**

**Owner (Proprietário)**
- Full control of the store
- Can invite members with any role
- Can change member roles
- Can remove any member (except last owner)
- Can access all dashboard features

**Manager (Gerente)**
- Can manage store operations
- Can invite staff members only
- Cannot change roles
- Can remove staff members (not owners)
- Can access most dashboard features

**Staff (Funcionário)**
- Limited access to store operations
- Cannot manage team
- Read-only access to team page
- Cannot invite or remove members

---

## 🔐 REQUIRED CONFIGURATION

### **Environment Variable:**

```env
# .env.local (SERVER ONLY - NEVER EXPOSE TO CLIENT)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **CRITICAL SECURITY NOTE:**
- This key has **FULL DATABASE ACCESS**
- **NEVER** expose it to the client
- Only use in Server Actions or API Routes
- Keep it in `.env.local` (gitignored)

### **How to get the Service Role Key:**

1. Go to Supabase Dashboard
2. Navigate to Settings > API
3. Copy "service_role" key (not "anon" key)
4. Add to `.env.local`

---

## 🚀 FEATURES

### **1. Select Store Page**

**Route:** `/select-store`

**Behavior:**
- Automatically shown after login if user has multiple stores
- Lists all stores user has access to
- Shows user's role in each store
- One-click access to any store dashboard
- Logout button

**Auto-redirect:**
- 0 stores → Show "No access" message
- 1 store → Auto-redirect to dashboard
- 2+ stores → Show selection page

---

### **2. Team Management Page**

**Route:** `/[slug]/dashboard/team`

**Features:**
- View all team members
- See member emails, roles, and join dates
- Invite new members by email
- Change member roles (owner only)
- Remove members (owner/manager)

**Permissions:**
- **Owner:** Full access to all features
- **Manager:** Can invite staff, cannot change roles
- **Staff:** Read-only view (or hidden)

---

## 📧 INVITE FLOW

### **How it works:**

1. **Owner/Manager enters email and selects role**
2. **System checks if user exists in Supabase Auth:**
   - If exists: Use existing user_id
   - If not: Create new user with `email_confirm: true`
3. **System adds user to `store_users` table**
4. **System generates password recovery link** (for new users)
5. **User receives email** (Supabase default or custom)

### **Technical Implementation:**

```typescript
// Server Action: inviteMember
1. Verify current user has permission (owner/manager)
2. Check if email exists in auth.users (via Admin API)
3. If not exists:
   - Create user: supabaseAdmin.auth.admin.createUser()
   - Generate recovery link: supabaseAdmin.auth.admin.generateLink()
4. Insert into store_users table
5. Revalidate page cache
```

### **Email Flow:**

**For existing users:**
- No email sent (they can login immediately)

**For new users:**
- Supabase sends default "Confirm your email" message
- User clicks link → Account confirmed
- User can set password via "Forgot password" flow

**Optional (future):**
- Send custom invite email with password setup link
- Use `generateLink({ type: 'recovery' })` for direct password setup

---

## 🛠️ MANUAL MEMBER MANAGEMENT

### **Add member via SQL:**

```sql
-- Get user_id from email
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Get store_id from slug
SELECT id, slug, name FROM stores WHERE slug = 'store-slug';

-- Add member to store
INSERT INTO store_users (store_id, user_id, role)
VALUES (
  'store-uuid-here',
  'user-uuid-here',
  'staff' -- or 'manager' or 'owner'
);
```

### **Change member role:**

```sql
UPDATE store_users
SET role = 'manager'
WHERE store_id = 'store-uuid'
  AND user_id = 'user-uuid';
```

### **Remove member:**

```sql
DELETE FROM store_users
WHERE store_id = 'store-uuid'
  AND user_id = 'user-uuid';
```

---

## 🧪 TESTING CHECKLIST

### **Basic Functionality:**
- [ ] User with 2+ stores sees select-store page
- [ ] User with 1 store auto-redirects to dashboard
- [ ] User with 0 stores sees "No access" message
- [ ] Team page loads and shows current members

### **Owner Permissions:**
- [ ] Owner can invite with any role (owner/manager/staff)
- [ ] Owner can change member roles
- [ ] Owner can remove any member
- [ ] Cannot remove last owner (validation works)
- [ ] Cannot remove self

### **Manager Permissions:**
- [ ] Manager can invite staff only
- [ ] Manager cannot invite owner/manager
- [ ] Manager cannot change roles
- [ ] Manager can remove staff
- [ ] Manager cannot remove owner

### **Staff Permissions:**
- [ ] Staff can view team page (read-only)
- [ ] Staff cannot invite members
- [ ] Staff cannot change roles
- [ ] Staff cannot remove members

### **Invite Flow:**
- [ ] Inviting existing user works (no duplicate)
- [ ] Inviting new user creates account
- [ ] New user receives email
- [ ] Duplicate invite shows error
- [ ] Invalid email shows error

### **Security:**
- [ ] Service role key not exposed to client
- [ ] Middleware blocks unauthorized access
- [ ] RLS policies enforce store isolation
- [ ] Cannot access other store's team

---

## 🔒 SECURITY NOTES

### **Server-Side Validation:**

All team management actions are Server Actions with validation:

```typescript
// Every action validates:
1. User is authenticated (session check)
2. User has access to store (store_users check)
3. User has required role (owner/manager)
4. Action is allowed (business rules)
```

### **Business Rules Enforced:**

- ✅ Managers cannot assign owner role
- ✅ Cannot remove last owner
- ✅ Cannot remove self
- ✅ Managers cannot remove owners
- ✅ Duplicate memberships prevented (unique constraint)

### **RLS Policies:**

The `store_users` table has RLS enabled:
- Users can read their own memberships
- Owners can manage all store members
- Middleware enforces store access

---

## 📁 FILE STRUCTURE

```
src/app/
├── select-store/
│   └── page.tsx                    # Multi-store selection
├── [slug]/dashboard/
│   ├── DashboardClient.tsx         # Sidebar with Team link
│   └── team/
│       ├── page.tsx                # Team management UI
│       └── actions.ts              # Server Actions
└── (auth)/
    └── login/page.tsx              # Updated with multi-store redirect

docs/
└── TEAM_MANAGEMENT.md              # This file
```

---

## 🎨 UI COMPONENTS

### **Select Store Page:**
- Grid of store cards
- Store name, slug, and user role
- "Open" button for each store
- Logout button in header

### **Team Page:**
- Members table (email, role, date, actions)
- Invite form (email + role selector)
- Role badges (color-coded)
- Confirm dialog for removal
- Loading states and error handling

### **Sidebar:**
- "Equipe" menu item (cyan icon)
- Shown only for owner/manager
- Hidden for staff

---

## 🚨 TROUBLESHOOTING

### **"Service role key not found" error:**
```bash
# Check .env.local has:
SUPABASE_SERVICE_ROLE_KEY=your-key-here

# Restart dev server:
npm run dev
```

### **"Cannot invite member" error:**
- Verify user has owner/manager role
- Check service role key is correct
- Check Supabase project is active

### **"User already member" error:**
- This is expected for duplicate invites
- Check store_users table for existing membership

### **Middleware blocks team page:**
- Verify user has store_users membership
- Check middleware allows `/[slug]/dashboard/team`
- Verify session is valid

---

## 📚 RELATED DOCUMENTATION

- [Security Setup](./SECURITY_SETUP.md) - Auth, RLS, and permissions
- [Database Schema](../migrations/) - store_users table structure
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api) - Official docs

---

## 🎯 FUTURE ENHANCEMENTS

**Potential improvements (not implemented):**

1. **Custom invite emails:**
   - Send branded email with direct password setup link
   - Use Supabase email templates

2. **Invite expiration:**
   - Add expiry date to invites
   - Resend invite functionality

3. **Activity log:**
   - Track who invited whom
   - Log role changes and removals

4. **Bulk invites:**
   - CSV upload for multiple members
   - Batch processing

5. **Advanced permissions:**
   - Granular permissions per module
   - Custom roles beyond owner/manager/staff

---

## ✅ IMPLEMENTATION CHECKLIST

- [x] Create `store_users` table (migration 005)
- [x] Implement RLS policies (migration 006)
- [x] Create Server Actions (getTeamMembers, inviteMember, etc.)
- [x] Build Select Store page
- [x] Build Team Management page
- [x] Update login redirect logic
- [x] Add Team link to sidebar
- [x] Test all permission scenarios
- [x] Document setup and usage

---

**Team Management is fully operational!** 🚀

For questions or issues, refer to the troubleshooting section or check the related documentation.
