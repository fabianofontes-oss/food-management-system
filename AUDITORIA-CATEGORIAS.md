# 🔍 AUDITORIA: Problema de Categorias no Dashboard

**Data:** 12/12/2025  
**Status:** 🔴 CRÍTICO  
**Impacto:** Sistema de categorias não funciona no dashboard do lojista

---

## 📋 RESUMO EXECUTIVO

O sistema possui **DUAS TABELAS DIFERENTES** de categorias que estão causando conflito e inconsistência, resultando no desaparecimento das categorias no dashboard do lojista.

---

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. **DUPLICAÇÃO DE TABELAS DE CATEGORIAS**

#### Tabela 1: `categories` (Schema Principal)
- **Localização:** `supabase/schema.sql` (linhas 197-211)
- **Estrutura:**
  ```sql
  CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  );
  ```
- **Uso:** Menu público do cliente (cardápio)
- **Referenciada por:** Tabela `products` (schema.sql linha 217)

#### Tabela 2: `product_categories` (Migration 003)
- **Localização:** `migrations/003_products_complete.sql` (linhas 5-17)
- **Estrutura:**
  ```sql
  CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- **Uso:** Gestão interna de produtos no dashboard
- **Referenciada por:** Hook `useProductsComplete.ts`

### 2. **CONFLITO DE FOREIGN KEYS**

A migration 003 adiciona uma FK na tabela `products` que **CONFLITA** com a FK existente:

```sql
-- Migration 003 (linha 43)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID 
  REFERENCES product_categories(id) ON DELETE SET NULL;
```

Mas a tabela `products` no schema principal já tem:

```sql
-- Schema.sql (linha 217)
category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT
```

**Resultado:** A coluna `category_id` pode referenciar duas tabelas diferentes!

### 3. **AUSÊNCIA DE RLS POLICIES** 🔴

**NENHUMA** das duas tabelas de categorias possui Row Level Security habilitado:

```bash
# Busca por RLS policies
❌ ALTER TABLE categories ENABLE ROW LEVEL SECURITY - NÃO ENCONTRADO
❌ ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY - NÃO ENCONTRADO
```

**Consequência:** Usuários autenticados **NÃO CONSEGUEM** acessar as categorias devido às políticas de segurança do Supabase.

### 4. **INCONSISTÊNCIA NO CÓDIGO**

#### Hook `useProductsComplete.ts` (linha 39-42)
```typescript
supabase
  .from('product_categories')  // ❌ Usa product_categories
  .select('*')
  .eq('store_id', storeId)
```

#### Action `menu.ts` (linha 24-27)
```typescript
supabase
  .from('categories')  // ❌ Usa categories
  .select('*')
  .eq('store_id', storeId)
```

**Resultado:** Diferentes partes do sistema buscam categorias em tabelas diferentes!

---

## 🎯 IMPACTO NO SISTEMA

### Funcionalidades Afetadas:
1. ❌ Dashboard do lojista - Listagem de categorias vazia
2. ❌ Formulário de produtos - Dropdown de categorias sem opções
3. ❌ Menu público - Pode estar usando dados inconsistentes
4. ❌ Relatórios - Agrupamento por categoria incorreto

### Dados em Risco:
- Produtos podem estar associados a categorias inexistentes
- Seed data pode estar em tabela errada
- Inconsistência entre lojas

---

## 🔧 SOLUÇÃO PROPOSTA

### Opção 1: UNIFICAR EM `categories` (RECOMENDADO)
**Vantagens:**
- Tabela do schema principal (mais estável)
- Já tem relacionamento com `products`
- Estrutura mais simples e adequada

**Ações:**
1. Migrar dados de `product_categories` para `categories`
2. Adicionar colunas faltantes (`icon`, `color`, `tenant_id`)
3. Remover tabela `product_categories`
4. Adicionar RLS policies
5. Atualizar código para usar apenas `categories`

### Opção 2: UNIFICAR EM `product_categories`
**Vantagens:**
- Mais campos (icon, color)
- Tem `tenant_id` explícito

**Desvantagens:**
- Requer alterar FK em `products` (schema principal)
- Mais invasivo

---

## 📝 MIGRATION DE CORREÇÃO

```sql
-- Migration: 004_fix_categories_conflict.sql

