# 📊 RLS Remainder Report - Correção de Tabelas Permissivas

**Data:** 17 de Dezembro de 2025  
**Migration:** `20251217_03_rls_remainder_fix.sql`

---

## 🎯 Objetivo

Zerar policies permissivas (`USING(true)` / `WITH CHECK(true)`) nas tabelas restantes.

---

## 📋 Tabelas Corrigidas

### 1. Tabelas com `store_id` Direto (15 tabelas)

| # | Tabela | Antes | Depois |
|---|--------|-------|--------|
| 1 | `store_settings` | RLS OFF | `user_has_store_access(store_id)` |
| 2 | `addon_groups` | `USING(true)` | `user_has_store_access(store_id)` |
| 3 | `cash_registers` | `USING(true)` | `user_has_store_access(store_id)` |
| 4 | `cash_movements` | `USING(true)` | `user_has_store_access(store_id)` |
| 5 | `cash_flow` | `USING(true)` | `user_has_store_access(store_id)` |
| 6 | `daily_summary` | `USING(true)` | `user_has_store_access(store_id)` |
| 7 | `expenses` | `USING(true)` | `user_has_store_access(store_id)` |
| 8 | `financial_categories` | `USING(true)` | `user_has_store_access(store_id)` |
| 9 | `receivables` | `USING(true)` | `user_has_store_access(store_id)` |
| 10 | `inventory_movements` | `USING(true)` | `user_has_store_access(store_id)` |
| 11 | `inventory_batches` | `USING(true)` | `user_has_store_access(store_id)` |
| 12 | `inventory_counts` | `USING(true)` | `user_has_store_access(store_id)` |
| 13 | `purchase_orders` | `USING(true)` | `user_has_store_access(store_id)` |
| 14 | `suppliers` | `USING(true)` | `user_has_store_access(store_id)` |
| 15 | `product_ingredients` | `USING(true)` | `user_has_store_access(store_id)` ou via products |

---

### 2. Tabelas com Join (5 tabelas)

| # | Tabela | Join Via | Policy |
|---|--------|----------|--------|
| 1 | `addons` | `addon_groups.store_id` | `EXISTS (... addon_groups ag WHERE ag.id = addons.addon_group_id ...)` |
| 2 | `product_addon_groups` | `addon_groups.store_id` | `EXISTS (... addon_groups ag WHERE ag.id = product_addon_groups.addon_group_id ...)` |
| 3 | `product_variations` | `products.store_id` | `EXISTS (... products p WHERE p.id = product_variations.product_id ...)` |
| 4 | `purchase_order_items` | `purchase_orders.store_id` | `EXISTS (... purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id ...)` |
| 5 | `inventory_count_items` | `inventory_counts.store_id` | `EXISTS (... inventory_counts ic WHERE ic.id = inventory_count_items.count_id ...)` |

---

### 3. Tabelas com INSERT Público (2 tabelas)

| Tabela | Justificativa | Restrição Aplicada |
|--------|---------------|-------------------|
| `reservations` | Clientes anônimos fazem reservas online | `WITH CHECK (stores.is_active = true)` |
| `coupon_uses` | Clientes usam cupons durante checkout | `WITH CHECK (coupons.is_active AND stores.is_active)` |

**Nota:** Ambas permitem INSERT público mas com validação de que a loja/cupom estão ativos.

---

## 🔐 Resumo das Políticas

### Padrão para Tabelas com `store_id`

```sql
CREATE POLICY "tabela_select" ON tabela FOR SELECT 
  USING (public.user_has_store_access(store_id));

CREATE POLICY "tabela_insert" ON tabela FOR INSERT 
  WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "tabela_update" ON tabela FOR UPDATE 
  USING (public.user_has_store_access(store_id))
  WITH CHECK (public.user_has_store_access(store_id));

CREATE POLICY "tabela_delete" ON tabela FOR DELETE 
  USING (public.user_has_store_access(store_id));
```

### Padrão para Tabelas com Join

```sql
CREATE POLICY "tabela_select" ON tabela FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tabela_pai tp 
      WHERE tp.id = tabela.fk_id 
        AND public.user_has_store_access(tp.store_id)
    )
  );
```

---

## ✅ Queries de Validação

### Query 1: Verificar policies permissivas restantes

```sql
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual='true' OR with_check='true')
ORDER BY tablename, policyname;
```

**Resultado Esperado:** 0 linhas

---

### Query 2: Verificar RLS em store_settings

```sql
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname = 'store_settings';
```

**Resultado Esperado:** `rls_enabled = true`

---

## 📁 Arquivos Gerados

| Arquivo | Propósito |
|---------|-----------|
| `supabase/migrations/20251217_03_rls_remainder_fix.sql` | Migration com correções |
| `docs/rls_remainder_report.md` | Este relatório |

---

## 🔄 Como Aplicar

1. Copie o conteúdo de `20251217_03_rls_remainder_fix.sql`
2. Cole no Supabase SQL Editor
3. Execute
4. Rode as queries de validação acima
5. Cole os resultados aqui

---

## 📊 Resultados da Validação

### Query 1 - Policies Permissivas

```
# Cole o resultado aqui
```

### Query 2 - RLS em store_settings

```
# Cole o resultado aqui
```

---

*Relatório gerado automaticamente durante correção de RLS.*
