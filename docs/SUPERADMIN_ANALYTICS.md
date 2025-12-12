# 📊 Super Admin Analytics - MVP

**Status:** ✅ IMPLEMENTED  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

Analytics dashboard for SaaS owner to monitor platform adoption and activity.

**Route:** `/admin/analytics`

**Access:** Super Admin only (protected by middleware)

---

## 🎯 METRICS IMPLEMENTED

### **1. Active Stores**
- **Definition:** Stores with at least 1 order in the selected period
- **Calculation:** Count unique `store_id` from orders in date range
- **Display:** KPI card

### **2. Orders**
- **Orders Today:** Count of orders created today (UTC)
- **Orders in Range:** Count of orders in selected period (7/14/30 days)
- **Display:** KPI cards

### **3. GMV (Gross Merchandise Value)**
- **Definition:** Sum of `orders.total_amount`
- **GMV Today:** Sum for today
- **GMV in Range:** Sum for selected period
- **Display:** KPI cards with currency formatting (BRL)

### **4. Top Stores**
- **Ranking:** Top 10 stores by GMV in selected period
- **Columns:**
  - Rank (#)
  - Store name + slug
  - Tenant name
  - Orders count
  - GMV (total_amount sum)
  - Actions (links to menu and dashboard)
- **Sorting:** By GMV descending
- **Display:** Table

### **5. Daily Trend**
- **Period:** Last 7/14/30 days (based on filter)
- **Columns:**
  - Date (DD/MM format)
  - Orders count
  - GMV
  - Average ticket (GMV / orders)
- **Display:** Table

---

## 🔧 IMPLEMENTATION

### **Architecture:**

**Server Component:**
- Page: `src/app/(super-admin)/admin/analytics/page.tsx`
- Helper functions: `src/lib/superadmin/analytics.ts`

**Data Flow:**
```
1. User selects date range (7/14/30 days)
2. Server Component fetches data via helper functions
3. Helper functions query Supabase with server client
4. Data aggregated in memory (no DB aggregation yet)
5. Rendered as Server Component (no client-side JS)
```

### **Helper Functions:**

**`getAnalyticsMetrics(days)`**
- Returns: `{ activeStores, ordersToday, ordersInRange, gmvToday, gmvInRange }`
- Queries: orders table filtered by date range

**`getTopStores(days, limit)`**
- Returns: Array of `{ store_id, store_name, store_slug, tenant_name, orders_count, gmv }`
- Queries: orders with JOIN to stores and tenants
- Aggregation: In-memory Map grouping by store_id

**`getDailyTrend(days)`**
- Returns: Array of `{ date, orders_count, gmv }`
- Queries: All orders in range
- Aggregation: In-memory Map grouping by date (YYYY-MM-DD)
- Fills missing days with zeros

**`getAllTenants()`**
- Returns: Array of tenants for filter (future use)

**`getAnalyticsByTenant(tenantId, days)`**
- Returns: Same as getAnalyticsMetrics but filtered by tenant
- Future use for tenant-specific analytics

---

## 🎨 UI FEATURES

### **Date Range Selector:**
- Buttons: 7 days | 14 days | 30 days
- Default: 7 days
- Updates via query params: `?days=7`

### **KPI Cards:**
- 5 cards in responsive grid
- Color-coded icons
- Value + label + subtext

### **Top Stores Table:**
- Responsive table
- Links to:
  - Public menu: `/{slug}` (new tab)
  - Store dashboard: `/{slug}/dashboard` (new tab)
- Empty state message

### **Daily Trend Table:**
- Date formatted as DD/MM
- GMV formatted as BRL currency
- Average ticket calculated on-the-fly

### **Limitations Note:**
- Yellow alert box
- Lists known limitations

---

## ⚠️ KNOWN LIMITATIONS

### **1. Timezone Issues**
- **Problem:** All dates in UTC, not tenant/store timezone
- **Impact:** "Today" may not match store's local time
- **Future:** Add timezone support per tenant/store

### **2. GMV vs MRR**
- **Current:** GMV = sum of orders.total_amount (store activity)
- **Not:** SaaS MRR (monthly recurring revenue)
- **Future:** Integrate billing (Stripe/MercadoPago) for real MRR

### **3. No Billing Integration**
- **Current:** No subscription data
- **Missing:** MRR, ARR, Churn Rate, LTV
- **Future:** Add billing provider integration

### **4. Performance**
- **Current:** In-memory aggregation (all orders loaded)
- **Problem:** Slow with large datasets
- **Future:** Use Postgres aggregation queries:
  ```sql
  SELECT 
    date_trunc('day', created_at) as date,
    COUNT(*) as orders_count,
    SUM(total_amount) as gmv
  FROM orders
  WHERE created_at >= $1
  GROUP BY date_trunc('day', created_at)
  ORDER BY date
  ```

### **5. No Caching**
- **Current:** Fresh query on every page load
- **Future:** Add Redis caching or materialized views

---

## 🔒 SECURITY

### **Access Control:**
- Protected by `/admin` middleware
- Requires super admin email in `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`
- Server-side queries only (no client exposure)

### **Data Privacy:**
- Aggregated data only (no PII exposed)
- Store-level metrics (not customer-level)

---

## 📊 DATA SOURCES

### **Tables Used:**
- `orders` - Main data source
- `stores` - Store names and slugs
- `tenants` - Tenant names
- `deliveries` - (not used yet, future)

### **Queries:**
```typescript
// Active stores
SELECT DISTINCT store_id FROM orders WHERE created_at >= $1

// Orders count
SELECT COUNT(*) FROM orders WHERE created_at >= $1

// GMV
SELECT SUM(total_amount) FROM orders WHERE created_at >= $1

// Top stores
SELECT 
  store_id,
  COUNT(*) as orders_count,
  SUM(total_amount) as gmv
FROM orders
WHERE created_at >= $1
GROUP BY store_id
ORDER BY gmv DESC
LIMIT 10
```

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 2 - Billing Integration:**
- [ ] Integrate Stripe/MercadoPago
- [ ] Track MRR (Monthly Recurring Revenue)
- [ ] Track ARR (Annual Recurring Revenue)
- [ ] Calculate Churn Rate
- [ ] Calculate LTV (Lifetime Value)

### **Phase 3 - Advanced Analytics:**
- [ ] Cohort analysis
- [ ] Retention curves
- [ ] Revenue by plan tier
- [ ] Geographic distribution
- [ ] Industry/niche performance

### **Phase 4 - Performance:**
- [ ] Database aggregation queries
- [ ] Materialized views
- [ ] Redis caching
- [ ] Background jobs for heavy queries

### **Phase 5 - Visualization:**
- [ ] Chart library integration (Recharts/Chart.js)
- [ ] Line charts for trends
- [ ] Bar charts for comparisons
- [ ] Pie charts for distribution

---

## 🧪 TESTING

### **Manual Testing:**
1. Access `/admin/analytics` as super admin
2. Verify KPI cards show correct numbers
3. Switch date ranges (7/14/30 days)
4. Verify Top Stores table
5. Click store links (menu + dashboard)
6. Verify Daily Trend table
7. Check empty states (no data)

### **Data Validation:**
```sql
-- Verify orders count
SELECT COUNT(*) FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Verify GMV
SELECT SUM(total_amount) FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Verify active stores
SELECT COUNT(DISTINCT store_id) FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

---

## 📝 USAGE

### **Access:**
1. Login as super admin
2. Navigate to `/admin/analytics`
3. View metrics and trends

### **Date Range:**
- Click "7 dias", "14 dias", or "30 dias"
- Page reloads with new data

### **Store Links:**
- Click "Menu" to view public store
- Click "Dashboard" to access store admin

---

## 🔧 MAINTENANCE

### **Adding New Metrics:**
1. Add function to `src/lib/superadmin/analytics.ts`
2. Update page to call new function
3. Add UI component to display metric
4. Update this documentation

### **Optimizing Queries:**
1. Add database indexes:
   ```sql
   CREATE INDEX idx_orders_created_at ON orders(created_at);
   CREATE INDEX idx_orders_store_id ON orders(store_id);
   ```
2. Use Postgres aggregation instead of in-memory
3. Add caching layer

---

## 📚 RELATED DOCS

- [Security Setup](./SECURITY_SETUP.md) - Super admin access
- [Team Management](./TEAM_MANAGEMENT.md) - Store-level analytics

---

**Analytics MVP is operational!** 🚀

For questions or improvements, refer to the limitations section and future enhancements roadmap.
