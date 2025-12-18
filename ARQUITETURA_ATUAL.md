# 📖 ARQUITETURA ATUAL DO SISTEMA

> **Documento gerado em:** 18/12/2024  
> **Propósito:** Análise técnica completa da estrutura atual do projeto  
> **Status:** Baseline para refatoração

---

## 1. VISÃO GERAL DA STACK

### 1.1 Tecnologias Core

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14.2.18 | Framework React (App Router) |
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.6.3 | Tipagem estática |
| **Supabase** | 2.45.4 | Backend-as-a-Service (Auth, DB, Storage) |
| **TailwindCSS** | 3.4.14 | Estilização utility-first |
| **Zustand** | 4.5.5 | Gerenciamento de estado |
| **Zod** | 3.25.76 | Validação de schemas |
| **React Hook Form** | 7.68.0 | Gerenciamento de formulários |
| **TanStack Query** | 5.59.16 | Server state management |

### 1.2 Bibliotecas de UI

| Biblioteca | Uso |
|------------|-----|
| **Radix UI** | Primitivos acessíveis (Dialog, Select, Switch, etc.) |
| **Lucide React** | Ícones |
| **class-variance-authority** | Variantes de componentes (padrão shadcn/ui) |
| **tailwind-merge** | Merge de classes Tailwind |
| **Recharts** | Gráficos |
| **Sonner** | Toasts/Notificações |
| **date-fns** | Manipulação de datas |

### 1.3 Ferramentas de Dev

| Ferramenta | Propósito |
|------------|-----------|
| **Playwright** | Testes E2E |
| **ESLint** | Linting (config Next.js) |

### 1.4 Configurações Críticas

```javascript
// next.config.js - FLAGS DE ALERTA 🚨
typescript: { ignoreBuildErrors: true },  // ⚠️ PERIGOSO
eslint: { ignoreDuringBuilds: true },     // ⚠️ PERIGOSO
```

**Implicação:** Erros de tipo e lint são ignorados no build. O projeto pode ter erros silenciosos em produção.

---

## 2. MAPA DE PASTAS

### 2.1 Estrutura Raiz `/src`

```
src/
├── app/           # 168 arquivos - Rotas (App Router)
├── components/    #  73 arquivos - Componentes reutilizáveis
├── modules/       #  69 arquivos - Tentativa de Vertical Slices
├── lib/           #  33 arquivos - Utilitários e helpers
├── data/          #  18 arquivos - Dados estáticos e presets
├── types/         #   7 arquivos - Definições de tipos
├── hooks/         #   6 arquivos - Custom hooks
├── services/      #   3 arquivos - Serviços externos
├── stores/        #   1 arquivo  - Zustand stores
├── content/       #   1 arquivo  - Conteúdo estático
├── config/        #   1 arquivo  - Configurações
└── contexts/      #   0 arquivos - Pasta vazia
```

### 2.2 Estrutura de Rotas (`/src/app`)

#### Route Groups (App Router)

| Grupo | Propósito | Páginas |
|-------|-----------|---------|
| `(auth)` | Autenticação | login, signup, reset-password, update-password |
| `(public)` | Páginas públicas | landing, profile |
| `(super-admin)` | Dashboard do Super Admin | ~20 páginas |
| `[slug]` | Dashboard dinâmico por loja | ~30 páginas |
| `api/` | API Routes | ~20 endpoints |

#### Rotas do Super Admin (`/admin/*`)

```
(super-admin)/admin/
├── page.tsx              # Dashboard principal
├── analytics/            # Análises
├── automations/          # Automações
├── billing/              # Cobrança
├── demanda/              # Gestão de demanda
├── features/             # Features flags
├── health/               # 🔴 12 SUBPÁGINAS! (monolítico)
│   ├── audit/
│   ├── builder/
│   ├── database/
│   ├── debug/
│   ├── diagnostic/
│   ├── files/
│   ├── images/
│   ├── mocks/
│   ├── monitor/
│   ├── pages/
│   ├── printing/
│   └── slugs/
├── integrations/
├── logs/
├── partners/
├── plans/
│   ├── [planId]/
│   └── new/
├── reports/
├── settings/
├── stores/
├── tenants/
├── tickets/
└── users/
```

