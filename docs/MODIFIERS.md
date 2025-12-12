# 🔧 Product Modifiers System - MVP

**Status:** ✅ IMPLEMENTED (Core)  
**Date:** 2025-12-12

---

## 📋 OVERVIEW

Complete modifier system for products (sizes, add-ons, extras, etc). Allows store owners to create reusable modifier groups and attach them to products. Works in both public menu and POS.

**Routes:**
- Dashboard: `/[slug]/dashboard/modifiers` (CRUD)
- Product Edit: Modifier linking section
- Public Menu: Modifier selection when adding to cart
- POS: Modifier modal before adding product

**Access:** Owner and Manager (Staff read-only optional)

---

## 🎯 FEATURES

### **1. Modifier Groups**

**Single Selection (Radio):**
- Example: Tamanho (Size)
- User must choose exactly 1 option
- Options: P, M, G

**Multiple Selection (Checkbox):**
- Example: Adicionais (Add-ons)
- User can choose multiple options
- Optional min/max limits

**Configuration:**
- Name (e.g., "Tamanho", "Adicionais")
- Selection type: single or multiple
- Required: Yes/No
- Min select: minimum options (for multiple)
- Max select: maximum options (for multiple)
- Sort order: display order

### **2. Modifier Options**

**Per Group:**
- Name (e.g., "Pequeno", "Bacon Extra")
- Price delta: +R$ X or -R$ X or R$ 0
- Active/Inactive toggle
- Sort order

**Examples:**
```
Group: Tamanho (single, required)
├─ P (Pequeno) +R$ 0.00
├─ M (Médio) +R$ 3.00
└─ G (Grande) +R$ 5.00

Group: Adicionais (multiple, min=0, max=3)
├─ Bacon +R$ 5.00
├─ Queijo Extra +R$ 3.00
├─ Cebola Caramelizada +R$ 2.00
└─ Molho Especial +R$ 1.50
```

### **3. Product Linking**

**Attach Groups to Products:**
- Select which modifier groups apply to each product
- Set display order
- Groups are reusable across products

**Example:**
```
Product: X-Burger
├─ Tamanho (required)
├─ Ponto da Carne (optional)
└─ Adicionais (optional)
```

### **4. Selection Flow**

**Public Menu:**
1. User clicks product
2. Modal/page shows modifiers
3. User selects options (validated)
4. Price updates in real-time
5. Add to cart with selections

**POS:**
1. Staff clicks product
2. Modal shows modifiers
3. Staff selects for customer
4. Price calculated
5. Add to cart

**Validation:**
- Required groups must have selection
- Single: exactly 1 option
- Multiple: respect min/max limits
- Cannot add to cart if invalid

### **5. Price Calculation**

**Formula:**
```
Item Total = (Base Price + Sum of Price Deltas) × Quantity
```

**Example:**
```
X-Burger Base: R$ 25.00
+ Tamanho G: +R$ 5.00
+ Bacon: +R$ 5.00
+ Queijo Extra: +R$ 3.00
= R$ 38.00 per item

Quantity: 2
Total: R$ 76.00
```

### **6. Order Persistence**

**order_items.modifiers (JSONB):**
```json
[
  {
    "group_id": "uuid",
    "group_name": "Tamanho",
    "option_id": "uuid",
    "option_name": "Grande",
    "price_delta": 5.00
  },
  {
    "group_id": "uuid",
    "group_name": "Adicionais",
    "option_id": "uuid",
    "option_name": "Bacon",
    "price_delta": 5.00
  }
]
```

**order_items.unit_price:**
- Includes base price + modifiers
- Historic price preserved

---

## 🗄️ DATABASE SCHEMA

### **modifier_groups**

