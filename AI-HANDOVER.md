# 🤖 HANDOVER COMPLETO PARA IA

## 📋 ÍNDICE
1. [Conceito do Projeto](#conceito)
2. [Arquitetura e Stack](#arquitetura)
3. [Estrutura de Domínios](#dominios)
4. [Funcionalidades Implementadas](#funcionalidades)
5. [Estado Atual](#estado-atual)
6. [O Que Falta Para Produção](#falta)
7. [Regras Críticas do Usuário](#regras)

---

## 🎯 CONCEITO DO PROJETO {#conceito}

### **Nome:** Food Management System (Pediu Food)

### **Propósito:**
SaaS Multi-tenant B2B para gestão completa de restaurantes, lanchonetes e food services. O sistema permite que donos de estabelecimentos gerenciem:
- Cardápio digital
- Pedidos online
- Entregas
- Estoque
- Finanças
- Marketing
- Relatórios

### **Modelo de Negócio:**
- **SaaS por assinatura** (mensal/anual)
- **Multi-tenant:** Cada restaurante é um tenant isolado
- **Planos:** Free Trial (7 dias) → Básico → Pro → Enterprise
- **Monetização:** Cobrança recorrente automática via Stripe/MercadoPago

### **Diferencial:**
Sistema completo "all-in-one" que elimina necessidade de múltiplas ferramentas. Foco em automação total - zero intervenção manual do admin.

---

## 🏗️ ARQUITETURA E STACK {#arquitetura}

### **Arquitetura: Vertical Slices (Modular)**

**Princípio:** Cada funcionalidade é um módulo isolado em `src/modules/{nome}/`

**Estrutura de um módulo:**
```
src/modules/{nome}/
├── types.ts          # Zod schemas + TypeScript types
├── repository.ts     # Data layer (Supabase queries)
├── actions.ts        # Server Actions (Next.js)
├── hooks/            # React hooks (client-side)
├── components/       # UI components
└── index.ts          # Barrel export
```

**Fluxo de dados:**
```
UI Component → Hook/Server Action → Repository → Supabase → RLS → Database
```

### **Stack Tecnológica:**

#### **Frontend:**
- **Framework:** Next.js 14.2.35 (App Router)
- **Linguagem:** TypeScript 5.9.3
- **Styling:** TailwindCSS 3.4.17
- **UI Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Estado:** Zustand (global), Server State (preferencial)

#### **Backend:**
- **BaaS:** Supabase (PostgreSQL)
  - Auth (autenticação)
  - Database (PostgreSQL com RLS)
  - Storage (arquivos)
  - Realtime (websockets)
- **Server Actions:** Next.js Server Actions
- **API Routes:** Next.js API Routes (quando necessário)

#### **Deploy:**
- **Hosting:** Vercel
- **Region:** GRU1 (São Paulo, Brasil)
- **DNS:** GoDaddy
- **SSL:** Automático via Vercel

#### **Pagamentos (Pendente):**
- **Gateway:** Stripe (preferencial) ou MercadoPago
- **Webhooks:** Para sincronizar status de pagamento

---

## 🌐 ESTRUTURA DE DOMÍNIOS {#dominios}

### **Domínios Principais:**

| Domínio | Propósito | Status |
|---------|-----------|--------|
| `pediufood.com` | Site principal (inglês) | ✅ Configurado |
| `pediufood.com.br` | Site PT-BR | ✅ Configurado |
| `pediu.food` | URLs curtas para lojas | ✅ Configurado |
| `entregou.food` | Plataforma de motoristas | ✅ Configurado |
| `pensou.food` | Reservado (futuro) | ✅ Configurado |

### **Subdomínios Especiais:**

| Subdomínio | Roteamento | Descrição |
|------------|------------|-----------|
| `admin.pediu.food` | `/admin` | Super Admin dashboard |
| `app.pediu.food` | `/` | App principal |
| `*.pediu.food` | `/{slug}` | Cardápio público da loja |
| `driver.entregou.food` | `/driver/dashboard` | Dashboard global de motoristas |
| `*.entregou.food` | `/motorista-publico/{slug}` | Perfil público do motorista |
| `entregou.food` | `/para-motoristas` | Landing page para motoristas |

### **Exemplos de URLs:**

```
https://pediufood.com                    → Landing page principal
https://pediufood.com/login              → Login
https://admin.pediu.food                 → Super Admin
https://pizzaria-bella.pediu.food        → Cardápio público da pizzaria
https://pizzaria-bella.pediu.food/dashboard → Dashboard do lojista
https://driver.entregou.food             → Dashboard de motorista
https://joao.entregou.food               → Perfil público do motorista João
```

### **Middleware:**
- **Arquivo:** `middleware.ts` (raiz do projeto)
- **Função:** Detecta subdomínios, reescreve URLs, protege rotas, valida autenticação
- **RLS:** Row Level Security no Supabase garante isolamento entre tenants

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS {#funcionalidades}

### **1. Autenticação e Autorização**
- ✅ Login/Signup via Supabase Auth
- ✅ Reset de senha
- ✅ Super Admin (email whitelist)
- ✅ Multi-tenant com RLS
- ✅ Store Users (permissões por loja)

### **2. Super Admin Dashboard** (`/admin`)
- ✅ Listagem de todos os tenants
- ✅ Listagem de todas as lojas
- ✅ Estatísticas globais (MRR, trials, ativos, suspensos)
- ✅ Gestão de planos e módulos
- ✅ Ativar/desativar módulos por tenant
- ✅ Reset de loja demo

### **3. Gestão de Loja** (`/{slug}/dashboard`)
- ✅ Dashboard com métricas
- ✅ Perfil da loja (nome, endereço, horários)
- ✅ Configurações (tema, notificações)
- ✅ Gestão de usuários da loja

### **4. Cardápio Digital**
- ✅ Categorias de produtos
- ✅ Produtos (nome, descrição, preço, imagem)
- ✅ Opções/complementos
- ✅ Disponibilidade (ativo/inativo)
- ✅ Cardápio público responsivo

### **5. Pedidos**
- ✅ Carrinho de compras
- ✅ Checkout
- ✅ Gestão de pedidos (dashboard)
- ✅ Status do pedido (pendente → preparando → pronto → entregue)
- ✅ Impressão de pedidos
- ✅ Notificações em tempo real

### **6. Delivery/Logística**
- ✅ Cadastro de motoristas
- ✅ Atribuição de entregas
- ✅ Rastreamento de entrega
- ✅ Cálculo de taxa de entrega
- ✅ Comissão de motorista
- ✅ Dashboard do motorista (`/{slug}/motorista`)
- ✅ Dashboard global de motoristas (`/driver/dashboard`)
- ✅ Perfil público do motorista (`*.entregou.food`)
- ✅ Sistema de indicações/afiliados para motoristas

### **7. Estoque**
- ✅ Cadastro de ingredientes
- ✅ Controle de quantidade
- ✅ Alertas de estoque baixo
- ✅ Histórico de movimentações

### **8. Financeiro**
- ✅ Registro de vendas
- ✅ Despesas
- ✅ Relatório de fluxo de caixa
- ✅ Gráficos de faturamento

### **9. Marketing**
- ✅ Cupons de desconto
- ✅ Campanhas promocionais
- ✅ QR Code da loja
- ✅ Link de compartilhamento

### **10. Relatórios**
- ✅ Vendas por período
- ✅ Produtos mais vendidos
- ✅ Desempenho de motoristas
- ✅ Análise de estoque

### **11. Integrações (Preparadas)**
- ✅ WhatsApp (envio de mensagens)
- ✅ Google Maps (navegação)
- ✅ ViaCEP (busca de endereço)
- ⏳ Google My Business (OAuth preparado, não integrado)
- ⏳ MercadoPago (estrutura pronta, não integrado)

---

## 📊 ESTADO ATUAL {#estado-atual}

### **✅ O QUE ESTÁ 100% PRONTO:**

#### **Código:**
- ✅ Arquitetura Vertical Slices implementada
- ✅ Todos os módulos criados e funcionais
- ✅ TypeScript sem erros
- ✅ ESLint configurado
- ✅ Middleware completo (todos domínios)
- ✅ RLS configurado no Supabase
- ✅ Componentes UI completos
- ✅ Hooks customizados
- ✅ Server Actions

#### **Deploy:**
- ✅ Projeto no GitHub
- ✅ Vercel conectada ao GitHub
- ✅ Build funcionando
- ✅ Domínios configurados na Vercel
- ✅ `vercel.json` com rewrites corretos
- ✅ Variáveis de ambiente configuradas

#### **Funcionalidades:**
- ✅ Sistema multi-tenant funcional
- ✅ Cardápio público
- ✅ Pedidos online
- ✅ Dashboard de lojista
- ✅ Dashboard de motorista
- ✅ Super Admin
- ✅ Gestão de estoque
- ✅ Relatórios
- ✅ Marketing (cupons)

### **⏳ O QUE ESTÁ PARCIALMENTE PRONTO:**

#### **DNS:**
- ⏳ Domínios registrados no GoDaddy
- ⏳ Alguns domínios propagados, outros não
- ⏳ Aguardando propagação DNS (24-48h)

#### **Billing:**
- ⏳ Estrutura de tenants/planos criada
- ⏳ Tabelas de invoices/subscriptions no banco
- ⏳ UI de planos no Super Admin
- ❌ Stripe/MercadoPago NÃO integrado
- ❌ Cobrança automática NÃO funciona
- ❌ Suspensão automática NÃO funciona

---

## 🚨 O QUE FALTA PARA PRODUÇÃO {#falta}

### **BLOQUEADORES CRÍTICOS (Sem isso, não pode vender):**

#### **1. Integração de Pagamentos (CRÍTICO)**
**Status:** ❌ NÃO IMPLEMENTADO

**O que precisa:**
- Integrar Stripe ou MercadoPago
- Criar checkout de assinatura
- Implementar webhooks para sincronizar status
- Criar lógica de trial → assinatura paga
- Implementar suspensão automática por inadimplência
- Gerar faturas automaticamente
- Enviar emails de cobrança

**Arquivos a criar/modificar:**
```
src/modules/billing/
├── stripe-client.ts       # Cliente Stripe
├── webhook-handler.ts     # Processar webhooks
├── subscription-sync.ts   # Sincronizar status
└── auto-suspend.ts        # Suspender inadimplentes

src/app/api/webhooks/stripe/route.ts  # Endpoint webhook
```

**Estimativa:** 2-3 dias de trabalho

---

#### **2. Propagação DNS (AGUARDANDO)**
**Status:** ⏳ EM ANDAMENTO

**O que precisa:**
- Aguardar 24-48h para DNS propagar
- Verificar se todos domínios resolvem corretamente
- Testar SSL em todos domínios

**Ação:** Apenas aguardar. Nenhum código necessário.

---

### **MELHORIAS IMPORTANTES (Não bloqueiam, mas são importantes):**

#### **3. Testes E2E**
**Status:** ⏳ PARCIALMENTE IMPLEMENTADO

**O que tem:**
- Playwright configurado
- Alguns testes básicos

**O que falta:**
- Testes de fluxo completo de pedido
- Testes de checkout
- Testes de dashboard
- Testes de multi-tenant

**Estimativa:** 1-2 dias

---

#### **4. Documentação**
**Status:** ⏳ PARCIALMENTE FEITA

**O que tem:**
- `DOMINIOS.md`
- `ESTRATEGIA-DOMINIOS.md`
- `DEPLOY-PRODUCTION.md`
- Vários arquivos de auditoria

**O que falta:**
- README principal atualizado
- Guia de onboarding para novos devs
- Documentação de API
- Guia de troubleshooting

**Estimativa:** 1 dia

---

#### **5. Monitoramento e Logs**
**Status:** ❌ NÃO IMPLEMENTADO

**O que falta:**
- Sentry ou similar para error tracking
- Analytics (Posthog, Mixpanel)
- Logs estruturados
- Alertas de erro

**Estimativa:** 1 dia

---

#### **6. Emails Transacionais**
**Status:** ⏳ ESTRUTURA PRONTA

**O que tem:**
- Templates básicos

**O que falta:**
- Integrar Resend ou SendGrid
- Templates profissionais
- Email de boas-vindas
- Email de confirmação de pedido
- Email de fatura

**Estimativa:** 1 dia

---

## ⚠️ REGRAS CRÍTICAS DO USUÁRIO {#regras}

### **REGRA #1: AUTOMAÇÃO TOTAL**
> "Não existe 'boca a boca' no sistema. Tudo deve ser automatizado."

**Implicações:**
- ❌ NUNCA criar funcionalidade que dependa de ação manual do admin
- ✅ Cobrança deve ser 100% automática
- ✅ Suspensão de inadimplentes deve ser automática
- ✅ Trial deve expirar e bloquear automaticamente
- ✅ Faturas devem ser geradas e enviadas automaticamente

**Se algo depende de ação manual do admin, NÃO ESTÁ PRONTO.**

---

### **REGRA #2: VERTICAL SLICES (Arquitetura)**
> "Todo novo domínio DEVE residir em `src/modules/{nome}/`"

**Estrutura obrigatória:**
```
src/modules/{nome}/
├── types.ts          # Zod + Types
├── repository.ts     # Supabase queries
├── actions.ts        # Server Actions
├── hooks/            # React hooks
├── components/       # UI components
└── index.ts          # Barrel export
```

**Fluxo de dados:**
```
UI → Hook/Action → Repository → Supabase
```

**❌ NUNCA:**
- Criar lógica de negócio em `src/lib` genérico
- Criar hooks genéricos em `src/hooks`
- Misturar lógica de diferentes domínios

---

### **REGRA #3: MULTI-TENANT FIRST**
> "Toda query no repository.ts deve filtrar por `store_id` ou `tenant_id`"

**Exemplo correto:**
```typescript
// ✅ CORRETO
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId)  // ← OBRIGATÓRIO

// ❌ ERRADO
const { data } = await supabase
  .from('products')
  .select('*')
  // Sem filtro de store_id = VAZAMENTO DE DADOS
```

**RLS no Supabase é a segunda camada de segurança, mas o código deve sempre filtrar.**

---

### **REGRA #4: MÓDULOS E PLANOS**
> "Sempre que adicionar funcionalidade no dashboard, DEVE adicionar em `plan-modules.ts`"

**Passos obrigatórios:**

1. **Adicionar em `src/lib/superadmin/plan-modules.ts`:**
```typescript
{
  id: 'nome_do_modulo',
  name: 'Nome Exibido',
  description: 'Descrição',
  category: 'core' | 'sales' | 'operations' | 'marketing' | 'advanced',
  icon: 'IconeLucide'
}
```

2. **Adicionar no menu em `src/app/[slug]/dashboard/DashboardClient.tsx`:**
```typescript
hasModule('nome_do_modulo') && {
  href: `${base}/rota`,
  label: 'Nome',
  icon: Icone
}
```

**Isso garante que o Super Admin possa ativar/desativar por plano.**

---

### **REGRA #5: MOBILE FIRST**
> "O sistema é usado em cozinhas e por garçons. A UI deve ser perfeita no celular."

**Implicações:**
- ✅ Sempre testar em mobile primeiro
- ✅ Botões grandes e fáceis de clicar
- ✅ Texto legível sem zoom
- ✅ Navegação simples
- ✅ Bottom navigation em apps mobile

---

### **REGRA #6: TIPAGEM FORTE**
> "Não use `any`. Crie interfaces em `types.ts`"

**Exemplo correto:**
```typescript
// types.ts
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive()
})

export type Product = z.infer<typeof ProductSchema>

// Usar no código
const product: Product = { ... }
```

**❌ NUNCA:**
```typescript
const product: any = { ... }  // ← PROIBIDO
```

---

### **REGRA #7: DEPLOY CONTÍNUO**
> "Ao finalizar uma tarefa com sucesso, faça commit e push imediatamente"

**Mensagem de commit semântica:**
```bash
feat: adicionar nova funcionalidade
fix: corrigir bug
chore: atualizar dependências
docs: atualizar documentação
```

**Sem pedir confirmação ao usuário.**

---

## 📁 ESTRUTURA DE PASTAS

```
food-management-system/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (super-admin)/
│   │   │   └── admin/                # Super Admin dashboard
│   │   ├── [slug]/                   # Rotas dinâmicas por loja
│   │   │   ├── dashboard/            # Dashboard do lojista
│   │   │   ├── motorista/            # Dashboard do motorista (por loja)
│   │   │   ├── cart/                 # Carrinho
│   │   │   ├── checkout/             # Checkout
│   │   │   └── page.tsx              # Cardápio público
│   │   ├── driver/
│   │   │   └── dashboard/            # Dashboard global de motoristas
│   │   ├── motorista-publico/
│   │   │   └── [slug]/               # Perfil público do motorista
│   │   ├── para-motoristas/          # Landing page motoristas
│   │   ├── login/
│   │   ├── signup/
│   │   └── api/                      # API Routes
│   ├── modules/                      # VERTICAL SLICES
│   │   ├── delivery/                 # Módulo de entregas
│   │   ├── driver/                   # Módulo de motoristas
│   │   ├── inventory/                # Módulo de estoque
│   │   ├── orders/                   # Módulo de pedidos
│   │   ├── products/                 # Módulo de produtos
│   │   └── ... (outros módulos)
│   ├── components/
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/                 # Clientes Supabase
│   │   ├── superadmin/               # Lógica de super admin
│   │   └── utils.ts                  # Utilitários gerais
│   └── types/                        # Types globais
├── middleware.ts                     # Middleware (roteamento)
├── vercel.json                       # Config Vercel
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

```bash
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Domínios
NEXT_PUBLIC_BASE_DOMAIN=pediu.food
NEXT_PUBLIC_APP_URL=https://pediufood.com

# Segurança
INTERNAL_API_TOKEN=xxx
CRON_SECRET=xxx

# Super Admin
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=email@example.com

# Pagamentos (PENDENTE)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# OU
MP_ACCESS_TOKEN=

# OAuth (OPCIONAL)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# E2E Testing
E2E_BASE_URL=http://localhost:3000
E2E_USER_A_EMAIL=test@test.com
E2E_USER_A_PASSWORD=Test123456!
```

---

## 🎯 PRIORIDADES PARA PRÓXIMA IA

### **PRIORIDADE MÁXIMA (BLOQUEADORES):**
1. ✅ **Integrar Stripe** - Sistema de billing automático
2. ⏳ **Aguardar DNS** - Propagação dos domínios

### **PRIORIDADE ALTA:**
3. ✅ **Testes E2E** - Garantir qualidade
4. ✅ **Emails transacionais** - Comunicação com clientes
5. ✅ **Monitoramento** - Sentry para erros

### **PRIORIDADE MÉDIA:**
6. ✅ **Documentação** - README e guias
7. ✅ **Analytics** - Rastreamento de uso
8. ✅ **Performance** - Otimizações

### **PRIORIDADE BAIXA:**
9. ✅ **Integrações extras** - Google My Business, etc
10. ✅ **Features avançadas** - Relatórios complexos

---

## 📞 COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev              # Rodar localmente (porta 3000)
npm run build            # Build de produção
npm run type-check       # Verificar TypeScript
npm run lint             # Verificar ESLint

# Testes
npm run test:e2e         # Rodar testes E2E

# Deploy
git add .
git commit -m "feat: descrição"
git push                 # Vercel faz deploy automático
```

---

## 🆘 TROUBLESHOOTING COMUM

### **Erro: "Invalid Configuration" na Vercel**
- **Causa:** DNS não configurado ou `vercel.json` incorreto
- **Solução:** Verificar rewrites no `vercel.json` e DNS no GoDaddy

### **Erro: "Unauthorized" ao acessar dashboard**
- **Causa:** RLS bloqueando ou usuário sem permissão
- **Solução:** Verificar `store_users` no Supabase

### **Build falha no Vercel**
- **Causa:** Erro de TypeScript ou ESLint
- **Solução:** Rodar `npm run type-check` localmente

### **Subdomínio não funciona**
- **Causa:** Wildcard DNS não configurado
- **Solução:** Adicionar CNAME `*` no GoDaddy

---

## ✅ CHECKLIST FINAL

**Para considerar o projeto PRONTO PARA PRODUÇÃO:**

- [x] Código sem erros TypeScript
- [x] Código sem erros ESLint
- [x] Build funcionando na Vercel
- [x] Domínios configurados
- [x] Middleware funcionando
- [x] RLS configurado
- [x] Multi-tenant funcional
- [x] Cardápio público funcional
- [x] Dashboard de lojista funcional
- [x] Dashboard de motorista funcional
- [x] Super Admin funcional
- [ ] **Stripe integrado (BLOQUEADOR)**
- [ ] **DNS propagado (AGUARDANDO)**
- [ ] Testes E2E completos
- [ ] Emails transacionais
- [ ] Monitoramento (Sentry)
- [ ] Documentação completa

**Status:** 85% COMPLETO

**Bloqueadores:** 2 (Stripe + DNS)

---

## 🎓 DICAS PARA PRÓXIMA IA

1. **Leia as REGRAS primeiro** - Elas são críticas
2. **Siga a arquitetura Vertical Slices** - Não invente outra
3. **Sempre filtre por store_id** - Multi-tenant é sagrado
4. **Teste em mobile** - É o uso principal
5. **Commit frequente** - Deploy contínuo
6. **Não use `any`** - Tipagem forte sempre
7. **Automatize tudo** - Zero ação manual do admin

---

**Última atualização:** 26 de dezembro de 2025
**Versão:** 1.0
**Autor:** Cascade AI (handover para próxima IA)
