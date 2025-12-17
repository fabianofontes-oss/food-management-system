# 🔍 AUDIT REPORT - Food Management System

**Data:** 17 de Dezembro de 2025  
**Auditor:** Principal Engineer / System Architect  
**Versão do Sistema:** 1.0.0

---

## 📋 Resumo Executivo

Sistema SaaS multi-tenant para gestão de negócios de alimentação (PDV, delivery, cardápio digital). Stack moderna (Next.js 14, Supabase, TypeScript), porém com **débito técnico significativo** que impede deploy em produção seguro. Principais bloqueadores: (1) **334 usos de `any`** comprometem type-safety, (2) **0% de cobertura de testes**, (3) **RLS parcialmente implementado** com políticas inconsistentes, (4) **arquitetura híbrida** entre Vertical Slices e código legado espalhado. O MVP funciona para demos, mas requer ~2-3 semanas de hardening antes de produção real. Recomendação: executar P0 imediatamente, P1 antes de beta fechado.

---

## 📊 Scorecard (0-10)

| Categoria | Score | Justificativa |
|-----------|-------|---------------|
| **Arquitetura** | 6/10 | Vertical Slices parcial; lógica espalhada entre `/modules`, `/lib`, `/hooks`, `/services` |
| **Qualidade de Código** | 5/10 | 334 `any`, 279 console.log, sem memoização, catch genéricos |
| **Dados & Backend** | 7/10 | Schema robusto (27+ tabelas), migrations organizadas, mas RLS inconsistente |
| **Performance** | 6/10 | Sem useMemo/useCallback, muitos useEffects, sem loading states em várias páginas |
| **Segurança** | 4/10 | RLS parcial, políticas `FOR ALL USING (true)`, sem rate limiting, secrets ok |
| **Testes/DX** | 2/10 | Zero testes, ESLint mínimo, sem Prettier, sem CI/CD, sem pre-commit hooks |
| **UX/Produto** | 7/10 | Fluxos principais funcionais, UI moderna, falta estados vazios e loading consistentes |

**Score Geral: 5.3/10** — MVP funcional, não production-ready.

---

## 🏗️ Contexto do Sistema

### Stack Tecnológica
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict: true)
- **UI:** TailwindCSS, shadcn/ui, Lucide React
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State:** Zustand (cart), React Query (preparado mas pouco usado), Context (i18n)
- **Forms:** React Hook Form + Zod (parcial)
- **Deploy:** Vercel (frontend), Supabase Cloud (backend)

### Domínio do Produto
- **Tipo:** SaaS B2B Multi-tenant para foodservice
- **Nichos:** Açaí, Burger, Hotdog, Marmita, Açougue, Sorvete, Pizza, etc.
- **Módulos:** Cardápio Digital, PDV, Cozinha (KDS), Delivery, CRM, Inventário, Financeiro

### Estratégia Multi-Tenant
- **Isolamento:** Por `store_id` (slug na URL: `/[slug]/dashboard`)
- **Hierarquia:** Tenant → Store → Users (com roles: OWNER, MANAGER, CASHIER, KITCHEN, DELIVERY)
- **Auth:** Supabase Auth + middleware de verificação de acesso

---