-- 1. Adicionar RLS na tabela categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar tenant_id à tabela categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Preencher tenant_id baseado no store_id
UPDATE categories c
SET tenant_id = s.tenant_id
FROM stores s
WHERE c.store_id = s.id AND c.tenant_id IS NULL;

-- 4. Adicionar campos extras de product_categories em categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- 5. Migrar dados de product_categories para categories (se existirem)
INSERT INTO categories (id, tenant_id, store_id, name, description, sort_order, icon, color, is_active, created_at, updated_at)
SELECT id, tenant_id, store_id, name, description, display_order, icon, color, is_active, created_at, updated_at
FROM product_categories
ON CONFLICT (id) DO UPDATE SET
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- 6. Remover tabela product_categories (após migração de dados)
DROP TABLE IF EXISTS product_categories CASCADE;

-- 7. Criar RLS Policies para categories
CREATE POLICY "Users can view categories from their tenant"
  ON categories FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories in their tenant"
  ON categories FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories in their tenant"
  ON categories FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories in their tenant"
  ON categories FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- 8. Criar índices
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_store ON categories(tenant_id, store_id);
```

---

## 🔄 ALTERAÇÕES NO CÓDIGO

### 1. Atualizar `useProductsComplete.ts`
```typescript
// ANTES (linha 39)
.from('product_categories')

// DEPOIS
.from('categories')
```

### 2. Atualizar tipos em `types/products.ts`
```typescript
// Renomear interface se necessário
export interface ProductCategory {
  id: string
  tenant_id: string
  store_id: string
  name: string
  description: string | null
  sort_order: number
  icon?: string | null
  color?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar migration `004_fix_categories_conflict.sql`
- [ ] Executar migration no Supabase
- [ ] Atualizar `useProductsComplete.ts` (linha 39)
- [ ] Atualizar tipos em `types/products.ts`
- [ ] Testar listagem de categorias no dashboard
- [ ] Testar criação de nova categoria
- [ ] Testar associação produto-categoria
- [ ] Verificar seed data
- [ ] Commit e push para GitHub
- [ ] Deploy automático via Vercel

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados durante migração | Baixa | Alto | Backup antes da migration |
| FK constraints quebradas | Média | Alto | Validar dados antes de dropar tabela |
| RLS bloqueando acesso legítimo | Média | Médio | Testar policies com diferentes roles |
| Código usando tabela antiga | Alta | Médio | Busca global por `product_categories` |

---

## 📊 ANÁLISE DE CÓDIGO AFETADO

### Arquivos que usam `product_categories`:
1. `src/hooks/useProductsComplete.ts` (linhas 7, 28, 39, 153)
2. `migrations/003_products_complete.sql` (linhas 5, 43, 153)

### Arquivos que usam `categories`:
1. `src/lib/actions/menu.ts` (linha 24)
2. `supabase/schema.sql` (linhas 197, 217)
3. `supabase/seed.sql` (linhas 37, 42)

---

## 🎓 LIÇÕES APRENDIDAS

1. **Sempre verificar schema existente antes de criar migrations**
2. **RLS deve ser habilitado SEMPRE em tabelas multi-tenant**
3. **Migrations devem ser revisadas para conflitos com schema base**
4. **Nomenclatura consistente evita duplicações**
5. **Testes de integração detectariam esse problema**

---

## 📞 PRÓXIMOS PASSOS

1. **IMEDIATO:** Criar e aplicar migration de correção
2. **CURTO PRAZO:** Adicionar testes de integração para RLS
3. **MÉDIO PRAZO:** Revisar todas as migrations existentes
4. **LONGO PRAZO:** Implementar CI/CD com validação de schema

---

**Auditoria realizada por:** Cascade AI  
**Prioridade:** 🔴 CRÍTICA - Resolver HOJE
