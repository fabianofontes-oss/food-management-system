# 🚀 Como Aplicar as Migrations no Supabase

## 📋 Passo a Passo

### 1. **Acessar o Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione seu projeto **food-management-system**

### 2. **Abrir o SQL Editor**

1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de banco de dados)
2. Clique em **+ New query** para criar uma nova query

### 3. **Executar a Migration 004**

1. Abra o arquivo: `migrations/004_fix_categories_conflict.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem de sucesso ✅

### 4. **Verificar se Funcionou**

Execute esta query para verificar:

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'categories';

-- Deve retornar: rowsecurity = true

-- Verificar policies criadas
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'categories';

-- Deve retornar 4 policies:
-- - Users can view categories from their tenant
-- - Users can insert categories in their tenant
-- - Users can update categories in their tenant
-- - Users can delete categories in their tenant
```

---

## 🌐 URLs para Acessar o Sistema

### **Dashboard do Lojista - Produtos**

Formato da URL:
```
https://[seu-dominio-vercel].vercel.app/[slug-da-loja]/dashboard/products
```

**Exemplos:**

Se sua loja tem o slug `acai-da-praia`:
```
https://food-management-system.vercel.app/acai-da-praia/dashboard/products
```

Se sua loja tem o slug `burger-house`:
```
https://food-management-system.vercel.app/burger-house/dashboard/products
```

### **Como Descobrir o Slug da Sua Loja**

Execute no Supabase SQL Editor:

```sql
SELECT slug, name FROM stores;
```

Isso vai mostrar todas as lojas e seus slugs.

---

## 📱 Estrutura de URLs do Sistema

### **Dashboard Principal**
```
/[slug]/dashboard
```

### **Gestão de Produtos**
```
/[slug]/dashboard/products
```

### **PDV (Ponto de Venda)**
```
/[slug]/dashboard/pos
```

### **Pedidos**
```
/[slug]/dashboard/orders
```

### **CRM (Clientes)**
```
/[slug]/dashboard/crm
```

### **Cozinha**
```
/[slug]/dashboard/kitchen
```

### **Configurações**
```
/[slug]/dashboard/settings
```

---

## 🔍 Verificar Categorias no Banco

Depois de aplicar a migration, execute:

```sql
-- Ver todas as categorias
SELECT 
  c.name as categoria,
  s.name as loja,
  c.sort_order,
  c.is_active
FROM categories c
JOIN stores s ON s.id = c.store_id
ORDER BY s.name, c.sort_order;
```

---

## ⚠️ Troubleshooting

### **Problema: "permission denied for table categories"**

**Solução:** A migration 004 ainda não foi executada. Execute-a primeiro.

### **Problema: "categorias não aparecem no dashboard"**

**Verificar:**

1. RLS está habilitado?
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'categories';
```

2. Policies foram criadas?
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'categories';
-- Deve retornar 4
```

3. Você está logado com um usuário válido?
```sql
SELECT id, email, tenant_id FROM users WHERE id = auth.uid();
```

4. A loja tem categorias cadastradas?
```sql
SELECT COUNT(*) FROM categories WHERE store_id = '[seu-store-id]';
```

### **Problema: "table product_categories does not exist"**

**Solução:** Isso é esperado! A migration 004 remove essa tabela duplicada. Se você ver esse erro ANTES de executar a migration, ignore - a migration vai criar a estrutura correta.

---

## 📊 Ordem de Execução das Migrations

Se você está configurando do zero, execute nesta ordem:

1. `supabase/schema.sql` - Schema principal
2. `migrations/001_plans_and_subscriptions.sql`
3. `migrations/002_tenant_localization.sql`
4. `migrations/003_products_complete.sql`
5. `migrations/004_fix_categories_conflict.sql` ⭐ **NOVA**

---

## 🎯 Checklist Pós-Migration

- [ ] Migration 004 executada com sucesso
- [ ] RLS habilitado em `categories`
- [ ] 4 policies criadas
- [ ] Tabela `product_categories` removida
- [ ] Categorias aparecem no dashboard
- [ ] Possível criar nova categoria
- [ ] Possível associar produto a categoria

---

## 💡 Dica

Depois de aplicar a migration, **limpe o cache do navegador** ou abra em aba anônima para garantir que está vendo a versão mais recente do sistema.

---

**Precisa de ajuda?** Verifique o arquivo `AUDITORIA-CATEGORIAS.md` para detalhes técnicos completos.