#### Rotas do Dashboard do Lojista (`/[slug]/dashboard/*`)

```
[slug]/dashboard/
├── page.tsx              # Dashboard principal
├── addons/               # Adicionais
├── analytics/            # Análises
├── appearance/           # Aparência
├── coupons/              # Cupons
├── crm/                  # CRM
├── custom-orders/        # Pedidos customizados
├── delivery/             # Delivery
├── financial/            # Financeiro (com subcomponentes)
├── inventory/            # Estoque
├── kitchen/              # Cozinha
├── kits/                 # Kits
├── marketing/            # Marketing
├── onboarding/           # Onboarding
├── orders/               # Pedidos
├── pdv-config/           # ❌ DUPLICADO
├── pdv-novo/             # ❌ DUPLICADO
├── pos/                  # ✓ PDV principal
├── pos-new/              # ❌ DUPLICADO
├── products/             # Produtos
├── reports/              # Relatórios
├── reservations/         # Reservas
├── reviews/              # Avaliações
│   └── integrations/
├── settings/             # 🔴 10 SUBPÁGINAS!
│   ├── appearance/
│   ├── complete/
│   ├── index/
│   ├── integrations/
│   ├── loyalty/
│   ├── modules/
│   ├── niche/
│   ├── pdv/
│   ├── platforms/
│   ├── scheduling/
│   └── store/
├── tables/               # Mesas
├── team/                 # Equipe
└── waiters/              # Garçons
```

### 2.3 Estrutura de Módulos (`/src/modules`)

```
modules/
├── billing/        # 3 arquivos  - Cobrança
├── cart/           # 9 arquivos  - Carrinho
├── menu/           # 12 arquivos - Menu/Cardápio
├── notifications/  # 4 arquivos  - Notificações
├── orders/         # 9 arquivos  - Pedidos
├── printing/       # 3 arquivos  - Impressão
├── reports/        # 4 arquivos  - Relatórios
└── store/          # 25 arquivos - Loja (MAIOR MÓDULO)
```

**Observação:** Tentativa de implementar Vertical Slices, mas inconsistente. Muito código ainda em `components/` e `lib/`.

### 2.4 Estrutura de Componentes (`/src/components`)

```
components/
├── checkout/       # 1 arquivo
├── dashboard/      # 1 arquivo  - ProductImporter (435 linhas!)
├── landing/        # 14 arquivos
├── layout/         # 8 arquivos
├── menu/           # 3 arquivos - ProductModal (579 linhas!)
├── printing/       # 1 arquivo  - thermal-receipt (331 linhas)
├── reports/        # 5 arquivos
├── scheduling/     # 1 arquivo  - SchedulingPicker (312 linhas)
├── settings/       # 21 arquivos - Muitos módulos aqui
├── system/         # 1 arquivo
└── ui/             # 16 arquivos - Primitivos shadcn/ui
```

### 2.5 Estrutura de Types (`/src/types`)

| Arquivo | Linhas | Observação |
|---------|--------|------------|
| `database.ts` | 767 | Tipos do banco (manual, não gerado) |
| `tropical.ts` | 425 | Tipos genéricos acumulados |
| `settings.ts` | 419 | Tipos de configurações |
| `niches.ts` | 339 | Tipos de nichos |
| `menu.ts` | ~150 | Tipos do cardápio |
| `products.ts` | ~100 | Tipos de produtos |
| `reports.ts` | ~80 | Tipos de relatórios |

**Total: ~2.300 linhas de tipos espalhados**

---

## 3. PONTOS CRÍTICOS (DÍVIDA TÉCNICA)

