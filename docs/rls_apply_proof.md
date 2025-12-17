# 🔐 RLS Apply Proof - Evidência de Aplicação

**Data:** _____________  
**Método:** [ ] CLI (`supabase db push`) | [ ] Manual (SQL Editor)  
**Executor:** _____________

---

## 📋 Checklist de Aplicação

- [ ] Backup realizado (opcional mas recomendado)
- [ ] Migrations identificadas
- [ ] SQL executado no Supabase
- [ ] Queries de validação executadas
- [ ] Resultados documentados abaixo

---

## 📁 Migrations Aplicadas

| Arquivo | Linhas | Status |
|---------|--------|--------|
| `20251217_fix_kitchen_chefs_rls.sql` | 12 | [ ] Aplicada |
| `20251217_02_rls_core_fix.sql` | 901 | [ ] Aplicada |

**OU**

| Arquivo Consolidado | Status |
|---------------------|--------|
| `docs/supabase_apply_rls.sql` | [ ] Aplicada |

---

## 🖥️ Output da Execução

### Opção A: CLI Output

```
# Cole aqui o output de: supabase db push
```

### Opção B: SQL Editor Output

```
# Cole aqui a mensagem de sucesso do SQL Editor
# Exemplo: "Success. No rows returned" ou similar
```

---

## ✅ Queries de Validação

### Query 1: Policies com USING(true) restantes

```sql
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND (qual='true' OR with_check='true')
ORDER BY tablename, policyname;
```

**Resultado Esperado:** 0 linhas (ou apenas `reservations_public_insert` se existir)

**Resultado Obtido:**

```
# Cole aqui o resultado da query
```

| # Linhas | Status |
|----------|--------|
| ___ | [ ] ✅ OK | [ ] ❌ Falhou |

---

### Query 2: RLS habilitado nas tabelas core

```sql
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN (
    'orders', 'order_items', 'products', 'categories', 
    'customers', 'store_settings', 'coupons', 'kitchen_chefs'
  )
ORDER BY c.relname;
```

**Resultado Esperado:** Todas com `rls_enabled = true`

**Resultado Obtido:**

```
# Cole aqui o resultado da query
```

| Tabela | RLS Enabled | Status |
|--------|-------------|--------|
| orders | | [ ] ✅ |
| order_items | | [ ] ✅ |
| products | | [ ] ✅ |
| categories | | [ ] ✅ |
| customers | | [ ] ✅ |
| store_settings | | [ ] ✅ |
| coupons | | [ ] ✅ |
| kitchen_chefs | | [ ] ✅ |

---

## 🔍 Verificação Adicional (Opcional)

### Query 3: Listar todas as policies das tabelas corrigidas

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('kitchen_chefs', 'store_waiters', 'notifications', 'customization_groups')
ORDER BY tablename, policyname;
```

**Resultado:**

```
# Cole aqui
```

---

## 📊 Resumo Final

| Métrica | Valor |
|---------|-------|
| Migrations aplicadas | __ / 2 |
| Tabelas com RLS corrigido | __ / 25 |
| Policies USING(true) restantes | __ |
| Erros encontrados | __ |

### Status Final

- [ ] ✅ **SUCESSO** - Todas as migrations aplicadas sem erro
- [ ] ⚠️ **PARCIAL** - Algumas falhas (documentar abaixo)
- [ ] ❌ **FALHOU** - Rollback necessário

### Notas/Erros

```
# Documentar qualquer erro ou observação aqui
```

---

## 🔄 Próximos Passos

1. [ ] Executar smoke test (COMANDO 8)
2. [ ] Testar fluxo público (cardápio)
3. [ ] Testar fluxo dashboard (login + listagens)
4. [ ] Testar fluxo cozinha (KDS)
5. [ ] Atualizar `docs/rls_baseline.md` com estado final

---

*Template gerado automaticamente para documentação de aplicação RLS.*
