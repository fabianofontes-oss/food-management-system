# 🎫 Coupons Module - MVP

**Status:** ✅ IMPLEMENTED  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

Complete coupon system for discount management in both public checkout and POS. Store owners and managers can create, manage, and track coupon usage.

**Routes:**
- Dashboard: `/[slug]/dashboard/coupons`
- Checkout: `/[slug]/checkout` (coupon input integrated)
- POS: `/[slug]/dashboard/pos` (coupon input integrated)

**Access:** Owner and Manager (Staff read-only optional)

---

## 🎯 FEATURES IMPLEMENTED

### **1. Coupon Types**

**Percentage Discount:**
- Value: 1-100%
- Applied to subtotal
- Example: 10% off = R$ 100.00 → R$ 90.00

**Fixed Amount Discount:**
- Value: R$ amount
- Applied to subtotal (capped at subtotal)
- Example: R$ 20.00 off = R$ 100.00 → R$ 80.00

### **2. Validation Rules**

**Code:**
- Required, uppercase, alphanumeric only
- Unique per store
- Case-insensitive matching

**Active Status:**
- Must be active (`is_active = true`)

**Date Range:**
- Optional `starts_at` and `ends_at`
- Coupon valid only within date range
- Timezone: UTC (limitation)

**Usage Limits:**
- Optional `max_uses`
- Tracks `uses_count`
- Coupon invalid when `uses_count >= max_uses`

**Minimum Order:**
- Optional `min_order_amount`
- Order subtotal must be >= min_order_amount

### **3. Dashboard CRUD**

**List View:**
- All coupons for store
- Status badges: Active, Inactive, Expired, Exhausted
- Usage tracking (X / Y or X / ∞)
- Validity dates display

**Create/Edit:**
- Modal form with validation
- All fields configurable
- Real-time validation feedback

**Actions:**
- Toggle active/inactive
- Edit coupon details
- Delete coupon (with confirmation)

### **4. Checkout Integration**

**UI:**
- Coupon input field + Apply button
- Success: Shows applied coupon with discount
- Error: Shows validation reason
- Remove button to clear coupon

**Flow:**
1. User enters code
2. Client validates via server action
3. If valid: discount applied to total
4. On order submit: coupon persisted
5. After order created: usage incremented

**Persistence:**
- `orders.coupon_code` - Applied coupon code
- `orders.discount_amount` - Discount value
- `coupons.uses_count` - Incremented atomically

### **5. POS Integration**

**Same as checkout:**
- Coupon input in POS interface
- Validation and application
- Discount reflected in totals
- Persisted in order

---

## 🗄️ DATABASE SCHEMA

### **Coupons Table**

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  code TEXT NOT NULL,
  type coupon_type NOT NULL, -- 'percent' | 'fixed'
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count INTEGER DEFAULT 0 CHECK (uses_count >= 0),
  min_order_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_coupon_per_store UNIQUE (store_id, code)
);
```

### **Orders Table Updates**

```sql
ALTER TABLE orders 
  ADD COLUMN coupon_code TEXT,
  ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;
```

### **Indexes**

```sql
CREATE INDEX idx_coupons_store_id ON coupons(store_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
```

---

## 🔒 SECURITY

### **RLS Policies**

**View Policy:**
```sql
-- Users can view coupons from their stores
CREATE POLICY "Users can view coupons from their stores"
  ON coupons FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM store_users WHERE user_id = auth.uid()
    )
  );
```

**Manage Policy:**
```sql
-- Owners and managers can manage coupons
CREATE POLICY "Store members can manage coupons"
  ON coupons FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