### 3.1 God Classes / Arquivos Monolíticos (>300 linhas)

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/config/modules.tsx` | **1.456** | 🔴 CRÍTICO - Config gigante com todas as definições de módulos |
| `src/types/database.ts` | **767** | 🟡 Tipos manuais do banco (deveria ser gerado pelo Supabase) |
| `src/app/(super-admin)/admin/tenants/page.tsx` | **679** | 🔴 Page monolítica com fetch, estado, UI, modais |
| `src/app/(super-admin)/admin/health/page.tsx` | **655** | 🔴 Page monolítica |
| `src/components/menu/ProductModal.tsx` | **579** | 🔴 Componente God Class |
| `src/app/(super-admin)/admin/stores/page.tsx` | **508** | 🔴 Page monolítica |
| `src/app/(super-admin)/admin/partners/page.tsx` | **499** | 🔴 Page monolítica |
| `src/app/(super-admin)/admin/demanda/page.tsx` | **484** | 🔴 Page monolítica |
| `src/app/(super-admin)/admin/page.tsx` | **471** | 🔴 Page monolítica |
| `src/modules/store/components/public/layouts/modern-layout.tsx` | **452** | 🟡 Layout complexo |
| `src/components/dashboard/ProductImporter.tsx` | **435** | 🔴 Componente God Class |
| `src/types/tropical.ts` | **425** | 🟡 Tipos acumulados sem organização |
| `src/data/product-presets.ts` | **424** | 🟡 Dados estáticos grandes |
| `src/types/settings.ts` | **419** | 🟡 Tipos de settings |
| `src/modules/orders/validations/validateCheckout.ts` | **417** | 🟡 Validação complexa |
| `src/app/api/health/diagnostic/route.ts` | **410** | 🟡 API complexa |
| `src/app/api/health/audit/route.ts` | **407** | 🟡 API complexa |

### 3.2 Padrão de Pages Monolíticas

Quase todas as pages do Super Admin seguem este anti-padrão:

```tsx
// ❌ ANTI-PADRÃO: Page fazendo tudo
export default function TenantPage() {
  // 1. Estados locais (10-20 useState)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  // ...mais 10 estados

  // 2. Fetch de dados (useEffect)
  useEffect(() => {
    // fetch direto na page
  }, [])

  // 3. Handlers (funções de 50-100 linhas)
  async function handleCreate() { /* ... */ }
  async function handleUpdate() { /* ... */ }
  async function handleDelete() { /* ... */ }

  // 4. UI (500+ linhas de JSX)
  return (
    <div>
      {/* Tabela */}
      {/* Modal de criar */}
      {/* Modal de editar */}
      {/* Modal de deletar */}
      {/* Filtros */}
      {/* Paginação */}
    </div>
  )
}
```

**O que deveria ser:**
- Page: apenas composição de componentes
- Hook: fetch e estado
- Actions: mutações
- Componentes: UI modularizada

### 3.3 Tipos Duplicados

O mesmo tipo é definido em múltiplos lugares:

```
src/types/database.ts        → Database types (767 linhas)
src/lib/supabase.ts          → Database types DUPLICADOS (92 linhas)
src/modules/store/types.ts   → Store types (384 linhas)
```

### 3.4 Vertical Slices Inconsistente

A arquitetura de módulos foi iniciada mas não seguida:

```
✅ src/modules/orders/        → Segue o padrão (actions, components, validations)
✅ src/modules/store/         → Segue o padrão parcialmente
❌ src/modules/billing/       → Apenas 3 arquivos, incompleto
❌ src/components/settings/   → Deveria estar em modules/settings/
❌ src/lib/superadmin/        → Deveria estar em modules/superadmin/
```

---

## 4. DUPLICAÇÕES

### 4.1 PDVs Duplicados

```
[slug]/dashboard/
├── pdv-config/     ❌ Deveria ter sido removido
├── pdv-novo/       ❌ Deveria ter sido removido
├── pos/            ✓ PDV principal (PDVModerno.tsx)
├── pos-new/        ❌ Deveria ter sido removido
```

**4 versões de PDV coexistindo!**

### 4.2 Páginas de Health Fragmentadas

```
(super-admin)/admin/health/
├── page.tsx            # Dashboard de saúde
├── audit/              # Auditoria
├── builder/            # Builder
├── database/           # Database
├── debug/              # Debug
├── diagnostic/         # Diagnóstico
├── files/              # Arquivos
├── images/             # Imagens
├── mocks/              # Mocks
├── monitor/            # Monitor
├── pages/              # Páginas
├── printing/           # Impressão
└── slugs/              # Slugs
```

**12 subpáginas de health** - deveria ser consolidado ou melhor organizado.

### 4.3 Settings Fragmentados

```
[slug]/dashboard/settings/
├── page.tsx            # Settings principal
├── appearance/         
├── complete/           
├── index/              
├── integrations/       
├── loyalty/            
├── modules/            
├── niche/              
├── pdv/                
├── platforms/          
├── scheduling/         
└── store/              
```

**10 subpáginas de settings** com lógica duplicada entre elas.

---

## 5. FLUXO DE DADOS

### 5.1 Estado Global

| Ferramenta | Uso |
|------------|-----|
| **Zustand** | Carrinho (`cart-store.ts`) - Único store global |
| **React Query** | Server state (instalado mas pouco usado) |
| **Context API** | Quase não usado (pasta contexts/ vazia) |

### 5.2 Padrão de Data Fetching

```
Page → useEffect → fetch → setState  (❌ Anti-padrão)
```

Deveria ser:
```
Page → Hook/React Query → Server Actions → Repository  (✅ Padrão ideal)
```

### 5.3 Providers Globais

```tsx
// src/app/layout.tsx - MUITO SIMPLES
<html>
  <body>
    <NetworkStatus />   // Único componente global
    {children}
  </body>
