# 🤖 Auditoria Completa para Handoff de IA

**Data:** 13 de Dezembro de 2025  
**Versão:** 1.0  
**Objetivo:** Documentar completamente o estado do projeto para continuidade por outra IA

---

## 📋 ÍNDICE

1. [Mapa de URLs](#1-mapa-de-urls)
2. [Visão Geral do Projeto](#2-visão-geral-do-projeto)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura do Projeto](#4-estrutura-do-projeto)
5. [Banco de Dados](#5-banco-de-dados)
6. [Funcionalidades Implementadas](#6-funcionalidades-implementadas)
7. [Funcionalidades Pendentes](#7-funcionalidades-pendentes)
8. [Arquivos Críticos](#8-arquivos-críticos)
9. [Problemas Conhecidos](#9-problemas-conhecidos)
10. [Próximos Passos Prioritários](#10-próximos-passos-prioritários)
11. [Guia de Implementação](#11-guia-de-implementação)

---

## 1. MAPA DE URLs

### 🌐 Rotas Públicas (Sem Autenticação)

| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `/` | Página inicial / Landing page | `src/app/page.tsx` |
| `/[slug]` | Cardápio público da loja (ex: `/tropical-freeze`) | `src/app/[slug]/page.tsx` |
| `/[slug]/cart` | Carrinho de compras | `src/app/[slug]/cart/page.tsx` |
| `/[slug]/checkout` | Página de checkout | `src/app/[slug]/checkout/page.tsx` |
| `/[slug]/order/[orderId]` | Acompanhamento do pedido | `src/app/[slug]/order/[orderId]/page.tsx` |

### 🔐 Rotas de Autenticação

| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `/login` | Login de usuário | `src/app/(auth)/login/page.tsx` |
| `/signup` | Cadastro de novo usuário | `src/app/(auth)/signup/page.tsx` |
| `/reset-password` | Recuperação de senha | `src/app/(auth)/reset-password/page.tsx` |
| `/update-password` | Atualização de senha | `src/app/(auth)/update-password/page.tsx` |

### 📊 Dashboard da Loja (Requer Autenticação)

| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `/[slug]/dashboard` | Dashboard principal da loja | `src/app/[slug]/dashboard/page.tsx` |
| `/[slug]/dashboard/products` | Gestão de produtos | `src/app/[slug]/dashboard/products/page.tsx` |
| `/[slug]/dashboard/products/new` | Criar novo produto | `src/app/[slug]/dashboard/products/new/page.tsx` |
| `/[slug]/dashboard/products/[id]` | Editar produto | `src/app/[slug]/dashboard/products/[id]/page.tsx` |
| `/[slug]/dashboard/orders` | Lista de pedidos | `src/app/[slug]/dashboard/orders/page.tsx` |
| `/[slug]/dashboard/orders/[orderId]` | Detalhes do pedido | `src/app/[slug]/dashboard/orders/[orderId]/page.tsx` |
| `/[slug]/dashboard/kitchen` | Display da cozinha (KDS) | `src/app/[slug]/dashboard/kitchen/page.tsx` |
| `/[slug]/dashboard/delivery` | Gestão de entregas | `src/app/[slug]/dashboard/delivery/page.tsx` |
| `/[slug]/dashboard/pos` | Ponto de venda | `src/app/[slug]/dashboard/pos/page.tsx` |
| `/[slug]/dashboard/crm` | Gestão de clientes | `src/app/[slug]/dashboard/crm/page.tsx` |
| `/[slug]/dashboard/coupons` | Gestão de cupons | `src/app/[slug]/dashboard/coupons/page.tsx` |
| `/[slug]/dashboard/reports` | Relatórios | `src/app/[slug]/dashboard/reports/page.tsx` |
| `/[slug]/dashboard/team` | Gestão de equipe | `src/app/[slug]/dashboard/team/page.tsx` |
| `/[slug]/dashboard/team/invite` | Convidar membro | `src/app/[slug]/dashboard/team/invite/page.tsx` |
| `/[slug]/dashboard/settings` | Configurações da loja | `src/app/[slug]/dashboard/settings/page.tsx` |
| `/[slug]/dashboard/settings/checkout` | Config. de checkout | `src/app/[slug]/dashboard/settings/checkout/page.tsx` |
| `/[slug]/dashboard/settings/payments` | Config. de pagamentos | `src/app/[slug]/dashboard/settings/payments/page.tsx` |
| `/[slug]/dashboard/settings/features` | Funcionalidades | `src/app/[slug]/dashboard/settings/features/page.tsx` |
| `/[slug]/dashboard/onboarding` | Onboarding inicial | `src/app/[slug]/dashboard/onboarding/page.tsx` |

### 👑 Super Admin (Requer Role Super Admin)

| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `/admin` | Dashboard do super admin | `src/app/(super-admin)/page.tsx` |
| `/admin/analytics` | Analytics global | `src/app/(super-admin)/admin/analytics/page.tsx` |
| `/admin/stores` | Gestão de lojas | `src/app/(super-admin)/admin/stores/page.tsx` |
| `/admin/tenants` | Gestão de tenants | `src/app/(super-admin)/admin/tenants/page.tsx` |
| `/admin/users` | Gestão de usuários | `src/app/(super-admin)/admin/users/page.tsx` |
| `/admin/plans` | Gestão de planos | `src/app/(super-admin)/admin/plans/page.tsx` |
| `/admin/plans/new` | Criar novo plano | `src/app/(super-admin)/admin/plans/new/page.tsx` |
| `/admin/plans/[planId]` | Editar plano | `src/app/(super-admin)/admin/plans/[planId]/page.tsx` |
| `/admin/features` | Feature flags | `src/app/(super-admin)/admin/features/page.tsx` |
| `/admin/reports` | Relatórios globais | `src/app/(super-admin)/admin/reports/page.tsx` |
| `/admin/logs` | Logs do sistema | `src/app/(super-admin)/admin/logs/page.tsx` |
| `/admin/tickets` | Tickets de suporte | `src/app/(super-admin)/admin/tickets/page.tsx` |
| `/admin/settings` | Configurações globais | `src/app/(super-admin)/admin/settings/page.tsx` |
| `/admin/automations` | Automações | `src/app/(super-admin)/admin/automations/page.tsx` |

### 🔧 Rotas Especiais

| URL | Descrição | Arquivo |
|-----|-----------|---------|
| `/select-store` | Seleção de loja (multi-store) | `src/app/select-store/page.tsx` |
| `/unauthorized` | Página de não autorizado | `src/app/unauthorized/page.tsx` |
| `/qa` | Hub de QA (apenas desenvolvimento) | `src/app/qa/page.tsx` |

### 📝 Exemplo de URLs em Produção

Considerando a loja "Tropical Freeze" com slug `tropical-freeze`:

```
# Cliente
https://seudominio.com/tropical-freeze              → Cardápio
https://seudominio.com/tropical-freeze/cart         → Carrinho
https://seudominio.com/tropical-freeze/checkout     → Checkout
https://seudominio.com/tropical-freeze/order/abc123 → Acompanhar pedido

# Loja (autenticado)
https://seudominio.com/tropical-freeze/dashboard           → Dashboard
https://seudominio.com/tropical-freeze/dashboard/products  → Produtos
https://seudominio.com/tropical-freeze/dashboard/orders    → Pedidos
https://seudominio.com/tropical-freeze/dashboard/kitchen   → Cozinha
https://seudominio.com/tropical-freeze/dashboard/settings  → Configurações

# Super Admin
https://seudominio.com/admin          → Dashboard Admin
https://seudominio.com/admin/stores   → Gerenciar Lojas
https://seudominio.com/admin/tenants  → Gerenciar Tenants
```

---

## 2. VISÃO GERAL DO PROJETO

### O que é
Sistema SaaS multi-tenant para gestão de negócios de alimentação (restaurantes, lanchonetes, açaíterias, hamburguerias, etc.).

### Arquitetura Multi-Tenant
```
Tenant (Rede/Franquia)
  └── Store (Loja individual)
      ├── Users (Equipe com roles)
      ├── Categories (Categorias do cardápio)
      ├── Products (Produtos)
      ├── Orders (Pedidos)
      ├── Customers (Clientes finais)
      ├── Tables (Mesas para dine-in)
      └── Settings (Configurações da loja)
```

### Fluxos Principais
1. **Cliente**: Acessa cardápio via `/[slug]` → Adiciona ao carrinho → Checkout → Acompanha pedido
2. **Loja**: Dashboard → Gerencia produtos/pedidos/equipe → Cozinha prepara → Delivery entrega
3. **Super Admin**: Gerencia tenants/lojas/planos/usuários globalmente

### Status Atual
- **MVP Funcional**: 68% de maturidade
- **Pronto para**: Early adopters / Beta testing
- **NÃO pronto para**: Produção comercial (falta gateway de pagamento real)

---

## 3. STACK TECNOLÓGICA

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 14.2.18 | Framework (App Router) |
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.6.3 | Tipagem estática |
| **TailwindCSS** | 3.4.14 | Estilização |
| **shadcn/ui** | - | Componentes UI |
| **Lucide React** | 0.454.0 | Ícones |
| **Zustand** | 4.5.5 | Estado global (carrinho) |
| **React Query** | 5.59.16 | Cache de dados |
| **React Hook Form** | 7.68.0 | Formulários |
| **Zod** | 3.23.8 | Validação de schemas |
| **date-fns** | 4.1.0 | Manipulação de datas |

### Backend
| Tecnologia | Uso |
|------------|-----|
| **Supabase** | Database PostgreSQL |
| **Supabase Auth** | Autenticação |
| **Supabase Storage** | Armazenamento de imagens |
| **Supabase Realtime** | (Disponível, não usado ainda) |

### Arquivo `package.json`
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4",
    "@tanstack/react-query": "^5.59.16",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.454.0",
    "next": "14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.68.0",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.23.8",
    "zustand": "^4.5.5"
  }
}
```

---

## 4. ESTRUTURA DO PROJETO

```
food-management-system/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── reset-password/
│   │   │   └── update-password/
│   │   ├── (public)/                 # Rotas públicas (landing)
│   │   ├── (super-admin)/            # Painel administrativo global
│   │   │   └── admin/
│   │   │       ├── analytics/
│   │   │       ├── stores/
│   │   │       ├── tenants/
│   │   │       ├── users/
│   │   │       ├── plans/
│   │   │       ├── features/
│   │   │       ├── reports/
│   │   │       ├── logs/
│   │   │       ├── tickets/
│   │   │       ├── settings/
│   │   │       └── automations/
│   │   ├── [slug]/                   # Rotas dinâmicas por loja
│   │   │   ├── cart/                 # Carrinho
│   │   │   ├── checkout/             # Checkout
│   │   │   ├── order/                # Acompanhamento de pedido
│   │   │   └── dashboard/            # Dashboard da loja
│   │   │       ├── products/         # Gestão de produtos
│   │   │       ├── orders/           # Gestão de pedidos
│   │   │       ├── kitchen/          # Display cozinha (KDS)
│   │   │       ├── delivery/         # Gestão de entregas
│   │   │       ├── crm/              # Clientes
│   │   │       ├── pos/              # Ponto de venda
│   │   │       ├── reports/          # Relatórios
│   │   │       ├── coupons/          # Cupons de desconto
│   │   │       ├── team/             # Equipe
│   │   │       ├── settings/         # Configurações
│   │   │       └── onboarding/       # Onboarding
│   │   ├── qa/                       # Hub de QA (dev only)
│   │   ├── select-store/             # Seleção de loja
│   │   ├── unauthorized/             # Página de não autorizado
│   │   ├── layout.tsx                # Layout raiz
│   │   ├── page.tsx                  # Página inicial
│   │   ├── error.tsx                 # Tratamento de erros
│   │   ├── not-found.tsx             # Página 404
│   │   └── globals.css               # Estilos globais
│   ├── components/
│   │   ├── ui/                       # Componentes shadcn/ui
│   │   ├── layout/                   # Componentes de layout
│   │   ├── menu/                     # Componentes do cardápio
│   │   └── settings/                 # Componentes de configurações
│   ├── hooks/                        # Custom hooks
│   ├── lib/
│   │   ├── supabase/                 # Clientes Supabase
│   │   │   ├── client.ts             # Cliente browser
│   │   │   ├── server.ts             # Cliente server
│   │   │   └── middleware.ts         # Cliente middleware
│   │   ├── actions/                  # Server Actions
│   │   ├── coupons/                  # Lógica de cupons
│   │   ├── modifiers/                # Lógica de modificadores
│   │   ├── reports/                  # Lógica de relatórios
│   │   ├── superadmin/               # Lógica do super admin
│   │   ├── validations/              # Schemas de validação
│   │   ├── i18n.ts                   # Internacionalização
│   │   ├── utils.ts                  # Utilitários
│   │   └── settingsHelper.ts         # Helper de configurações
│   ├── stores/                       # Zustand stores
│   │   └── cartStore.ts              # Store do carrinho
│   └── types/
│       └── database.ts               # Tipos TypeScript do DB
├── supabase/
│   ├── schema.sql                    # Schema principal (~870 linhas)
│   ├── seed.sql                      # Dados de exemplo
│   ├── seed-modifiers.sql            # Dados de modificadores
│   └── seed-more-products.sql        # Mais produtos de exemplo
├── migrations/                       # Migrations incrementais
│   ├── 001_plans_and_subscriptions.sql
│   ├── 002_tenant_localization.sql
│   ├── 003_products_complete.sql
│   ├── 004_fix_categories_conflict.sql
│   ├── 005_delivery_improvements.sql
│   ├── 005_store_users_and_auth.sql
│   ├── 006_add_payment_status.sql
│   ├── 006_rls_policies.sql
│   ├── 007_coupons.sql
│   └── 008_modifiers_mvp.sql
├── docs/                             # Documentação
│   ├── AUDIT_*.md                    # Documentos de auditoria
│   ├── COUPONS.md
│   ├── MODIFIERS.md
│   └── ...
├── middleware.ts                     # Middleware Next.js
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 5. BANCO DE DADOS

### Tabelas Principais (29 tabelas)

#### Core
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `tenants` | Redes/franquias (multi-tenant root) | ✅ |
| `stores` | Lojas individuais | ✅ |
| `users` | Usuários do sistema (equipe) | ✅ |
| `store_users` | Associação usuário-loja com roles | ✅ |
| `store_settings` | Configurações por loja | ✅ |

#### Cardápio
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `categories` | Categorias de produtos | ✅ |
| `products` | Produtos do cardápio | ✅ |
| `modifier_groups` | Grupos de modificadores (adicionais) | ✅ |
| `modifier_options` | Opções de modificadores | ✅ |
| `product_modifier_groups` | Relação N:N produto-modificadores | ✅ |
| `product_combos` | Combos/kits | ✅ |
| `combo_items` | Itens dos combos | ✅ |

#### Pedidos
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `orders` | Pedidos | ✅ |
| `order_items` | Itens do pedido | ✅ |
| `order_item_modifiers` | Modificadores dos itens | ✅ |
| `order_events` | Timeline de eventos | ✅ |

#### Clientes e Delivery
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `customers` | Clientes finais | ✅ |
| `customer_addresses` | Endereços de entrega | ✅ |
| `deliveries` | Informações de entrega | ✅ |
| `tables` | Mesas (dine-in) | ✅ |

#### Financeiro
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `coupons` | Cupons de desconto | ✅ |
| `cash_registers` | Controle de caixa | ✅ |
| `cash_movements` | Movimentações de caixa | ✅ |

#### Sistema
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `notifications` | Notificações | ✅ |
| `internal_messages` | Mensagens internas | ✅ |
| `inventory_items` | Estoque | ✅ |
| `product_ingredients` | Ingredientes por produto | ✅ |
| `printers` | Impressoras térmicas | ✅ |
| `plans` | Planos de assinatura | ✅ |
| `tenant_subscriptions` | Assinaturas dos tenants | ✅ |

### ENUMs Disponíveis
```sql
store_niche_enum: 'acai', 'burger', 'hotdog', 'marmita', 'butcher', 'ice_cream', 'other'
store_mode_enum: 'store', 'home'
user_role_enum: 'OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'DELIVERY'
product_unit_type_enum: 'unit', 'weight'
order_channel_enum: 'COUNTER', 'DELIVERY', 'TAKEAWAY'
order_status_enum: 'PENDING', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
payment_method_enum: 'PIX', 'CASH', 'CARD', 'ONLINE'
order_event_type_enum: 'CREATED', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'NOTE'
notification_channel_enum: 'IN_APP', 'WHATSAPP', 'PUSH'
notification_status_enum: 'PENDING', 'SENT', 'FAILED'
discount_type_enum: 'percentage', 'fixed_amount'
```

### Schema Principal
Localização: `supabase/schema.sql` (~870 linhas)
- Inclui todas as tabelas, índices, triggers e RLS policies básicas
- Função `update_updated_at_column()` para atualização automática

---

## 6. FUNCIONALIDADES IMPLEMENTADAS

### ✅ Menu Público (80% completo)
- [x] Listagem de produtos por categoria
- [x] Busca de produtos
- [x] Visualização de detalhes do produto
- [x] Carrinho de compras (Zustand)
- [x] Checkout com formulário
- [x] Aplicação de cupons de desconto
- [x] Seleção de método de pagamento
- [x] Rastreamento de pedido
- [ ] Favoritos
- [ ] Histórico de pedidos do cliente
- [ ] Avaliações de produtos

### ✅ Gestão de Produtos (85% completo)
- [x] CRUD completo de produtos
- [x] Categorias com ordenação
- [x] Preços e unidades (unit/weight)
- [x] Imagens de produtos
- [x] Produtos ativos/inativos
- [x] Sistema de modificadores/adicionais
- [ ] Variações (tamanhos, sabores)
- [ ] Combos/promoções
- [ ] Gestão de ingredientes

### ✅ Gestão de Pedidos (75% completo)
- [x] Criação de pedidos
- [x] Status tracking (PENDING → DELIVERED)
- [x] Histórico completo
- [x] Filtros e busca
- [x] Detalhes completos do pedido
- [x] Timeline de eventos
- [ ] Edição de pedidos
- [ ] Notificações push
- [ ] Agendamento de pedidos

### ✅ Cozinha/KDS (70% completo)
- [x] Visualização de pedidos pendentes
- [x] Marcação de preparo
- [x] Marcação de pronto
- [x] Timer de preparo
- [x] Priorização
- [ ] Múltiplas estações
- [ ] Alertas sonoros
- [ ] Modo tablet/touch

### ✅ Delivery (65% completo)
- [x] Gestão de entregas
- [x] Status de entrega
- [x] Endereços de clientes
- [x] Taxa de entrega configurável
- [x] Tempo estimado
- [ ] Rastreamento em tempo real
- [ ] Integração com mapas
- [ ] App para entregador

### ✅ PDV (60% completo)
- [x] Criação rápida de pedidos
- [x] Múltiplos métodos de pagamento
- [x] Interface de balcão
- [ ] Integração com TEF
- [ ] Leitor de código de barras
- [ ] Gaveta de dinheiro

### ✅ CRM (50% completo)
- [x] Cadastro de clientes
- [x] Histórico de pedidos
- [x] Endereços
- [ ] Segmentação
- [ ] Campanhas de marketing
- [ ] Programa de fidelidade

### ✅ Cupons (90% completo)
- [x] CRUD de cupons
- [x] Tipos: percentual e valor fixo
- [x] Validade por data
- [x] Limite de usos
- [x] Valor mínimo do pedido
- [x] Validação automática
- [x] Aplicação no checkout
- [ ] Cupons por cliente específico
- [ ] Cupons de primeira compra

### ✅ Relatórios (40% completo)
- [x] Vendas por período
- [x] Produtos mais vendidos
- [x] Métodos de pagamento
- [ ] Dashboard em tempo real
- [ ] Gráficos interativos
- [ ] Exportação (PDF, Excel)

### ✅ Equipe (70% completo)
- [x] Gestão de membros
- [x] Roles (OWNER, MANAGER, CASHIER, KITCHEN, DELIVERY)
- [x] Convites
- [x] Permissões básicas
- [ ] Permissões granulares
- [ ] Comissões

### ✅ Configurações (85% completo)
- [x] Configurações da loja
- [x] Métodos de pagamento habilitados
- [x] Horários de funcionamento
- [x] Informações de contato
- [x] Checkout mode
- [x] Funcionalidades habilitadas/desabilitadas
- [ ] Temas customizados
- [ ] Domínio customizado

### ✅ Super Admin (50% completo)
- [x] Gestão de tenants
- [x] Gestão de lojas
- [x] Gestão de usuários
- [x] Planos e assinaturas
- [x] Analytics global
- [ ] Billing automático
- [ ] Feature flags
- [ ] Suporte/tickets funcional

---

## 7. FUNCIONALIDADES PENDENTES (CRÍTICAS)

### 🔴 BLOCKER - Impedem produção

#### 1. Gateway de Pagamento
**Status:** NÃO IMPLEMENTADO  
**Impacto:** Sistema não processa pagamentos reais  
**Solução:** Integrar Mercado Pago ou Stripe  
**Estimativa:** 4 semanas  
**Arquivos a criar:**
```
src/lib/payments/
├── mercadopago.ts       # SDK do Mercado Pago
├── webhook.ts           # Handler de webhooks
├── checkout.ts          # Lógica de checkout
└── types.ts             # Tipos de pagamento
src/app/api/payments/
├── create/route.ts      # Criar pagamento
├── webhook/route.ts     # Receber webhooks
└── status/route.ts      # Verificar status
```

#### 2. Testes Automatizados
**Status:** ZERO TESTES  
**Impacto:** Deploy arriscado, bugs não detectados  
**Solução:** Implementar Jest + Playwright  
**Estimativa:** 2 semanas  
**Arquivos a criar:**
```
__tests__/
├── unit/
│   ├── coupons.test.ts
│   ├── cart.test.ts
│   └── validations.test.ts
├── integration/
│   └── orders.test.ts
└── e2e/
    ├── checkout.spec.ts
    └── dashboard.spec.ts
```

#### 3. Observabilidade
**Status:** NÃO IMPLEMENTADO  
**Impacto:** Não detecta erros em produção  
**Solução:** Sentry + Logs estruturados  
**Estimativa:** 2 semanas  
**Arquivos a criar:**
```
src/lib/
├── sentry.ts            # Configuração Sentry
├── logger.ts            # Logger estruturado (Pino)
└── analytics.ts         # Tracking de eventos
```

### 🔴 HIGH - Importantes para produção

#### 4. Segurança Incompleta
- Algumas tabelas sem RLS completo
- Falta audit logs
- Falta rate limiting
- Falta verificação de role super_admin em algumas rotas

#### 5. Performance
- Muitas queries diretas sem cache
- React Query configurado mas não usado em todas páginas
- Falta índices em algumas tabelas

---

## 8. ARQUIVOS CRÍTICOS

### Configuração

| Arquivo | Descrição | Importância |
|---------|-----------|-------------|
| `.env.local` | Variáveis de ambiente | 🔴 CRÍTICO |
| `middleware.ts` | Proteção de rotas | 🔴 CRÍTICO |
| `next.config.js` | Config Next.js | ⚠️ ALTO |
| `tailwind.config.ts` | Config Tailwind | ⚠️ ALTO |

### Supabase Clients

| Arquivo | Uso |
|---------|-----|
| `src/lib/supabase/client.ts` | Client-side (browser) |
| `src/lib/supabase/server.ts` | Server-side (RSC, Server Actions) |
| `src/lib/supabase/middleware.ts` | Middleware (refresh token) |

### Variáveis de Ambiente (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# Adicionar para produção:
# SENTRY_DSN=xxx
# MERCADOPAGO_ACCESS_TOKEN=xxx
# MERCADOPAGO_PUBLIC_KEY=xxx
```

### Arquivos que Precisam Refatoração

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/app/[slug]/dashboard/settings/page.tsx` | 615 | Muito grande, dividir em componentes |

---

## 9. PROBLEMAS CONHECIDOS

### Bugs Ativos
1. **Nenhum bug crítico identificado** - Sistema funcional para MVP

### Débitos Técnicos
1. **Settings page muito grande** (615 linhas) - Refatorar
2. **Queries sem cache** - Implementar React Query em todas páginas
3. **Falta loading.tsx** - Adicionar para melhor UX
4. **Checkout mistura client/server** - Separar em Server Actions

### Limitações Conhecidas
1. Pagamentos são apenas simulados (sem gateway real)
2. Realtime do Supabase não utilizado (pedidos não atualizam automaticamente)
3. Notificações são apenas visuais (sem push/email/whatsapp)
4. Relatórios básicos (sem exportação)

---

## 10. PRÓXIMOS PASSOS PRIORITÁRIOS

### Sprint 1 (Semanas 1-2): Fundação

**Dias 1-2: Segurança**
```
[ ] Completar RLS policies em todas tabelas
[ ] Adicionar tabela audit_logs
[ ] Verificação de role super_admin no middleware
[ ] Rate limiting em endpoints sensíveis
```

**Dias 3-4: Performance**
```
[ ] Implementar React Query em todas páginas do dashboard
[ ] Adicionar índices faltantes no banco
[ ] Criar custom hooks para queries comuns
```

**Dia 5: Observabilidade**
```
[ ] Configurar Sentry
[ ] Implementar logger estruturado
[ ] Adicionar error boundaries
```

**Dias 6-10: Testes**
```
[ ] Configurar Jest
[ ] Testes unitários para lógica de cupons
[ ] Testes unitários para cálculos de carrinho
[ ] Configurar Playwright
[ ] Testes E2E do fluxo de checkout
```

### Sprint 2 (Semanas 3-4): Pagamentos

**Semana 3:**
```
[ ] Criar conta Mercado Pago
[ ] Implementar SDK
[ ] Criar endpoints de pagamento
[ ] Implementar webhooks
```

**Semana 4:**
```
[ ] PIX automático
[ ] Cartão de crédito
[ ] Testes de pagamento
[ ] Estorno automático
```

### Sprint 3 (Semanas 5-6): Polimento

```
[ ] Testes completos (80% coverage)
[ ] Documentação de usuário
[ ] Deploy staging
[ ] Beta testing
[ ] Ajustes finais
[ ] Deploy produção
```

---

## 11. GUIA DE IMPLEMENTAÇÃO

### Como Rodar o Projeto

```bash
# 1. Instalar dependências
cd C:\Users\User\CascadeProjects\food-management-system
npm install

# 2. Configurar variáveis de ambiente
# Criar/editar .env.local com credenciais Supabase

# 3. Rodar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build
npm start
```

### Como Aplicar Migrations

1. Acessar Supabase Dashboard → SQL Editor
2. Executar scripts na ordem:
   - `supabase/schema.sql` (se banco novo)
   - `migrations/001_*.sql` até `008_*.sql` (na ordem)
3. Para dados de exemplo: `supabase/seed.sql`

### Como Adicionar Nova Feature

1. **Criar tipos** em `src/types/database.ts`
2. **Criar migration** em `migrations/`
3. **Criar componentes** em `src/components/`
4. **Criar página** em `src/app/`
5. **Criar hooks** se necessário em `src/hooks/`
6. **Testar** localmente
7. **Commit e push** para deploy automático

### Padrões de Código

```typescript
// Componentes: PascalCase
export function ProductCard() {}

// Hooks: camelCase com use
export function useProducts() {}

// Server Actions: camelCase
export async function createOrder() {}

// Arquivos: kebab-case ou camelCase
// product-card.tsx ou ProductCard.tsx

// Variáveis banco: snake_case
// store_id, created_at, etc.
```

### Estrutura de Componente Padrão

```typescript
'use client' // Se precisar de interatividade

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  // Tipagem de props
}

export function MyComponent({ prop }: Props) {
  // Estado
  const [state, setState] = useState()
  
  // Handlers
  const handleClick = () => {}
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `docs/AUDIT_EXECUTIVE_SUMMARY.md` - Sumário executivo
- `docs/AUDIT_PRODUCT.md` - Auditoria de produto
- `docs/AUDIT_ROUTES_AND_PAGES.md` - Auditoria de rotas
- `docs/AUDIT_DATABASE.md` - Auditoria de banco de dados
- `docs/AUDIT_SECURITY.md` - Auditoria de segurança
- `docs/COUPONS.md` - Documentação de cupons
- `docs/MODIFIERS.md` - Documentação de modificadores
- `docs/RLS_MATRIX.md` - Matriz de políticas RLS

---

## 🎯 CHECKLIST PARA IA CONTINUAR

Antes de iniciar qualquer implementação, verificar:

```
[ ] Entender a estrutura multi-tenant (Tenant > Store)
[ ] Verificar se .env.local está configurado
[ ] Rodar npm run dev para testar
[ ] Verificar se banco Supabase está acessível
[ ] Ler documentação relevante em /docs
[ ] Identificar se tarefa afeta múltiplos módulos
[ ] Verificar se precisa migration no banco
[ ] Seguir padrões de código existentes
[ ] Testar localmente antes de commit
[ ] Fazer commit semântico (feat:, fix:, refactor:)
```

---

## 📞 INFORMAÇÕES DE ACESSO

### URLs
- **Local:** http://localhost:3000
- **Supabase:** https://app.supabase.com (verificar projeto)
- **Vercel:** Verificar se conectado

### Lojas de Teste
- `/tropical-freeze` - Loja de açaí de exemplo
- Verificar seed.sql para dados de teste

---

**FIM DO DOCUMENTO DE HANDOFF**

*Última atualização: 13 de Dezembro de 2025*
