# 📊 Store Reports Module

**Status:** ✅ IMPLEMENTED  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

Comprehensive reports module for store owners and managers to analyze sales performance, track top products, and export data.

**Route:** `/[slug]/dashboard/reports`

**Access:** Owner and Manager (Staff optional read-only)

---

## 🎯 METRICS IMPLEMENTED

### **1. Sales KPIs**

**Total Orders:**
- Count of all orders in selected period
- Excludes cancelled orders

**Total Revenue:**
- Sum of `orders.total_amount`
- Excludes cancelled orders

**Average Ticket:**
- Revenue / Orders
- Shows average order value

**Payment Status:**
- Paid count
- Pending count

### **2. Payment Method Breakdown**

**Metrics per method:**
- Order count
- Total revenue
- Percentage of total

**Methods tracked:**
- PIX
- Cash (Dinheiro)
- Card (Cartão)
- Card on Delivery

### **3. Top Products**

**Ranking by revenue:**
- Product name
- Quantity sold
- Total revenue
- Number of orders

**Configurable:**
- Top 5, 10, or 20 products
- Sorted by revenue (not quantity)

### **4. Peak Hours**

**24-hour analysis:**
- Orders per hour
- Revenue per hour
- Average ticket per hour

**Top 5 busiest hours:**
- Visual cards showing peak times
- Helps with staffing decisions

---

## 🔧 IMPLEMENTATION

### **Architecture:**

**Client Component:**
- Page: `src/app/[slug]/dashboard/reports/page.tsx`
- Uses client-side state and effects
- Fetches data directly from Supabase

**Helper Queries:**
- File: `src/lib/reports/queries.ts`
- Server-side query functions
- Aggregation helpers
- CSV generation utilities

### **Data Flow:**

```
1. User selects period filter
2. Client fetches orders from Supabase
3. Client aggregates data in-memory
4. Renders KPI cards and tables
5. Export CSV generates file client-side
```

---

## 🎨 UI FEATURES

### **Period Filters:**

**Presets:**
- Today
- Last 7 days
- Last 30 days
- Custom range (date picker)

**Behavior:**
- Instant update on selection
- Custom range with start/end dates

### **KPI Cards:**

**4 gradient cards:**
1. Total Orders (blue)
2. Total Revenue (green)
3. Average Ticket (purple)
4. Payment Status (yellow)

### **Payment Breakdown Table:**

**Columns:**
- Method name
- Quantity
- Total revenue
- % of total

**Features:**
- Totals row
- Color-coded values
- Percentage calculation

### **Top Products Table:**