</html>
```

**Não há:**
- QueryClientProvider (React Query não está sendo usado)
- ThemeProvider
- AuthProvider
- ToastProvider (Sonner funciona sem provider)

---

## 6. GRAU DE MODULARIDADE

### Nota: 4/10

### Justificativa:

| Critério | Nota | Observação |
|----------|------|------------|
| Separação de responsabilidades | 3/10 | Pages fazem tudo |
| Reutilização de componentes | 5/10 | Existe mas inconsistente |
| Vertical Slices | 4/10 | Iniciado mas não seguido |
| Tipagem | 5/10 | Existe mas duplicada |
| Testes | 2/10 | Apenas E2E básico |
| Documentação | 3/10 | Docs existem mas desatualizados |

### O que funciona bem:
- UI primitivos (shadcn/ui) bem organizados
- Carrinho com Zustand bem implementado
- Estrutura de nichos de negócio bem pensada
- Sistema de módulos/features flexível

### O que precisa melhorar:
- Extrair lógica das pages para hooks/actions
- Consolidar tipos em um único lugar
- Deletar código duplicado (PDVs, etc.)
- Quebrar arquivos monolíticos (modules.tsx)
- Implementar Vertical Slices consistentemente

---

## 7. RECOMENDAÇÕES DE REFATORAÇÃO

### Prioridade 1 (Crítico):
1. **Deletar PDVs duplicados** - pdv-config, pdv-novo, pos-new
2. **Quebrar `modules.tsx`** - Separar em arquivos por categoria
3. **Gerar tipos do Supabase** - Usar `supabase gen types`

### Prioridade 2 (Importante):
4. **Extrair hooks das pages** - Criar `useTenantsData`, `useStoresData`, etc.
5. **Criar Server Actions** - Mover mutations das pages para actions
6. **Consolidar types** - Um arquivo por domínio

### Prioridade 3 (Melhoria):
7. **Implementar React Query** - Já está instalado
8. **Habilitar erros de build** - Remover `ignoreBuildErrors`
9. **Documentar módulos** - README em cada pasta de módulo

---

## 8. MÉTRICAS FINAIS

| Métrica | Valor |
|---------|-------|
| Total de arquivos TypeScript/React | ~380 |
| Arquivos com >500 linhas | 15 |
| Arquivos com >300 linhas | ~40 |
| Rotas (páginas) | ~95 |
| API Routes | ~20 |
| Componentes UI base | 16 |
| Hooks customizados | 6 |
| Stores Zustand | 1 |
| Duplicações identificadas | 4 PDVs + tipos |

---

**FIM DO DOCUMENTO**

*Este documento serve como baseline para decisões de refatoração. Deve ser atualizado conforme mudanças arquiteturais forem implementadas.*