```sql
CREATE TABLE modifier_groups (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  selection_type modifier_selection_type NOT NULL, -- 'single' | 'multiple'
  is_required BOOLEAN DEFAULT false,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **modifier_options**

```sql
CREATE TABLE modifier_options (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **product_modifier_groups**

```sql
CREATE TABLE product_modifier_groups (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, group_id)
);
```

### **order_items.modifiers**

```sql
ALTER TABLE order_items 
  ADD COLUMN modifiers JSONB DEFAULT '[]'::jsonb;
```

---

## 🔒 SECURITY

### **RLS Policies**

**modifier_groups:**
```sql
-- View: user has access to store
-- Manage: owner/manager only
```

**modifier_options:**
```sql
-- View: via group's store
-- Manage: owner/manager only
```

**product_modifier_groups:**
```sql
-- View: via product's store
-- Manage: owner/manager only
```

**Validation:**
- All queries store-scoped
- Server-side validation before adding to cart
- Price calculation server-side

---

## 🔧 IMPLEMENTATION

### **Server Actions**

**File:** `src/lib/modifiers/actions.ts`

**Groups:**
- `getModifierGroups(storeId)` - List all groups with options
- `createModifierGroup(group)` - Create new group
- `updateModifierGroup(id, updates)` - Update group
- `deleteModifierGroup(id)` - Delete group (cascades options)

**Options:**
- `getModifierOptions(groupId)` - List options
- `createModifierOption(option)` - Create option
- `updateModifierOption(id, updates)` - Update option
- `deleteModifierOption(id)` - Delete option
- `toggleModifierOption(id, isActive)` - Toggle active

**Product Links:**
- `getProductModifierGroups(productId)` - Get groups for product
- `linkModifierGroupToProduct(productId, groupId, sortOrder)` - Attach
- `unlinkModifierGroupFromProduct(productId, groupId)` - Detach
- `updateProductModifierGroupOrder(productId, groupId, sortOrder)` - Reorder

**Validation:**
- `validateModifierSelection(group, selectedOptions)` - Validate rules
- `calculateModifiersPrice(selectedModifiers)` - Sum price deltas
- `formatModifierPrice(priceDelta)` - Display formatting

### **SQL Function**

**get_product_modifiers(product_id):**
- Returns groups with options as JSON
- Only active options
- Ordered by sort_order
- Used by public menu and POS

---

## 📊 USAGE EXAMPLES

### **Creating Modifiers**

**1. Create Group "Tamanho":**
```
Name: Tamanho
Type: Single
Required: Yes
Min: 1
Max: 1
```

**2. Add Options:**
```
P (Pequeno): +R$ 0.00
M (Médio): +R$ 3.00
G (Grande): +R$ 5.00
```

**3. Create Group "Adicionais":**
```
Name: Adicionais
Type: Multiple
Required: No
Min: 0
Max: 3
```

**4. Add Options:**
```
Bacon: +R$ 5.00
Queijo Extra: +R$ 3.00
Cebola: +R$ 2.00
```

**5. Link to Product:**
```
Product: X-Burger
Attach: Tamanho (order 1)
Attach: Adicionais (order 2)
```

### **Customer Selection**

**Scenario 1: Valid**
```
Product: X-Burger (R$ 25.00)
Tamanho: G (+R$ 5.00) ✓
Adicionais: Bacon (+R$ 5.00), Queijo (+R$ 3.00) ✓
Total: R$ 38.00 ✓
```

**Scenario 2: Invalid (missing required)**
```
Product: X-Burger (R$ 25.00)
Tamanho: (not selected) ✗
Error: "Tamanho é obrigatório"
```

**Scenario 3: Invalid (too many)**
```
Product: X-Burger (R$ 25.00)
Tamanho: G ✓
Adicionais: Bacon, Queijo, Cebola, Molho (4 items) ✗
Error: "Selecione no máximo 3 opção(ões) em Adicionais"
```

---

## ⚠️ KNOWN LIMITATIONS

### **1. No Conditional Logic**

**Current:**
- All groups shown to all customers
- No "if size=G then show premium toppings"

**Future:**
- Conditional display rules
- Group dependencies

### **2. No Quantity per Option**

**Current:**
- Checkbox = selected or not
- Cannot select "2x Bacon"

**Future:**
- Quantity selector per option
- "How many extra bacon?"

### **3. No Option Groups**

**Current:**
- Flat list of options per group

**Future:**
- Sub-groups (e.g., "Queijos" within "Adicionais")
- Nested modifiers

### **4. No Default Selections**

**Current:**
- User must manually select

**Future:**
- Pre-select default option
- "Most popular" suggestions

### **5. No Modifier Templates**

**Current:**
- Create groups from scratch

**Future:**
- Templates library (common modifiers)
- Clone from other products

---

## 🧪 TESTING CHECKLIST

### **Dashboard CRUD:**

- [ ] Create group "Tamanho" (single, required)
- [ ] Add options P/M/G with price deltas
- [ ] Create group "Adicionais" (multiple, max=3)
- [ ] Add options with various prices
- [ ] Edit group settings
- [ ] Toggle option active/inactive
- [ ] Delete option
- [ ] Delete group (cascades options)
- [ ] Sort order works

### **Product Linking:**

- [ ] Attach "Tamanho" to product
- [ ] Attach "Adicionais" to product
- [ ] Reorder groups
- [ ] Detach group
- [ ] Changes reflect in menu/POS

### **Public Menu:**

- [ ] Product with modifiers shows selection UI
- [ ] Required group prevents add without selection
- [ ] Single selection enforces 1 choice
- [ ] Multiple selection respects max
- [ ] Price updates in real-time
- [ ] Add to cart includes modifiers
- [ ] Cart displays modifiers correctly

### **POS:**

- [ ] Product with modifiers opens modal
- [ ] Validation same as public menu
- [ ] Staff can select for customer
- [ ] Price calculated correctly
- [ ] Order created with modifiers

### **Order Persistence:**

- [ ] order_items.modifiers contains snapshot
- [ ] order_items.unit_price includes modifiers
- [ ] Historic data preserved (even if modifier deleted)

### **Multi-Store Isolation:**

- [ ] Store A modifiers not visible in Store B
- [ ] Cannot link Store A group to Store B product
- [ ] RLS enforced

---

## 💡 USAGE TIPS

### **For Store Owners:**

**Effective Modifiers:**
- Keep groups simple and clear
- Use descriptive names ("Tamanho" not "Opções")
- Set reasonable price deltas
- Don't overwhelm with too many options

**Common Patterns:**
- Size: Single, Required (P/M/G)
- Protein: Single, Required (Chicken/Beef/Veggie)
- Add-ons: Multiple, Optional (extras)
- Removals: Multiple, Optional (no onions, etc)

**Pricing Strategy:**
- Base price = smallest/default option
- Larger sizes = positive delta
- Premium ingredients = positive delta
- Removals = zero or negative delta

### **For Developers:**

**Adding New Features:**
1. Update migration if schema changes
2. Update Server Actions
3. Update validation logic
4. Update UI components
5. Update docs

**Performance:**
- Modifiers cached with product data
- Validation client + server
- Price calculation memoized

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 2 - Advanced Features:**

- [ ] Conditional modifiers (if X then show Y)
- [ ] Quantity per option (2x Bacon)
- [ ] Option groups/categories
- [ ] Default selections
- [ ] Modifier templates library

### **Phase 3 - UX Improvements:**

- [ ] Visual previews (images per option)
- [ ] Popular combinations suggestions
- [ ] "Make it a combo" bundles
- [ ] Modifier search/filter

### **Phase 4 - Analytics:**

- [ ] Most popular modifiers
- [ ] Revenue by modifier
- [ ] Conversion impact
- [ ] A/B testing modifiers

---

## 📚 RELATED DOCS

- [Products](./PRODUCTS.md) - Product management
- [Orders](./ORDERS.md) - Order creation flow
- [POS](./POS.md) - Point of sale system

---

## 🔧 MAINTENANCE

### **Common Tasks:**

**Update Prices:**
```sql
UPDATE modifier_options 
SET price_delta = 6.00 
WHERE name = 'Grande' AND group_id IN (
  SELECT id FROM modifier_groups WHERE name = 'Tamanho'
);
```

**Deactivate Option:**
```sql
UPDATE modifier_options 
SET is_active = false 
WHERE name = 'Bacon' AND group_id = '...';
```

**Clone Group to Another Product:**
```sql
INSERT INTO product_modifier_groups (product_id, group_id, sort_order)
SELECT 'new_product_id', group_id, sort_order
FROM product_modifier_groups
WHERE product_id = 'source_product_id';
```

### **Monitoring:**

**Popular Modifiers:**
```sql
SELECT 
  mo.name,
  COUNT(*) as times_selected,
  SUM(mo.price_delta) as total_revenue
FROM order_items oi,
  jsonb_array_elements(oi.modifiers) as mod
JOIN modifier_options mo ON mo.id = (mod->>'option_id')::uuid
WHERE oi.created_at >= NOW() - INTERVAL '30 days'
GROUP BY mo.name
ORDER BY times_selected DESC
LIMIT 10;
```

**Revenue by Modifier Group:**
```sql
SELECT 
  mg.name as group_name,
  COUNT(*) as selections,
  SUM((mod->>'price_delta')::numeric) as total_revenue
FROM order_items oi,
  jsonb_array_elements(oi.modifiers) as mod
JOIN modifier_groups mg ON mg.id = (mod->>'group_id')::uuid
WHERE oi.created_at >= NOW() - INTERVAL '30 days'
GROUP BY mg.name
ORDER BY total_revenue DESC;
```

---

**Modifiers system is ready for implementation!** 🔧

This documentation provides the complete specification. Implementation requires:
1. ✅ Migration (done)
2. ✅ Server Actions (done)
3. ⏳ Dashboard CRUD UI
4. ⏳ Product linking UI
5. ⏳ Public menu integration
6. ⏳ POS integration

For questions or improvements, refer to the limitations section and future enhancements roadmap.