**Columns:**
- Rank (#1, #2, etc.)
- Product name
- Quantity sold
- Revenue
- Number of orders

**Features:**
- Configurable limit (5/10/20)
- Sorted by revenue
- Empty state message

### **Peak Hours:**

**Top 5 cards:**
- Hour (0-23)
- Order count
- Revenue

**Full 24h table:**
- All hours listed
- Orders, revenue, avg ticket
- Sorted by order count

### **Export CSV:**

**Button location:**
- Top right of header
- Only visible when data exists

**CSV contents:**
- Report header with period
- Main metrics
- Payment breakdown
- Top products

**Download:**
- Client-side generation
- Filename: `relatorio_vendas_[timestamp].csv`
- UTF-8 encoding

---

## 📊 DATA SOURCES

### **Tables Used:**

**orders:**
- `id`, `total_amount`, `payment_method`
- `payment_status`, `status`, `created_at`
- `store_id` (for filtering)

**order_items:**
- `quantity`, `unit_price`
- `product_id`, `order_id`

**products:**
- `id`, `name`

### **Queries:**

**Main orders query:**
```sql
SELECT * FROM orders
WHERE store_id = $1
  AND status != 'cancelled'
  AND created_at >= $2
  AND created_at <= $3
```

**Order items with products:**
```sql
SELECT oi.*, p.name
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id IN ($orderIds)
```

---

## ⚠️ KNOWN LIMITATIONS

### **1. Client-Side Aggregation**

**Current:**
- All orders loaded to client
- Aggregation in JavaScript

**Problem:**
- Slow with large datasets (1000+ orders)
- High memory usage

**Future:**
- Use Postgres aggregation
- Server-side queries
- Pagination

### **2. Timezone Issues**

**Current:**
- Dates in UTC
- "Today" may not match store timezone

**Future:**
- Add timezone support per store
- Use store's local time

### **3. No Caching**

**Current:**
- Fresh query on every filter change

**Future:**
- Cache results for common periods
- Invalidate on new orders

### **4. Limited Export Format**

**Current:**
- CSV only
- Basic formatting

**Future:**
- PDF reports
- Excel format
- Charts in export

### **5. No Scheduled Reports**

**Current:**
- Manual export only

**Future:**
- Email reports daily/weekly
- Automated delivery

---

## 🔒 SECURITY

### **Access Control:**

**RLS Policies:**
- Orders filtered by `store_id`
- User must be store member

**Role Permissions:**
- Owner: Full access
- Manager: Full access
- Staff: Read-only (optional)

**Data Privacy:**
- Store-scoped queries
- No cross-store data leakage

---

## 🧪 TESTING CHECKLIST

### **Functional Tests:**

- [ ] Create orders in two different stores
- [ ] Verify reports show only current store data
- [ ] Change period selector and verify numbers change
- [ ] Top products matches order_items quantities
- [ ] Payment breakdown totals match revenue
- [ ] Peak hours show correct time distribution
- [ ] CSV exports with correct headers and rows
- [ ] Custom date range works correctly

### **Edge Cases:**

- [ ] No orders in period (empty state)
- [ ] Single order (calculations work)
- [ ] All orders same payment method
- [ ] Orders at midnight (timezone handling)
- [ ] Very long product names (table overflow)

### **Performance:**

- [ ] Test with 100 orders (should be fast)
- [ ] Test with 1000 orders (may be slow)
- [ ] Test with 10000 orders (likely timeout)

---

## 📝 USAGE

### **Access Reports:**

1. Login as owner or manager
2. Navigate to `/[slug]/dashboard/reports`
3. View default metrics (Today)

### **Change Period:**

1. Click period button (7 days, 30 days, etc.)
2. Or select "Custom" and pick dates
3. Metrics update automatically

### **Export Data:**

1. Ensure data is loaded
2. Click "Exportar CSV" button
3. File downloads automatically
4. Open in Excel or Google Sheets

### **Analyze Top Products:**

1. Scroll to "Produtos Mais Vendidos"
2. Change top N selector (5/10/20)
3. Review ranking and revenue
4. Identify best sellers

### **Find Peak Hours:**

1. Scroll to "Horários de Pico"
2. View top 5 busiest hours
3. Review full 24h breakdown
4. Plan staffing accordingly

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 2 - Advanced Analytics:**

- [ ] Revenue trends (line chart)
- [ ] Order status distribution (pie chart)
- [ ] Customer retention metrics
- [ ] Product category breakdown
- [ ] Delivery performance metrics

### **Phase 3 - Comparisons:**

- [ ] Period-over-period comparison
- [ ] Year-over-year growth
- [ ] Store benchmarking (multi-store)
- [ ] Goal tracking

### **Phase 4 - Automation:**

- [ ] Scheduled email reports
- [ ] Slack/WhatsApp notifications
- [ ] Low stock alerts
- [ ] Performance alerts

### **Phase 5 - Visualization:**

- [ ] Chart library integration (Recharts)
- [ ] Interactive dashboards
- [ ] Drill-down capabilities
- [ ] Real-time updates

---

## 🔧 MAINTENANCE

### **Adding New Metrics:**

1. Update query in `queries.ts`
2. Add state in `page.tsx`
3. Update UI to display metric
4. Add to CSV export
5. Update this documentation

### **Optimizing Performance:**

**Database indexes:**
```sql
CREATE INDEX idx_orders_store_created 
ON orders(store_id, created_at);

CREATE INDEX idx_orders_status 
ON orders(status);

CREATE INDEX idx_order_items_order 
ON order_items(order_id);
```

**Server-side aggregation:**
```sql
-- Example: Daily revenue
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders,
  SUM(total_amount) as revenue
FROM orders
WHERE store_id = $1
  AND created_at >= $2
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## 📚 RELATED DOCS

- [Super Admin Analytics](./SUPERADMIN_ANALYTICS.md) - Platform-wide analytics
- [Security Setup](./SECURITY_SETUP.md) - Access control
- [Team Management](./TEAM_MANAGEMENT.md) - Role permissions

---

## 💡 TIPS

### **For Store Owners:**

- Check reports daily to track performance
- Use peak hours to optimize staffing
- Monitor top products for inventory
- Export monthly for accounting

### **For Developers:**

- Keep queries store-scoped (RLS)
- Aggregate on server when possible
- Cache common queries
- Add indexes for performance

---

**Store Reports module is fully operational!** 🚀

For questions or improvements, refer to the limitations section and future enhancements roadmap.
