# 🏗️ BLUEPRINT COMPLETO DO SISTEMA

> **Food Management System - Sistema Multi-Tenant para Gestão de Negócios de Alimentação**
> 
> Documento gerado em: 18/12/2024
> Propósito: Handoff completo para nova IA continuar o desenvolvimento

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Banco de Dados (Supabase)](#5-banco-de-dados-supabase)
6. [Autenticação e Autorização](#6-autenticação-e-autorização)
7. [Sistema Multi-Tenant](#7-sistema-multi-tenant)
8. [Módulos e Funcionalidades](#8-módulos-e-funcionalidades)
9. [Rotas e Páginas](#9-rotas-e-páginas)
10. [Padrões de Código](#10-padrões-de-código)
11. [Scripts de Automação](#11-scripts-de-automação)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [Deploy e Produção](#13-deploy-e-produção)
14. [Dívida Técnica Conhecida](#14-dívida-técnica-conhecida)
15. [Regras do Usuário (OBRIGATÓRIO)](#15-regras-do-usuário-obrigatório)
16. [Histórico de Commits Recentes](#16-histórico-de-commits-recentes)

---

## 1. VISÃO GERAL DO PROJETO

### O que é?
Sistema SaaS multi-tenant para gestão completa de negócios de alimentação (restaurantes, açaiterias, hamburguerias, etc). Permite que múltiplas lojas operem de forma independente em uma única plataforma.

### Modelo de Negócio
```
Super Admin (Plataforma)
    └── Tenants (Empresas/Franquias)
        └── Stores (Lojas individuais)
            └── Users (Funcionários da loja)
                └── Customers (Clientes que fazem pedidos)
```

### Nichos Suportados
- `acai` - Açaiterias
- `burger` - Hamburguerias
- `hotdog` - Hot Dogs
- `marmita` - Marmitarias
- `butcher` - Açougues
- `ice_cream` - Sorveterias
- `other` - Outros

### Principais Funcionalidades
- **Cardápio Digital**: Menu online responsivo com QR Code
- **PDV (POS)**: Ponto de venda para balcão
- **Delivery**: Gestão de entregas e entregadores
- **Mesas**: Controle de mesas e comandas
- **Cozinha (KDS)**: Painel de produção
- **Estoque**: Controle de insumos
- **Financeiro**: Controle de caixa
- **CRM**: Gestão de clientes e fidelidade
- **Relatórios**: Analytics e métricas

---

## 2. STACK TECNOLÓGICO

### Core
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14.2.18 | Framework React (App Router) |
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.6.3 | Tipagem estática |
| **Supabase** | 2.45.4 | Backend-as-a-Service (Auth, DB, Storage, Realtime) |

### UI/Styling
| Tecnologia | Propósito |
|------------|-----------|
| **TailwindCSS** 3.4.14 | Estilização utility-first |
| **Radix UI** | Primitivos acessíveis (Dialog, Select, Switch) |
| **Lucide React** | Ícones |
| **shadcn/ui** | Componentes base (Button, Input, Card, etc) |
| **Recharts** | Gráficos |
| **Sonner** | Toasts/Notificações |

### Estado e Forms
| Tecnologia | Propósito |
|------------|-----------|
| **Zustand** 4.5.5 | Estado global (carrinho) |
| **React Hook Form** 7.68.0 | Formulários |
| **Zod** 3.25.76 | Validação de schemas |
| **TanStack Query** 5.59.16 | Server state (instalado, pouco usado) |

### Utilitários
| Tecnologia | Propósito |
|------------|-----------|
| **date-fns** | Manipulação de datas |
| **qrcode.react** | Geração de QR Codes |

### Dev Tools
| Ferramenta | Propósito |
|------------|-----------|
| **Playwright** | Testes E2E |
| **ESLint** | Linting |

### ⚠️ CONFIGURAÇÃO CRÍTICA
```javascript
// next.config.js - FLAGS DE ALERTA
typescript: { ignoreBuildErrors: true },  // ⚠️ Erros de tipo ignorados
eslint: { ignoreDuringBuilds: true },     // ⚠️ Lint ignorado no build
```

---

## 3. ARQUITETURA DO SISTEMA

### Diagrama de Camadas
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Pages (App Router)  │  Components  │  Hooks  │  Stores     │
├─────────────────────────────────────────────────────────────┤
│                    MODULES (Vertical Slices)                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Store  │ │  Cart   │ │ Orders  │ │  Menu   │ ...       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                     LIB (Utilitários)                        │
│  supabase/  │  auth/  │  billing/  │  utils.ts              │
├─────────────────────────────────────────────────────────────┤
│                   SUPABASE (Backend)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Database │ │ Storage │ │Realtime │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados (Padrão Ideal)
```
UI Component → Hook → Server Action → Repository → Supabase
                                           ↓
UI Component ← Hook ← ─────────────────────┘
```

### Fluxo Atual (Anti-padrão em algumas pages)
```
Page → useEffect → fetch direto → setState  ❌
```

---

## 4. ESTRUTURA DE PASTAS

```
src/
├── app/                    # Rotas (Next.js App Router)
│   ├── (auth)/            # Login, signup, reset-password
│   ├── (public)/          # Landing, profile
│   ├── (super-admin)/     # Dashboard Super Admin (/admin/*)
│   │   └── admin/
│   │       ├── audit/     # 🆕 Saúde do Código
│   │       ├── billing/   # Cobrança
│   │       ├── health/    # Saúde do Sistema
│   │       ├── plans/     # Planos
│   │       ├── stores/    # Lojas
│   │       ├── tenants/   # Tenants
│   │       └── ...
│   ├── [slug]/            # Dashboard por Loja (/{slug}/dashboard/*)
│   │   ├── dashboard/     # Páginas do lojista
│   │   ├── cart/         # Carrinho público
│   │   ├── checkout/     # Checkout público
│   │   └── ...
│   └── api/               # API Routes
│       ├── admin/        # APIs administrativas
│       ├── health/       # APIs de saúde
│       └── webhooks/     # Webhooks externos
│
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Primitivos shadcn/ui (Button, Input, Card...)
│   ├── layout/           # Header, Footer, Sidebar
│   ├── menu/             # Componentes de cardápio
│   └── settings/         # Componentes de configurações
│
├── modules/              # Vertical Slices (PADRÃO RECOMENDADO)
│   ├── admin/           # 🆕 Módulo admin (tenants refatorado)
│   │   └── tenants/
│   │       ├── types/
│   │       ├── hooks/
│   │       ├── components/
│   │       └── index.ts
│   ├── cart/            # Carrinho de compras
│   ├── menu/            # Cardápio
│   ├── orders/          # Pedidos
│   ├── store/           # Loja (maior módulo)
│   ├── billing/         # Cobrança
│   ├── notifications/   # Notificações
│   ├── printing/        # Impressão
│   └── reports/         # Relatórios
│
├── lib/                  # Utilitários
│   ├── supabase/        # Cliente Supabase (client, server, middleware)
│   ├── auth/            # Autenticação helpers
│   ├── superadmin/      # Funções do Super Admin
│   └── utils.ts         # Utilitários gerais
│
├── stores/              # Estado global (Zustand)
│   └── cart-store.ts    # Único store atual
│
├── types/               # Definições de tipos
│   ├── database.ts      # Tipos do banco (769 linhas)
│   ├── niches.ts        # Tipos de nichos
│   ├── settings.ts      # Tipos de configurações
│   └── menu.ts          # Tipos do cardápio
│
├── data/                # Dados estáticos
│   ├── niches/          # Presets por nicho
│   └── product-presets.ts
│
├── hooks/               # Custom hooks
├── config/              # Configurações
│   └── modules/         # Definições de módulos
├── services/            # Serviços externos
└── middleware.ts        # Middleware de autenticação
```

---

## 5. BANCO DE DADOS (SUPABASE)

### Tabelas Principais

#### Hierarquia Multi-Tenant
```sql
tenants (Empresas)
├── id, name, country, language, currency, timezone
├── plans (Planos de assinatura)
│   └── id, name, slug, price_monthly_cents, features, limits
├── tenant_subscriptions (Assinaturas)
│   └── id, tenant_id, plan_id, status, period_start, period_end, trial_ends_at
└── stores (Lojas)
    └── id, tenant_id, name, slug, niche, mode, settings, is_active
```

#### Loja e Usuários
```sql
stores
├── store_users (Funcionários)
│   └── id, store_id, user_id, role
├── categories (Categorias do cardápio)
│   └── id, store_id, name, display_order
├── products (Produtos)
│   └── id, store_id, category_id, name, price, image_url
├── modifier_groups (Grupos de modificadores)
│   └── id, store_id, name, min_select, max_select
├── modifiers (Modificadores/Adicionais)
│   └── id, group_id, name, extra_price
└── orders (Pedidos)
    └── id, store_id, order_code, status, total_amount
        └── order_items (Itens do pedido)
            └── id, order_id, product_id, quantity, unit_price
```

#### Clientes e Fidelidade
```sql
customers (Clientes)
├── id, store_id, name, phone, email
├── addresses (Endereços)
└── loyalty_stamps (Carimbos de fidelidade)
    └── id, customer_id, store_id, stamps_count
```

### Tipos TypeScript do Banco
Localização: `src/types/database.ts` (769 linhas)

```typescript
// Exemplo de tipo
export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          niche: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
          mode: 'store' | 'home'
          is_active: boolean
          settings: Json | null
          // ...
        }
      }
      // ...
    }
  }
}
```

### RLS (Row Level Security)
Todas as queries devem respeitar RLS do Supabase. **NUNCA** expor dados de uma loja para outra.

---

## 6. AUTENTICAÇÃO E AUTORIZAÇÃO

### Fluxo de Autenticação
```
1. Usuário acessa /login
2. Supabase Auth verifica credenciais
3. Middleware valida sessão em cada request
4. Se válido, verifica permissão na loja (store_users)
```

### Middleware (src/middleware.ts)
```typescript
// Rotas públicas (sem auth)
const publicRoutes = ['/', '/login', '/signup', '/reset-password']

// Rotas de cardápio público
const isPublicStoreRoute = path.match(/^\/[^\/]+\/(cart|checkout|order)/)

// Dashboard requer auth + permissão na loja
if (dashboardMatch) {
  // Verificar se user tem acesso à store via store_users
}
```

### Super Admin
- Verificado em `src/lib/auth/super-admin.ts`
- Emails específicos têm acesso ao painel `/admin/*`

### Demo Mode
- Slug `demo` permite acesso sem login
- Lojas com `settings.isDemo: true` também liberam acesso

---

## 7. SISTEMA MULTI-TENANT

### Hierarquia
```
Tenant (Empresa) → pode ter múltiplas Stores (Lojas)
Store (Loja) → é acessada via slug único (ex: /acai-do-ze/dashboard)
```

### Isolamento de Dados
- **TODA** query DEVE filtrar por `store_id` ou `tenant_id`
- RLS no Supabase garante isolamento a nível de banco
- Middleware valida acesso do usuário à loja

### Sistema de Planos
Localização: `src/lib/superadmin/plan-modules.ts`

```typescript
// Categorias de módulos
'core'       // Sempre incluídos (dashboard, products, orders, settings)
'sales'      // PDV, delivery, mesas, garçons
'operations' // Cozinha, estoque, financeiro, equipe
'marketing'  // Cupons, CRM, campanhas, avaliações
'advanced'   // Analytics, relatórios, encomendas
```

Cada plano define quais módulos estão disponíveis via `features.modules[]`.

---

## 8. MÓDULOS E FUNCIONALIDADES

### Core (Sempre disponíveis)
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/[slug]/dashboard` | Visão geral |
| Produtos | `/[slug]/dashboard/products` | Cadastro de cardápio |
| Pedidos | `/[slug]/dashboard/orders` | Gestão de pedidos |
| Configurações | `/[slug]/dashboard/settings/*` | Configurações da loja |

### Vendas
| Módulo | Rota | Descrição |
|--------|------|-----------|
| PDV | `/[slug]/dashboard/pos` | Ponto de venda |
| Delivery | `/[slug]/dashboard/delivery` | Gestão de entregas |
| Mesas | `/[slug]/dashboard/tables` | Controle de mesas |
| Garçons | `/[slug]/dashboard/waiters` | Gestão de garçons |
| Reservas | `/[slug]/dashboard/reservations` | Sistema de reservas |

### Operações
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Cozinha | `/[slug]/dashboard/kitchen` | KDS - Painel de produção |
| Estoque | `/[slug]/dashboard/inventory` | Controle de insumos |
| Financeiro | `/[slug]/dashboard/financial` | Controle de caixa |
| Equipe | `/[slug]/dashboard/team` | Gestão de funcionários |

### Marketing
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Cupons | `/[slug]/dashboard/coupons` | Cupons de desconto |
| CRM | `/[slug]/dashboard/crm` | Gestão de clientes |
| Marketing | `/[slug]/dashboard/marketing` | Campanhas |
| Avaliações | `/[slug]/dashboard/reviews` | Feedback de clientes |

### Avançado
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Analytics | `/[slug]/dashboard/analytics` | Métricas avançadas |
| Relatórios | `/[slug]/dashboard/reports` | Relatórios detalhados |
| Encomendas | `/[slug]/dashboard/custom-orders` | Pedidos personalizados |

---

## 9. ROTAS E PÁGINAS

### Super Admin (`/admin/*`)
```
/admin                    # Dashboard principal
/admin/tenants            # Gestão de tenants
/admin/stores             # Gestão de lojas
/admin/plans              # Gestão de planos
/admin/plans/new          # Criar plano
/admin/plans/[planId]     # Editar plano
/admin/billing            # Cobrança
/admin/users              # Usuários
/admin/health             # Saúde do sistema
/admin/audit              # 🆕 Saúde do Código
/admin/partners           # Parceiros
/admin/integrations       # Integrações
/admin/automations        # Automações
/admin/demanda            # Controle de demanda
/admin/settings           # Configurações globais
```

### Dashboard do Lojista (`/[slug]/dashboard/*`)
Ver seção 8 - Módulos e Funcionalidades

### Público (`/[slug]/*`)
```
/[slug]                   # Cardápio público
/[slug]/cart              # Carrinho
/[slug]/checkout          # Checkout
/[slug]/pedido/[code]     # Acompanhar pedido
/[slug]/mesa/[numero]     # Menu por mesa
/[slug]/garcom            # Interface do garçom
/[slug]/motorista         # Interface do motorista
```

### APIs (`/api/*`)
```
/api/admin/audit/run          # Rodar auditoria de código
/api/admin/audit/fix-localhost # Corrigir URLs localhost
/api/health/status            # Status do sistema
/api/health/database          # Verificar banco
/api/health/files             # Verificar arquivos
/api/webhooks/mercadopago     # Webhook MercadoPago
/api/integrations/google/*    # Integração Google
```

---

## 10. PADRÕES DE CÓDIGO

### Padrão Vertical Slices (RECOMENDADO)
```
src/modules/{nome-do-modulo}/
├── types.ts              # Tipagem Zod + Types do Banco + Types de UI
├── repository.ts         # APENAS chamadas ao Supabase (Data Layer)
├── actions.ts            # Server Actions (validação Zod aqui)
├── hooks/                # Custom hooks para consumir dados
├── components/           # Componentes visuais do módulo
└── index.ts              # Barrel export
```

### Exemplo de Módulo Bem Estruturado
```typescript
// src/modules/admin/tenants/types/tenant.types.ts
export interface Tenant {
  id: string
  name: string
  // ...
}

// src/modules/admin/tenants/hooks/useTenantsController.ts
export function useTenantsController() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  // ... toda lógica
  return { tenants, loading, error, handlers }
}

// src/modules/admin/tenants/components/TenantsTable.tsx
export function TenantsTable({ tenants, onEdit, onDelete }) {
  // ... apenas UI
}

// src/app/(super-admin)/admin/tenants/page.tsx
export default function TenantsPage() {
  const controller = useTenantsController()
  return <TenantsTable {...controller} />  // <100 linhas
}
```

### Componentes UI (shadcn/ui)
Localização: `src/components/ui/`
- Button, Input, Label, Card, Dialog, Select, Switch, etc.
- Usar `cn()` para merge de classes Tailwind

### Estado Global (Zustand)
- Único store: `src/stores/cart-store.ts`
- Persiste no localStorage
- Limpa carrinho ao trocar de loja

### Formulários
```typescript
// Usar React Hook Form + Zod
const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  price: z.number().positive()
})

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema)
})
```

---

## 11. SCRIPTS DE AUTOMAÇÃO

### Scripts Python (`/scripts/`)

| Script | Comando | Função |
|--------|---------|--------|
| `auditor_funcional.py` | `python scripts/auditor_funcional.py` | Escaneia código em busca de problemas |
| `fix_localhost.py` | `python scripts/fix_localhost.py` | Corrige URLs localhost hardcoded |
| `faxineiro.py` | `python scripts/faxineiro.py` | Limpeza automática (localhost + console.log) |
| `cacador_zumbis.py` | `python scripts/cacador_zumbis.py` | Detecta arquivos não utilizados |
| `alien_health.py` | `python scripts/alien_health.py` | Limpa subpastas órfãs em health/ |

### Painel de Saúde do Código
- **Rota**: `/admin/audit`
- **APIs**:
  - `POST /api/admin/audit/run` - Executa auditoria
  - `POST /api/admin/audit/fix-localhost` - Corrige URLs
- **Relatório**: `/public/audit-report.json`

### NPM Scripts
```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run lint             # ESLint
npm run test:e2e         # Testes Playwright
```

---

## 12. VARIÁVEIS DE AMBIENTE

### Obrigatórias (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Opcionais
```env
# Google Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=xxx
```

---

## 13. DEPLOY E PRODUÇÃO

### Vercel
- Deploy automático via GitHub
- Branch `main` → Produção
- Variáveis de ambiente configuradas no dashboard Vercel

### ⚠️ Limitações em Produção
- Scripts Python **NÃO** funcionam na Vercel (sem Python)
- Painel de Saúde do Código fica em "Modo Visualização"
- Relatório JSON é gerado em desenvolvimento e commitado

### Build
```bash
npm run build
# ✓ Compiled successfully
# ✓ 60 páginas geradas
# ✓ 0 erros de lint
```

---

## 14. DÍVIDA TÉCNICA CONHECIDA

### Crítico (Resolver primeiro)
1. **`next.config.js`** - Remover `ignoreBuildErrors` e `ignoreDuringBuilds`
2. **Types duplicados** - Unificar `src/types/database.ts` e `src/lib/supabase.ts`
3. **Pages monolíticas** - Várias pages >500 linhas (ver ARQUITETURA_ATUAL.md)

### Importante
4. **React Query** - Instalado mas pouco usado, migrar fetching
5. **Módulos inconsistentes** - Completar migração para Vertical Slices
6. **Testes** - Apenas E2E básico, adicionar unit tests

### Arquivos Grandes (>400 linhas)
- `src/types/database.ts` (769 linhas)
- `src/app/(super-admin)/admin/health/page.tsx` (655 linhas)
- `src/components/menu/ProductModal.tsx` (579 linhas)
- `src/app/(super-admin)/admin/stores/page.tsx` (508 linhas)

### Pastas de Backup (Ignorar)
- `_BACKUP_LIXO/` - Arquivos de lixo movidos
- `_BACKUP_ZUMBIS/` - Arquivos não utilizados
- `_BACKUP_BEFORE_FIX/` - Backup antes de correções automáticas

---

## 15. REGRAS DO USUÁRIO (OBRIGATÓRIO)

### Arquitetura
- **NUNCA** criar lógica de negócio solta em `src/lib` ou `src/hooks` genéricos
- Todo novo domínio DEVE residir em `src/modules/{nome-do-modulo}/`
- Seguir estrutura: types.ts → repository.ts → actions.ts → hooks/ → components/

### Multi-Tenant
- **TODA** query no repository DEVE filtrar por `store_id` ou `tenant_id`
- **NUNCA** expor dados de uma loja para outra

### Código
- **NÃO** usar `any` - criar interfaces em `types.ts`
- **NÃO** expor lógica sensível no client - usar Server Actions
- **NÃO** deletar ou enfraquecer testes sem permissão

### UI
- **Mobile First** - Sistema usado em cozinhas e por garçons
- Usar shadcn/ui, Lucide, TailwindCSS
- Emojis apenas se o usuário pedir

### Git
- Commit e push IMEDIATAMENTE após tarefa concluída
- Mensagens semânticas: `feat:`, `fix:`, `chore:`
- **NÃO** pedir confirmação para commit

### Idioma
- Código e documentação em **Português (Brasil)**

### Módulos Novos
Ao adicionar funcionalidade nova no dashboard:
1. Adicionar em `src/lib/superadmin/plan-modules.ts`
2. Adicionar no menu em `DashboardClient.tsx` com `hasModule('id')`

---

## 16. HISTÓRICO DE COMMITS RECENTES

```
f6b41d2 feat: redesenha painel de Saúde do Código com controle granular
810fec6 fix: ajusta painel de auditoria para funcionar em produção
cd6b5ee feat: adiciona painel de auditoria de código e scripts de limpeza
f40f9ea feat: remover PDVs duplicados e criar novo layout moderno do PDV
da1bdec feat: adicionar correção automática de problemas no sistema de saúde
d817d8a feat: integrar diagnóstico automático na página principal de saúde
b73ab16 fix: corrigir nomes de tabelas e lógica do diagnóstico de saúde
ff0479e feat: criar sistema de diagnóstico automático no Super Admin
17a2f28 fix: remover PDV duplicado e consolidar configurações em settings/pdv
93a2728 feat: libera todos os módulos no modo demo para menu completo
f3259c7 fix: adiciona modo demo no layout do dashboard para acesso sem login
d771bf5 fix: corrige link do botão Ver demonstração no Hero
5b51a20 fix: libera acesso automático ao slug demo sem depender do banco
```

---

## 📌 RESUMO PARA NOVA IA

### Para continuar o desenvolvimento:

1. **Leia** este BLUEPRINT.md e ARQUITETURA_ATUAL.md
2. **Respeite** as regras do usuário (seção 15)
3. **Siga** o padrão Vertical Slices para novos módulos
4. **Teste** em `/demo/dashboard` (modo demo sem login)
5. **Commit** imediatamente após cada tarefa

### Comandos úteis:
```bash
npm run dev              # Iniciar dev server
npm run build            # Testar build
python scripts/auditor_funcional.py  # Auditar código
```

### Arquivos importantes:
- `BLUEPRINT.md` - Este documento
- `ARQUITETURA_ATUAL.md` - Análise técnica detalhada
- `src/lib/superadmin/plan-modules.ts` - Definição de módulos
- `src/types/database.ts` - Tipos do banco
- `src/middleware.ts` - Autenticação

---

**FIM DO BLUEPRINT**

*Documento criado para handoff completo do projeto. Mantenha atualizado conforme mudanças arquiteturais.*