```

### **Server-Side Validation**

**SQL Function:**
```sql
CREATE FUNCTION validate_coupon(
  p_store_id UUID,
  p_code TEXT,
  p_subtotal NUMERIC
) RETURNS JSON
```

**Checks:**
1. Coupon exists for store
2. Is active
3. Within date range
4. Has uses remaining
5. Meets minimum order amount
6. Calculates discount

**Returns:**
```json
{
  "valid": true,
  "discount_amount": 10.50,
  "coupon_code": "DESCONTO10",
  "coupon_type": "percent",
  "coupon_value": 10
}
```

---

## 🔧 IMPLEMENTATION

### **Server Actions**

**File:** `src/lib/coupons/actions.ts`

**Functions:**
- `validateCoupon(storeId, code, subtotal)` - Validates and calculates discount
- `getCoupons(storeId)` - Lists all coupons
- `createCoupon(coupon)` - Creates new coupon
- `updateCoupon(id, updates)` - Updates coupon
- `deleteCoupon(id)` - Deletes coupon
- `toggleCouponStatus(id, isActive)` - Activates/deactivates
- `incrementCouponUsage(storeId, code)` - Increments counter atomically

**Helpers:**
- `formatCouponValue(type, value)` - Display formatting
- `isCouponDateValid(coupon)` - Date range check
- `hasUsesRemaining(coupon)` - Usage limit check

### **Components**

**Dashboard:**
- `src/app/[slug]/dashboard/coupons/page.tsx` - CRUD interface

**Checkout:**
- `src/app/[slug]/checkout/components/CouponSection.tsx` - Coupon input
- `src/app/[slug]/checkout/components/OrderSummary.tsx` - Shows discount

**POS:**
- Integrated in POS interface (similar to checkout)

---

## 📊 USAGE EXAMPLES

### **Creating a Coupon**

**10% Off:**
```
Code: DESCONTO10
Type: Percentage
Value: 10
Active: Yes
Min Order: R$ 50.00
Max Uses: 100
```

**R$ 20 Off:**
```
Code: VINTE20
Type: Fixed
Value: 20.00
Active: Yes
Starts: 2025-12-01
Ends: 2025-12-31
```

### **Applying in Checkout**

1. User adds items to cart (subtotal R$ 100.00)
2. User enters code "DESCONTO10"
3. System validates:
   - Coupon exists ✓
   - Is active ✓
   - Within dates ✓
   - Has uses remaining ✓
   - Meets minimum (R$ 50.00) ✓
4. Discount calculated: R$ 10.00
5. New total: R$ 90.00 (+ delivery if applicable)
6. Order created with:
   - `coupon_code = "DESCONTO10"`
   - `discount_amount = 10.00`
7. Usage incremented: `uses_count += 1`

---

## ⚠️ KNOWN LIMITATIONS

### **1. Timezone Issues**

**Current:**
- All dates in UTC
- "Today" may not match store timezone

**Impact:**
- Coupon may expire/start at wrong local time

**Future:**
- Add timezone support per store
- Use store's local time for validation

### **2. No Per-Customer Limits**

**Current:**
- Only global `max_uses`
- Same customer can use multiple times

**Future:**
- Add `max_uses_per_customer`
- Track usage by customer_id/email

### **3. No Coupon Stacking**

**Current:**
- Only one coupon per order

**Future:**
- Allow multiple coupons
- Define stacking rules

### **4. No Product-Specific Coupons**

**Current:**
- Applies to entire order

**Future:**
- Add `applicable_products` or `applicable_categories`
- Selective discounts

### **5. No Automatic Coupons**

**Current:**
- User must enter code manually

**Future:**
- Auto-apply based on rules
- Loyalty program integration

---

## 🧪 TESTING CHECKLIST

### **Dashboard CRUD:**

- [ ] Create coupon with percentage (1-100)
- [ ] Create coupon with fixed amount
- [ ] Edit coupon details
- [ ] Toggle active/inactive
- [ ] Delete coupon
- [ ] View coupon list with correct status badges
- [ ] Validation errors show correctly

### **Checkout Integration:**

- [ ] Apply valid coupon → discount shows
- [ ] Apply invalid code → error message
- [ ] Apply expired coupon → error message
- [ ] Apply exhausted coupon (max_uses reached) → error
- [ ] Order below min_order_amount → error
- [ ] Remove applied coupon → discount cleared
- [ ] Submit order with coupon → persisted correctly
- [ ] Usage count increments after order

### **Multi-Store Isolation:**

- [ ] Create coupon in Store A
- [ ] Try to use in Store B → not found
- [ ] Coupon codes unique per store (can duplicate across stores)

### **Edge Cases:**

- [ ] Discount > subtotal → capped at subtotal
- [ ] Concurrent usage near max_uses → atomic increment
- [ ] Special characters in code → validation error
- [ ] Lowercase code entry → matches uppercase in DB

---

## 💡 USAGE TIPS

### **For Store Owners:**

**Effective Coupons:**
- Use memorable codes (NATAL2025, PRIMEIRACOMPRA)
- Set reasonable minimums to increase order value
- Limit uses to create urgency
- Track performance via reports

**Common Strategies:**
- First-time customer: 10-15% off
- Seasonal: 20% off specific period
- Minimum order boost: R$ 10 off orders > R$ 50
- Loyalty: 5% off for returning customers

### **For Developers:**

**Adding New Validation:**
1. Update `validate_coupon` SQL function
2. Update `validateCoupon` server action
3. Add UI feedback in CouponSection
4. Update tests

**Performance:**
- Coupons table indexed by store_id and code
- Validation is single SQL function call
- Usage increment is atomic (no race conditions)

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 2 - Advanced Features:**

- [ ] Per-customer usage limits
- [ ] Coupon stacking rules
- [ ] Product/category-specific coupons
- [ ] Auto-apply coupons
- [ ] Referral coupons (share with friends)

### **Phase 3 - Analytics:**

- [ ] Coupon performance dashboard
- [ ] Revenue impact tracking
- [ ] Most popular coupons
- [ ] Conversion rate by coupon

### **Phase 4 - Automation:**

- [ ] Scheduled coupons (auto-activate/deactivate)
- [ ] Dynamic discounts based on cart value
- [ ] Loyalty program integration
- [ ] Birthday/anniversary coupons

---

## 📚 RELATED DOCS

- [Security Setup](./SECURITY_SETUP.md) - RLS policies
- [Store Reports](./STORE_REPORTS.md) - Track coupon impact
- [Team Management](./TEAM_MANAGEMENT.md) - Role permissions

---

## 🔧 MAINTENANCE

### **Common Tasks:**

**Reset Usage Count:**
```sql
UPDATE coupons 
SET uses_count = 0 
WHERE code = 'DESCONTO10' AND store_id = '...';
```

**Extend Expiration:**
```sql
UPDATE coupons 
SET ends_at = '2025-12-31 23:59:59+00' 
WHERE code = 'NATAL2025' AND store_id = '...';
```

**Bulk Deactivate:**
```sql
UPDATE coupons 
SET is_active = false 
WHERE ends_at < NOW();
```

### **Monitoring:**

**Active Coupons:**
```sql
SELECT code, uses_count, max_uses
FROM coupons
WHERE store_id = '...' AND is_active = true
ORDER BY uses_count DESC;
```

**Popular Coupons:**
```sql
SELECT c.code, COUNT(o.id) as order_count, SUM(o.discount_amount) as total_discount
FROM coupons c
LEFT JOIN orders o ON o.coupon_code = c.code AND o.store_id = c.store_id
WHERE c.store_id = '...'
GROUP BY c.code
ORDER BY order_count DESC;
```

---

**Coupons module is fully operational!** 🎫

For questions or improvements, refer to the limitations section and future enhancements roadmap.
