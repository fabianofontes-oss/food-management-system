# Procedimento de Aplicação de Migrations no Supabase Cloud

## Ambientes

| Ambiente | Projeto Supabase | Uso |
|----------|------------------|-----|
| **Staging** | `food-staging` | Testes pré-produção |
| **Production** | `food-prod` | Produção |

> ⚠️ **IMPORTANTE:** Confirme os nomes dos projetos antes de aplicar.

---

## Método 1: Via Supabase CLI (Preferencial)

### 1.1 Configurar projeto remoto

```bash
# Listar projetos disponíveis
supabase projects list

# Linkar ao projeto staging
supabase link --project-ref <PROJECT_REF_STAGING>

# OU linkar ao projeto prod
supabase link --project-ref <PROJECT_REF_PROD>
```

### 1.2 Aplicar migrations

```bash
# Ver status das migrations
supabase db push --dry-run

# Aplicar migrations
supabase db push

# Verificar se aplicou
supabase migration list
```

---

## Método 2: Via SQL Editor (Manual)

### 2.1 Ordem de aplicação

Aplicar as migrations na ordem alfabética/cronológica:

1. `00000000_init_schema.sql`
2. `20241213000000_*.sql`
3. `20241213000001_*.sql`
4. ... (continuar em ordem)

### 2.2 Procedimento

1. Abrir **Supabase Dashboard** → **SQL Editor**
2. Copiar conteúdo de cada migration
3. Executar
4. Verificar se não há erros
5. Registrar na tabela `supabase_migrations.schema_migrations`

```sql
-- Registrar migration manualmente (se necessário)
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20241213000000')
ON CONFLICT DO NOTHING;
```

---

## Smoke Tests de Segurança Multi-tenant

### Teste 1: Isolamento entre lojas

```sql
-- Criar usuário de teste da Store A
-- Verificar que não consegue ver dados da Store B

-- Como anon, tentar acessar dados de loja inativa
SET ROLE anon;
SELECT * FROM stores WHERE is_active = false;
-- Esperado: 0 rows

-- Como anon, tentar acessar produtos de loja ativa
SELECT * FROM products 
WHERE store_id IN (SELECT id FROM stores WHERE is_active = true)
LIMIT 5;
-- Esperado: produtos de lojas ativas apenas
```

### Teste 2: Acesso anon ao cardápio

```sql
SET ROLE anon;

-- Deve funcionar: ver lojas ativas
SELECT id, name, slug FROM stores WHERE is_active = true;

-- Deve funcionar: ver categorias ativas de lojas ativas
SELECT c.id, c.name, c.store_id 
FROM categories c
JOIN stores s ON c.store_id = s.id
WHERE c.is_active = true AND s.is_active = true;

-- Deve funcionar: ver produtos ativos de lojas ativas
SELECT p.id, p.name, p.price, p.store_id
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.is_active = true AND s.is_active = true;

-- NÃO deve funcionar: ver orders
SELECT * FROM orders LIMIT 1;
-- Esperado: permission denied ou 0 rows

-- NÃO deve funcionar: ver customers
SELECT * FROM customers LIMIT 1;
-- Esperado: permission denied ou 0 rows
```

### Teste 3: Isolamento de usuário autenticado

```sql
-- Simular usuário da Store A
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<USER_ID_STORE_A>';

-- Deve ver apenas dados da Store A
SELECT * FROM orders WHERE store_id = '<STORE_A_ID>';
-- Esperado: orders da Store A

-- NÃO deve ver dados da Store B
SELECT * FROM orders WHERE store_id = '<STORE_B_ID>';
-- Esperado: 0 rows (RLS bloqueia)
```

---

## Checklist Pós-Aplicação

- [ ] Todas as migrations aplicadas sem erro
- [ ] `supabase migration list` mostra todas as versões
- [ ] Smoke test 1 (isolamento) passou
- [ ] Smoke test 2 (anon) passou
- [ ] Smoke test 3 (authenticated) passou
- [ ] App funciona (login, menu público, criar pedido)

---

## Rollback (Emergência)

```sql
-- Identificar última migration problemática
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Remover registro (NÃO desfaz as alterações SQL!)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '<VERSION>';

-- Para desfazer alterações, criar migration de rollback manual
```

> ⚠️ **Supabase não tem rollback automático.** Sempre teste em staging primeiro!

---

## Histórico de Aplicações

| Data | Ambiente | Versões | Operador | Status |
|------|----------|---------|----------|--------|
| _preencher_ | staging | _versões_ | _nome_ | ✅/❌ |
| _preencher_ | prod | _versões_ | _nome_ | ✅/❌ |