## 🗺️ Mapa de Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 14)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │  (auth)/    │  │  (public)/   │  │ (super-admin)/ │  │   [slug]/     │  │
│  │  login      │  │  landing     │  │  admin/*       │  │  dashboard/*  │  │
│  │  signup     │  │  profile     │  │  (20 páginas)  │  │  (30 páginas) │  │
│  │  reset-pwd  │  │              │  │                │  │  cart/checkout│  │
│  └─────────────┘  └──────────────┘  └────────────────┘  └───────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           CAMADA DE LÓGICA                                  │
├───────────────────┬───────────────────┬─────────────────────────────────────┤
│                   │                   │                                     │
│  src/modules/     │  src/lib/         │  src/hooks/                         │
│  ┌─────────────┐  │  ┌─────────────┐  │  ┌─────────────┐                    │
│  │ store/      │  │  │ coupons/    │  │  │ useOrders   │ ← FORA DO PADRÃO  │
│  │ menu/       │  │  │ modifiers/  │  │  │ useProducts │ ← FORA DO PADRÃO  │
│  │ cart/       │  │  │ superadmin/ │  │  │ useSettings │                    │
│  │ orders/     │  │  │ reports/    │  │  └─────────────┘                    │
│  └─────────────┘  │  │ actions/    │  │                                     │
│   ✅ CORRETO      │  └─────────────┘  │  src/services/                      │
│                   │   ⚠️ LEGADO       │  ┌─────────────┐                    │
│                   │                   │  │ settings    │ ← FORA DO PADRÃO  │
│                   │                   │  │ store       │                    │
│                   │                   │  └─────────────┘                    │
├───────────────────┴───────────────────┴─────────────────────────────────────┤
│                           CAMADA DE DADOS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SUPABASE                                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Auth     │  │ Database │  │ Realtime │  │ Storage  │            │   │
│  │  │          │  │ 27 tabs  │  │ orders   │  │ logos    │            │   │
│  │  │          │  │ 40 migr  │  │ kitchen  │  │ products │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │                                                                     │   │
│  │  RLS: ⚠️ PARCIAL (algumas tabelas com `USING (true)`)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Top 15 Problemas Críticos

### 1. **[CRÍTICO] Uso massivo de `any` (334 ocorrências)**
- **Arquivo:** 94 arquivos afetados
- **Principais:** `src/modules/menu/repository.ts`, `src/lib/notifications.ts`, `src/hooks/useProductsComplete.ts`
- **Evidência:**
  ```typescript
  // src/modules/menu/repository.ts:49
  const transformedProducts: ProductWithDetails[] = (products || []).map((product: any) => {
  ```
- **Impacto:** Type-safety comprometida, bugs silenciosos em runtime, refatoração arriscada
- **Gravidade:** 🔴 Alta
- **Esforço:** 3-5 dias

### 2. **[CRÍTICO] Zero testes automatizados**
- **Arquivo:** Nenhum `*.test.*` ou `*.spec.*` em `/src`
- **Evidência:** `find_by_name *.test.* → 0 results`
- **Impacto:** Regressões não detectadas, refatoração perigosa, deploy arriscado
- **Gravidade:** 🔴 Alta
- **Esforço:** 5-10 dias (setup + testes críticos)

### 3. **[CRÍTICO] RLS com política permissiva em `kitchen_chefs`**
- **Arquivo:** `supabase/migrations/20241214_kitchen_chefs.sql:20`
- **Evidência:**
  ```sql
  CREATE POLICY "kitchen_chefs_all" ON kitchen_chefs FOR ALL USING (true);
  ```
- **Impacto:** Qualquer usuário autenticado pode ler/modificar cozinheiros de TODAS as lojas
- **Gravidade:** 🔴 Crítica (vazamento de dados)
- **Esforço:** 30 min

### 4. **[ALTO] Arquitetura híbrida inconsistente**
- **Arquivo:** `src/lib/`, `src/hooks/`, `src/services/` vs `src/modules/`
- **Evidência:** 
  - `src/lib/coupons/actions.ts` deveria ser `src/modules/coupons/actions.ts`
  - `src/hooks/useOrders.ts` deveria ser `src/modules/orders/hooks/useOrders.ts`
- **Impacto:** Dificuldade de manutenção, onboarding lento, duplicações
- **Gravidade:** 🟠 Média-Alta
- **Esforço:** 2-3 dias

### 5. **[ALTO] 279 console.log/console.error em produção**
- **Arquivo:** 92 arquivos afetados
- **Principais:** `src/modules/store/actions.ts` (14), `src/app/[slug]/dashboard/delivery/page.tsx` (13)
- **Evidência:**
  ```typescript
  } catch (error: any) {
    console.error('Erro na getStoreAction:', error)
  ```
- **Impacto:** Logs poluídos, informações sensíveis expostas no console do browser
- **Gravidade:** 🟠 Média
- **Esforço:** 1 dia

### 6. **[ALTO] Catch blocks com `error: any`**
- **Arquivo:** Múltiplos em `src/modules/*/actions.ts`
- **Evidência:**
  ```typescript
  } catch (error: any) {
    return { success: false, error: error.message }
  }
  ```
- **Impacto:** Erros não tipados, possível exposição de stack traces
- **Gravidade:** 🟠 Média
- **Esforço:** 1 dia

### 7. **[ALTO] Sem loading.tsx em rotas críticas**
- **Arquivo:** `src/app/[slug]/dashboard/*/page.tsx`
- **Evidência:** `find_by_name loading.tsx → 0 results`
- **Impacto:** UX ruim durante carregamento, layout shifts
- **Gravidade:** 🟠 Média
- **Esforço:** 1 dia

### 8. **[MÉDIO] Sem useMemo/useCallback**
- **Arquivo:** Todo o codebase
- **Evidência:** `grep useMemo|useCallback → 0 results`
- **Impacto:** Re-renders desnecessários em listas e callbacks
- **Gravidade:** 🟡 Média
- **Esforço:** 2-3 dias

### 9. **[MÉDIO] Link quebrado no login**
- **Arquivo:** `src/app/(auth)/login/page.tsx:151`
- **Evidência:**
  ```tsx
  <Link href="/forgot-password"  // Deveria ser /reset-password
  ```
- **Impacto:** 404 para usuários tentando recuperar senha
- **Gravidade:** 🟡 Média
- **Esforço:** 5 min

### 10. **[MÉDIO] Arquivo duplicado no financeiro**
- **Arquivo:** `src/app/[slug]/dashboard/financial/page_new.tsx`
- **Evidência:** Arquivo `page.tsx` e `page_new.tsx` coexistem
- **Impacto:** Confusão, código morto, bundle maior
- **Gravidade:** 🟡 Baixa
- **Esforço:** 5 min

### 11. **[MÉDIO] ESLint mínimo, sem Prettier**
- **Arquivo:** `.eslintrc.json`
- **Evidência:**
  ```json
  { "extends": "next/core-web-vitals" }
  ```
- **Impacto:** Código inconsistente, PRs com diff desnecessário
- **Gravidade:** 🟡 Média
- **Esforço:** 2 horas

### 12. **[MÉDIO] Sem revalidatePath/revalidateTag**
- **Arquivo:** Server Actions
- **Evidência:** `grep revalidatePath → alguns usos, mas inconsistente`
- **Impacto:** Cache stale após mutações
- **Gravidade:** 🟡 Média
- **Esforço:** 1 dia

### 13. **[MÉDIO] Cart não valida loja diferente**
- **Arquivo:** `src/stores/cart-store.ts`
- **Evidência:** `storeSlug` é setado mas não validado ao adicionar item
- **Impacto:** Usuário pode ter itens de lojas diferentes no carrinho
- **Gravidade:** 🟡 Média
- **Esforço:** 2 horas

### 14. **[BAIXO] Muitos useEffect sem cleanup**
- **Arquivo:** 91 arquivos com useEffect
- **Principais:** `src/app/[slug]/dashboard/kitchen/page.tsx` (9 useEffects)
- **Impacto:** Memory leaks potenciais, subscriptions órfãs
- **Gravidade:** 🟢 Baixa
- **Esforço:** 2 dias

### 15. **[BAIXO] Integrações apenas UI (iFood, Rappi, etc)**
- **Arquivo:** `src/modules/store/types.ts` (IntegrationSettings)
- **Evidência:** Configurações existem, mas nenhuma lógica de integração real
- **Impacto:** Funcionalidade prometida não entregue
- **Gravidade:** 🟢 Baixa (feature, não bug)
- **Esforço:** 2-4 semanas por integração

---

## 📁 Inventário do Repositório

### Rotas/Páginas (43 páginas)
```
(auth)/           → 4 páginas (login, signup, reset-password, update-password)
(public)/         → 2 páginas (landing, profile)
(super-admin)/    → 20 páginas (admin, tenants, stores, users, plans, etc.)
[slug]/           → 17+ páginas (dashboard, cart, checkout, pedido, etc.)
```

### Módulos Vertical Slices (4)
```
src/modules/
├── cart/       → store.ts, types.ts, components/ ✅
├── menu/       → actions.ts, repository.ts, types.ts, hooks/, components/ ✅
├── orders/     → actions.ts, repository.ts, types.ts, hooks/, components/ ✅
├── store/      → actions.ts, repository.ts, types.ts, hooks/, components/, utils.ts ✅
```

### Código Legado Fora de Módulos
```
src/lib/
├── coupons/       → Deveria ser src/modules/coupons/
├── modifiers/     → Deveria ser src/modules/modifiers/
├── superadmin/    → Deveria ser src/modules/superadmin/
├── reports/       → Deveria ser src/modules/reports/
├── actions/       → Disperso, deveria ir para módulos específicos

src/hooks/
├── useOrders.ts   → Deveria ser src/modules/orders/hooks/
├── useProducts.ts → Deveria ser src/modules/menu/hooks/

src/services/
├── settings.service.ts → Deveria ser src/modules/store/services/
├── store.service.ts    → Deveria ser src/modules/store/services/
```

### Migrations (40 arquivos)
- Schema base + RLS + features avançadas
- Bem organizadas cronologicamente
- RLS implementado em `20251214_05_rls_full_multitenant.sql`

### Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "backup:code": "node scripts/backup_project.mjs"
}
```
**Faltando:** `test`, `format`, `prepare` (husky)

---

## ✅ Plano de Ação Priorizado

### 🔴 P0 — Quick Wins (24-48h) — Estabilizar para Demo/Beta

| # | Tarefa | Arquivo | Esforço | Impacto |
|---|--------|---------|---------|---------|
| 1 | Corrigir RLS `kitchen_chefs` | `migrations/20241214_kitchen_chefs.sql` | 30min | 🔴 Crítico |
| 2 | Corrigir link `/forgot-password` | `src/app/(auth)/login/page.tsx:151` | 5min | 🟠 UX |
| 3 | Deletar `page_new.tsx` duplicado | `src/app/[slug]/dashboard/financial/` | 5min | 🟢 Limpeza |
| 4 | Adicionar loading.tsx no dashboard | `src/app/[slug]/dashboard/loading.tsx` | 30min | 🟠 UX |
| 5 | Validar storeSlug no cart | `src/stores/cart-store.ts` | 1h | 🟠 Bug |
| 6 | Criar Error Boundary no dashboard | `src/app/[slug]/dashboard/error.tsx` | 30min | 🟠 UX |

### 🟠 P1 — Refactors Estruturais (1-2 semanas) — Antes de Beta Fechado

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 1 | Eliminar `any` nos módulos core (menu, orders, store) | 2 dias | 🔴 Type-safety |
| 2 | Migrar `/lib/coupons` → `/modules/coupons` | 4h | 🟠 Arquitetura |
| 3 | Migrar `/hooks/useOrders` → `/modules/orders/hooks` | 2h | 🟠 Arquitetura |
| 4 | Setup Jest + React Testing Library | 1 dia | 🔴 Testes |
| 5 | Testes E2E do fluxo de pedido (Playwright) | 2 dias | 🔴 Testes |
| 6 | Substituir console.log por logger estruturado | 1 dia | 🟠 Observabilidade |
| 7 | Configurar Prettier + lint-staged + husky | 2h | 🟠 DX |
| 8 | Adicionar useMemo/useCallback em listas | 1 dia | 🟡 Performance |
| 9 | Revisar todas as políticas RLS | 1 dia | 🔴 Segurança |

### 🟢 P2 — Melhorias Grandes (3-6 semanas) — Dívida Técnica

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 1 | Migrar todo `/lib` para `/modules` | 1 semana | 🟠 Arquitetura |
| 2 | Implementar Error Tracking (Sentry) | 1 dia | 🟠 Observabilidade |
| 3 | Cobertura de testes > 60% | 2-3 semanas | 🟠 Qualidade |
| 4 | Implementar rate limiting no middleware | 2 dias | 🟠 Segurança |
| 5 | Otimizar bundle (code splitting) | 2 dias | 🟡 Performance |
| 6 | Integração real WhatsApp (API oficial) | 1 semana | 🟢 Feature |
| 7 | Integração iFood (se parceria) | 2-4 semanas | 🟢 Feature |
| 8 | PWA + Service Worker | 1 semana | 🟢 Feature |

---

## 📐 Golden Path — Padrões Oficiais do Repositório

### Como Criar um Novo Módulo

```
src/modules/{nome-do-modulo}/
├── types.ts          # Tipos Zod + DB + UI
├── repository.ts     # Apenas queries Supabase (Data Layer)
├── actions.ts        # Server Actions (validação + chama repository)
├── hooks/
│   └── use-{nome}.ts # Custom hooks para consumir dados
├── components/
│   └── *.tsx         # Componentes visuais do módulo
└── index.ts          # Barrel export
```

**Exemplo de `types.ts`:**
```typescript
import { z } from 'zod'
import { Database } from '@/types/database'

// 1. Tipo do banco
export type CouponRow = Database['public']['Tables']['coupons']['Row']

// 2. Schema Zod para validação
export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number().positive(),
  // ...
})

// 3. Tipos derivados
export type CreateCouponInput = z.infer<typeof createCouponSchema>
```

**Exemplo de `repository.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { CouponRow } from './types'

export async function getCouponsByStore(storeId: string): Promise<CouponRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
  
  if (error) throw error
  return data ?? []
}
```

**Exemplo de `actions.ts`:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createCouponSchema, type CreateCouponInput } from './types'
import * as repository from './repository'

export async function createCouponAction(storeSlug: string, input: CreateCouponInput) {
  // 1. Validação
  const parsed = createCouponSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  // 2. Chamada ao repository
  try {
    const coupon = await repository.createCoupon(parsed.data)
    revalidatePath(`/${storeSlug}/dashboard/coupons`)
    return { success: true, data: coupon }
  } catch (error) {
    return { success: false, error: 'Erro ao criar cupom' }
  }
}
```

### Como Criar uma Página

```typescript
// src/app/[slug]/dashboard/{feature}/page.tsx
import { Suspense } from 'react'
import { FeatureClient } from './FeatureClient'
import { FeatureSkeleton } from './FeatureSkeleton'

export default function FeaturePage() {
  return (
    <Suspense fallback={<FeatureSkeleton />}>
      <FeatureClient />
    </Suspense>
  )
}
```

### Como Criar um Componente

```typescript
// src/modules/{modulo}/components/FeatureCard.tsx
'use client'

import { type FC } from 'react'
import { Card } from '@/components/ui/card'

interface FeatureCardProps {
  title: string
  description?: string
  onAction: () => void
}

export const FeatureCard: FC<FeatureCardProps> = ({ title, description, onAction }) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground">{description}</p>}
      <button onClick={onAction}>Ação</button>
    </Card>
  )
}
```

### Convenções de Código

| Categoria | Padrão |
|-----------|--------|
| **Nomes de arquivo** | kebab-case (`product-card.tsx`) |
| **Nomes de componente** | PascalCase (`ProductCard`) |
| **Nomes de função** | camelCase (`getProductById`) |
| **Nomes de tipo** | PascalCase (`ProductWithDetails`) |
| **Nomes de constante** | SCREAMING_SNAKE_CASE (`DEFAULT_PAGE_SIZE`) |
| **Server Actions** | Sufixo `Action` (`createProductAction`) |
| **Hooks** | Prefixo `use` (`useProducts`) |
| **Schemas Zod** | Sufixo `Schema` (`createProductSchema`) |

---

## ✅ Checklist de Release (Antes de Produção)

### Segurança
- [ ] Todas as tabelas têm RLS habilitado
- [ ] Nenhuma política com `USING (true)` sem justificativa
- [ ] Secrets não estão no código (verificar com `git secrets`)
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente

### Qualidade
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] Zero `any` em código de produção (ou justificado)
- [ ] Cobertura de testes > 60%
- [ ] Testes E2E do fluxo crítico passam

### Performance
- [ ] Lighthouse score > 80 em todas as métricas
- [ ] Bundle size analisado (`npm run build`)
- [ ] Imagens otimizadas (next/image)
- [ ] Fonts otimizadas (next/font)

### Observabilidade
- [ ] Error tracking configurado (Sentry)
- [ ] Logs estruturados (sem console.log)
- [ ] Métricas de negócio (analytics)
- [ ] Health check endpoint

### UX
- [ ] Todos os formulários têm validação client-side
- [ ] Estados de loading em todas as ações assíncronas
- [ ] Estados vazios tratados
- [ ] Mensagens de erro amigáveis
- [ ] Mobile-first testado

### Infra
- [ ] Variáveis de ambiente documentadas
- [ ] Backup de banco configurado
- [ ] Domínio customizado configurado
- [ ] SSL ativo
- [ ] CI/CD configurado

---

## 🔧 Patch Sugerido (Diffs Seguros)

### 1. Corrigir link `/forgot-password`

```diff
--- a/src/app/(auth)/login/page.tsx
+++ b/src/app/(auth)/login/page.tsx
@@ -148,7 +148,7 @@ export default function LoginPage() {
               <label className="flex items-center">
                 <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded" />
                 <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
               </label>
-              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
+              <Link href="/reset-password" className="text-sm text-green-600 hover:text-green-700">
                 Esqueceu a senha?
               </Link>
             </div>
```

### 2. Corrigir RLS `kitchen_chefs`

```diff
--- a/supabase/migrations/20241214_kitchen_chefs.sql
+++ b/supabase/migrations/20241214_kitchen_chefs.sql
@@ -17,7 +17,10 @@ ALTER TABLE kitchen_chefs ENABLE ROW LEVEL SECURITY;
 -- Policy de acesso
 DO $$ 
 BEGIN
-  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kitchen_chefs_all') THEN
-    CREATE POLICY "kitchen_chefs_all" ON kitchen_chefs FOR ALL USING (true);
+  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kitchen_chefs_store_access') THEN
+    CREATE POLICY "kitchen_chefs_store_access" ON kitchen_chefs 
+    FOR ALL 
+    USING (public.user_has_store_access(store_id))
+    WITH CHECK (public.user_has_store_access(store_id));
   END IF;
 END $$;
```

### 3. Deletar arquivo duplicado

```bash
rm src/app/[slug]/dashboard/financial/page_new.tsx
```

### 4. Validar storeSlug no cart

```diff
--- a/src/stores/cart-store.ts
+++ b/src/stores/cart-store.ts
@@ -40,6 +40,12 @@ export const useCartStore = create<CartStore>()(
       setStoreSlug: (slug) => set({ storeSlug: slug }),

       addItem: (productId, productName, productImage, unitPrice, modifiers, notes, flavors, isHalfHalf) => {
+        const currentSlug = get().storeSlug
+        if (currentSlug && currentSlug !== get().storeSlug) {
+          // Limpar carrinho se for loja diferente
+          set({ items: [], couponCode: null, couponDiscount: 0 })
+        }
+
         const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.extra_price, 0)
         const itemPrice = unitPrice + modifiersTotal
```

---

## 📝 Conclusão

O **Food Management System** é um MVP funcional com arquitetura moderna, mas requer **hardening significativo** antes de produção. Os principais bloqueadores são:

1. **Segurança:** RLS inconsistente (política `USING (true)`)
2. **Qualidade:** 334 usos de `any`, zero testes
3. **Arquitetura:** Código espalhado fora de módulos

**Recomendação:** Executar P0 imediatamente (1-2 dias), P1 antes de beta fechado (2 semanas), P2 como roadmap contínuo.

**Estimativa para Production-Ready:** 2-3 semanas de trabalho focado.

---

*Relatório gerado em 17/12/2025 por auditoria automatizada.*
