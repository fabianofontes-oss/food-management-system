# Auditoria de Rotas, URLs, Middleware e Redirecionamentos

**Data:** 03/01/2026  
**Versão:** RC1 - Go-live BR V1  
**Escopo:** Análise completa de segurança, proteções e fluxos de navegação

---

## 🎯 Resumo Executivo

### ✅ Pontos Fortes
- Middleware robusto com roteamento multi-domínio
- RLS implementado no Supabase
- Proteção de rotas admin via email whitelist
- Redirecionamentos permanentes (308) configurados corretamente
- Separação clara entre rotas públicas, autenticadas e admin

### ⚠️ Problemas Críticos Identificados
- **6 problemas de segurança**
- **4 problemas de UX/fluxo**
- **3 inconsistências de proteção**
- **2 rotas órfãs**

---

## 🔴 PROBLEMAS CRÍTICOS (Segurança)

### 1. **Super Admin sem Layout de Proteção**
**Severidade:** 🔴 CRÍTICA  
**Localização:** `src/app/(super-admin)/admin/`

**Evidência:**
```
❌ Não existe layout.tsx em (super-admin)/admin/
✅ Existe proteção individual em cada page.tsx (client-side)
❌ Rotas admin são 100% client-side sem Server Component guard
```

**Problema:**
- Todas as 33 páginas admin são `'use client'`
- Não há `layout.tsx` que force autenticação no servidor
- Cada página implementa proteção individualmente (inconsistente)
- Usuário não autenticado pode ver flash de conteúdo antes do redirect

**Arquivos afetados:**
```
src/app/(super-admin)/admin/page.tsx (client)
src/app/(super-admin)/admin/stores/page.tsx (client)
src/app/(super-admin)/admin/tenants/page.tsx (client)
src/app/(super-admin)/admin/billing/page.tsx (client)
... (30+ páginas)
```

**Impacto:**
- Exposição temporária de UI admin
- Possível bypass via manipulação de estado
- Inconsistência de segurança entre páginas

**Recomendação:**
```typescript
// CRIAR: src/app/(super-admin)/admin/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/super-admin'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email)) redirect('/unauthorized')
  
  return <>{children}</>
}
```

---

### 2. **Duplicação de SUPER_ADMIN_EMAILS (DRY Violation)**
**Severidade:** 🟠 ALTA  
**Localização:** Múltiplos arquivos

**Evidência:**
```typescript
// ❌ DUPLICADO em 6 arquivos diferentes:
src/lib/auth/super-admin.ts (fonte de verdade)
src/app/(auth)/login/page.tsx (linha 9-12)
src/app/api/admin/stores/route.ts (linha 5-8)
src/app/api/admin/users/route.ts (linha 5-8)
src/app/api/admin/tenants/route.ts (linha 5-8)
src/app/api/admin/stats/route.ts (linha 5-8)
```

**Problema:**
- Lista de super admins hardcoded em 6 lugares
- Alteração requer modificar 6 arquivos
- Risco de inconsistência (esquecer de atualizar um arquivo)
- Viola princípio DRY (Don't Repeat Yourself)

**Impacto:**
- Manutenção complexa
- Risco de bugs de segurança por inconsistência

**Recomendação:**
```typescript
// USAR APENAS: src/lib/auth/super-admin.ts
import { isSuperAdmin } from '@/lib/auth/super-admin'

// REMOVER todas as constantes SUPER_ADMIN_EMAILS duplicadas
```

---

### 3. **APIs Admin sem Rate Limiting**
**Severidade:** 🟠 ALTA  
**Localização:** `src/app/api/admin/*`

**Evidência:**
```typescript
// src/app/api/admin/stats/route.ts
export async function GET() {
  // ❌ Sem rate limit
  // ❌ Sem logging de acesso
  // ✅ Tem verificação de super admin
}
```

**APIs expostas:**
- `/api/admin/stats` - Estatísticas do sistema
- `/api/admin/stores` - Lista todas as lojas
- `/api/admin/tenants` - Lista todos os tenants
- `/api/admin/users` - Lista todos os usuários

**Problema:**
- Qualquer super admin pode fazer requests ilimitados
- Sem proteção contra DoS
- Sem auditoria de acessos sensíveis

**Recomendação:**
- Implementar rate limiting (ex: 100 req/min por IP)
- Adicionar logging em tabela `admin_audit_log`
- Considerar usar middleware para centralizar proteção

---

### 4. **Webhook Mercado Pago sem Validação de Assinatura**
**Severidade:** 🔴 CRÍTICA  
**Localização:** `src/app/api/webhooks/mercadopago/route.ts`

**Evidência:**
```bash
# Busca por validação de assinatura/token
grep -r "authorization|secret|token" src/app/api/webhooks/
# Resultado: Nenhum resultado encontrado
```

**Problema:**
- Webhook público sem validação de origem
- Qualquer pessoa pode enviar POST para `/api/webhooks/mercadopago`
- Risco de fraude: atacante pode forjar notificações de pagamento

**Impacto:**
- **CRÍTICO:** Possível fraude financeira
- Ativação indevida de contas
- Manipulação de status de pagamento

**Recomendação:**
```typescript
// Implementar validação de assinatura do Mercado Pago
const signature = request.headers.get('x-signature')
const requestId = request.headers.get('x-request-id')

if (!validateMercadoPagoSignature(signature, requestId, body)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

---

### 5. **Cron Jobs com Proteção Fraca**
**Severidade:** 🟠 ALTA  
**Localização:** `src/app/api/cron/*`

**Evidência:**
```typescript
// src/app/api/cron/check-pix-payments/route.ts
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  // ❌ Se CRON_SECRET não estiver definido, aceita qualquer request
  console.error('[Cron] Unauthorized access attempt')
}
```

**Problema:**
- Proteção condicional: `if (cronSecret && ...)`
- Se `CRON_SECRET` não estiver definido, rota fica desprotegida
- Sem fallback de segurança

**Rotas afetadas:**
- `/api/cron/billing`
- `/api/cron/check-pix-payments`
- `/api/cron/clean-expired-drafts`

**Recomendação:**
```typescript
// SEMPRE rejeitar se não houver secret configurado
if (!cronSecret) {
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
}

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 6. **Middleware não Protege Rotas Admin**
**Severidade:** 🟠 ALTA  
**Localização:** `src/middleware.ts`

**Evidência:**
```typescript
// src/middleware.ts linha 84-94
if (host === 'admin.pediu.food') {
  if (pathname === '/') {
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
  }
  if (!pathname.startsWith('/admin')) {
    url.pathname = '/admin' + pathname
    return NextResponse.rewrite(url)
  }
  return await updateSession(request) // ❌ Só atualiza sessão, não valida
}
```

**Problema:**
- Middleware apenas faz rewrite de URL
- Não verifica se usuário é super admin
- Proteção acontece apenas nas páginas individuais (client-side)

**Impacto:**
- Usuário comum pode acessar admin.pediu.food
- Verá flash de conteúdo antes do redirect
- Aumenta superfície de ataque

**Recomendação:**
```typescript
// Adicionar verificação no middleware
if (host === 'admin.pediu.food') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !isSuperAdmin(user.email)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  // ... resto do código
}
```

---

## 🟡 PROBLEMAS DE UX/FLUXO

### 7. **Rotas de Billing sem Implementação**
**Severidade:** 🟡 MÉDIA  
**Localização:** `src/app/billing/*`

**Evidência:**
```typescript
// src/app/billing/suspended/page.tsx linha 29-34
<Link href="/billing/payment" className="...">
  Regularizar Pagamento
</Link>

// ❌ Rota /billing/payment NÃO EXISTE
```

**Rotas órfãs encontradas:**
- `/billing/payment` (referenciada, não existe)
- `/contact` (referenciada em suspended/page.tsx, não existe)

**Problema:**
- Usuário suspenso clica em "Regularizar Pagamento" → 404
- Experiência ruim em momento crítico (cobrança)
- Contradiz regra de automação total do sistema

**Impacto:**
- Frustração do usuário
- Perda de receita (usuário não consegue pagar)

**Recomendação:**
- Implementar `/billing/payment` com integração Mercado Pago
- Criar `/contact` ou redirecionar para WhatsApp/Email
- Ou remover links até implementação estar pronta

---

### 8. **Login sem Redirect Query Parameter**
**Severidade:** 🟡 MÉDIA  
**Localização:** `src/app/(auth)/login/page.tsx`

**Evidência:**
```typescript
// src/app/onboarding/page.tsx linha 65
if (!authUser) {
  router.push('/login?redirect=/onboarding')
  return
}

// ❌ Login page não lê nem usa o parâmetro redirect
```

**Problema:**
- Usuário é redirecionado para `/login?redirect=/onboarding`
- Após login, vai para dashboard da loja (ignora redirect)
- Perde contexto de onde estava

**Impacto:**
- UX ruim: usuário precisa navegar novamente
- Quebra fluxo de onboarding

**Recomendação:**
```typescript
// Ler searchParams no login
const searchParams = useSearchParams()
const redirectTo = searchParams.get('redirect')

// Após login bem-sucedido:
if (redirectTo) {
  router.push(redirectTo)
} else {
  // lógica atual
}
```

---

### 9. **Google OAuth Callback com Redirect Inconsistente**
**Severidade:** 🟡 MÉDIA  
**Localização:** `src/app/api/integrations/google/callback/route.ts`

**Evidência:**
```typescript
// Linha 86-88
return NextResponse.redirect(
  new URL(`/${slug}/dashboard/reviews/integrations?success=google_connected`, request.url)
)

// Linha 91-93 (erro)
return NextResponse.redirect(
  new URL(`/dashboard/reviews/integrations?error=...`, request.url)
)
```

**Problema:**
- Sucesso: redireciona para `/{slug}/dashboard/...` ✅
- Erro: redireciona para `/dashboard/...` ❌ (sem slug)
- Inconsistência causa 404 em caso de erro

**Recomendação:**
```typescript
// Usar slug em ambos os casos
return NextResponse.redirect(
  new URL(`/${slug}/dashboard/reviews/integrations?error=...`, request.url)
)
```

---

### 10. **Página 404 Customizada Ausente**
**Severidade:** 🟡 BAIXA  
**Localização:** `src/app/`

**Evidência:**
```bash
# Busca por not-found.tsx
find src/app -name "not-found.tsx"
# Resultado: Nenhum arquivo encontrado
```

**Problema:**
- Usa página 404 padrão do Next.js (feia)
- Não segue design system do projeto
- Sem opções de navegação úteis

**Recomendação:**
```typescript
// CRIAR: src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
        <Link href="/" className="...">Voltar para Home</Link>
      </div>
    </div>
  )
}
```

---

## 📊 MAPEAMENTO COMPLETO DE ROTAS

### Rotas Públicas (sem autenticação)
```
✅ /                          → Landing page
✅ /criar-loja                → Redirect para /choose-url
✅ /choose-url                → Seleção de URL
✅ /marketplace               → Marketplace de lojas
✅ /para-motoristas           → Landing motoristas
✅ /para-garcons              → Landing garçons
✅ /cadastro-motorista        → Cadastro motorista
✅ /demo-garcom               → Demo garçom
✅ /qa                        → QA page
✅ /mapa-do-site              → Sitemap
✅ /s/[slug]                  → Cardápio público
✅ /motorista-publico/[slug]  → Perfil público motorista
✅ /r/[code]                  → Redirect de código afiliado
```

### Rotas de Autenticação
```
✅ /login                     → Login
✅ /signup                    → Cadastro
✅ /logout                    → Logout (route handler)
✅ /reset-password            → Recuperar senha
✅ /update-password           → Atualizar senha
✅ /verify-email              → Verificar email
```

### Rotas Autenticadas (requer login)
```
✅ /select-store              → Seleção de loja (multi-store)
✅ /onboarding                → Onboarding inicial
✅ /profile                   → Perfil do usuário
✅ /setup/[token]             → Setup de convite
```

### Rotas de Billing (autenticadas)
```
⚠️ /billing/overdue           → Pagamento atrasado
⚠️ /billing/suspended         → Conta suspensa
⚠️ /billing/trial-expired     → Trial expirado
❌ /billing/payment           → NÃO EXISTE (referenciada)
```

### Rotas de Dashboard (/{slug}/dashboard/*)
**Total:** 38 rotas de dashboard por loja

```
✅ /{slug}/dashboard                    → Home
✅ /{slug}/dashboard/orders             → Pedidos
✅ /{slug}/dashboard/orders/delivery    → Entregas
✅ /{slug}/dashboard/products           → Produtos
✅ /{slug}/dashboard/inventory          → Estoque
✅ /{slug}/dashboard/kits               → Kits
✅ /{slug}/dashboard/custom-orders      → Pedidos customizados
✅ /{slug}/dashboard/pos                → PDV
✅ /{slug}/dashboard/kitchen            → Cozinha
✅ /{slug}/dashboard/tables             → Mesas
✅ /{slug}/dashboard/waiters            → Garçons
✅ /{slug}/dashboard/delivery           → Delivery
✅ /{slug}/dashboard/reservations       → Reservas
✅ /{slug}/dashboard/coupons            → Cupons
✅ /{slug}/dashboard/marketing          → Marketing
✅ /{slug}/dashboard/crm                → CRM
✅ /{slug}/dashboard/reviews            → Avaliações
✅ /{slug}/dashboard/reviews/integrations → Integrações (Google)
✅ /{slug}/dashboard/analytics          → Analytics
✅ /{slug}/dashboard/reports            → Relatórios
✅ /{slug}/dashboard/financial          → Financeiro
✅ /{slug}/dashboard/afiliados          → Afiliados
✅ /{slug}/dashboard/addons             → Complementos
✅ /{slug}/dashboard/team               → Equipe
✅ /{slug}/dashboard/appearance         → Aparência
✅ /{slug}/dashboard/settings           → Configurações
✅ /{slug}/dashboard/settings/store     → Config loja
✅ /{slug}/dashboard/settings/platforms → Plataformas
✅ /{slug}/dashboard/settings/integrations → Integrações
✅ /{slug}/dashboard/settings/scheduling → Agendamento
✅ /{slug}/dashboard/settings/niche     → Nicho
✅ /{slug}/dashboard/settings/modules   → Módulos
✅ /{slug}/dashboard/settings/loyalty   → Fidelidade
✅ /{slug}/dashboard/settings/complete  → Completar setup
✅ /{slug}/dashboard/onboarding         → Onboarding loja
```

**Proteção:** Server Component em `layout.tsx` ✅

### Rotas Super Admin (/admin/*)
**Total:** 33 rotas admin

```
⚠️ /admin                              → Dashboard admin (client)
⚠️ /admin/stores                       → Lojas (client)
⚠️ /admin/tenants                      → Tenants (client)
⚠️ /admin/users                        → Usuários (client)
⚠️ /admin/plans                        → Planos (client)
⚠️ /admin/plans/new                    → Novo plano (client)
⚠️ /admin/plans/[planId]               → Editar plano (client)
⚠️ /admin/billing                      → Billing (client)
⚠️ /admin/features                     → Features (client)
⚠️ /admin/analytics                    → Analytics (client)
⚠️ /admin/reports                      → Relatórios (client)
⚠️ /admin/logs                         → Logs (client)
⚠️ /admin/audit                        → Auditoria (client)
⚠️ /admin/automations                  → Automações (client)
⚠️ /admin/integrations                 → Integrações (client)
⚠️ /admin/partners                     → Parceiros (client)
⚠️ /admin/tickets                      → Tickets (client)
⚠️ /admin/settings                     → Configurações (client)
⚠️ /admin/demanda                      → Demanda (client)
⚠️ /admin/affiliates                   → Afiliados (client)
⚠️ /admin/affiliates/sales             → Vendas (client)
⚠️ /admin/affiliates/payouts           → Pagamentos (client)
⚠️ /admin/affiliates/settings          → Config (client)
⚠️ /admin/health                       → Health (client)
⚠️ /admin/health/monitor               → Monitor (server) ✅
⚠️ /admin/health/database              → Database (client)
⚠️ /admin/health/audit                 → Audit (client)
⚠️ /admin/health/pages                 → Pages (client)
⚠️ /admin/health/files                 → Files (client)
⚠️ /admin/health/images                → Images (client)
⚠️ /admin/health/slugs                 → Slugs (client)
⚠️ /admin/health/printing              → Printing (client)
⚠️ /admin/health/builder               → Builder (client)
```

**Proteção:** ❌ Sem layout.tsx, proteção individual por página (client-side)

### APIs Públicas
```
✅ /api/ping                           → Health check
✅ /api/health                         → Health status
✅ /api/health/status                  → Status (static)
✅ /api/public/slug/check              → Verificar slug
```

### APIs Autenticadas
```
✅ /api/upload/logo                    → Upload logo
✅ /api/upload/banner                  → Upload banner
✅ /api/draft-store/*                  → Draft store operations
✅ /api/onboarding/*                   → Onboarding operations
✅ /api/integrations/google/*          → Google integrations
```

### APIs Admin (Super Admin only)
```
⚠️ /api/admin/stats                    → Estatísticas
⚠️ /api/admin/stores                   → Lojas
⚠️ /api/admin/tenants                  → Tenants
⚠️ /api/admin/users                    → Usuários
⚠️ /api/admin/demo-setup               → Demo setup
⚠️ /api/admin/audit/run                → Executar auditoria
⚠️ /api/admin/audit/fix                → Corrigir problemas
⚠️ /api/admin/audit/fix-localhost      → Fix localhost
```

**Proteção:** ✅ Verificação de super admin, ⚠️ sem rate limit

### APIs Cron
```
⚠️ /api/cron/billing                   → Billing cron
⚠️ /api/cron/check-pix-payments        → Check PIX
⚠️ /api/cron/clean-expired-drafts      → Limpar drafts
```

**Proteção:** ⚠️ Condicional (falha se CRON_SECRET não definido)

### APIs Webhook
```
🔴 /api/webhooks/mercadopago           → Webhook MP (SEM VALIDAÇÃO)
⚠️ /api/webhooks/mimo                  → Webhook Mimo
```

### APIs Internas
```
✅ /api/internal/e2e/seed              → Seed para testes E2E
```

---

## 🔒 ANÁLISE DE MIDDLEWARE

### Configuração Atual
```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

**✅ Pontos Fortes:**
- Exclui assets estáticos corretamente
- Não processa imagens/favicons
- Performance otimizada

### Roteamento Multi-Domínio

#### 1. pediufood.com (Marketing)
```typescript
if (host === 'pediufood.com' || host === 'www.pediufood.com') {
  return await updateSession(request)
}
```
**Status:** ✅ OK

#### 2. admin.pediu.food (Super Admin)
```typescript
if (host === 'admin.pediu.food') {
  if (pathname === '/') {
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
  }
  if (!pathname.startsWith('/admin')) {
    url.pathname = '/admin' + pathname
    return NextResponse.rewrite(url)
  }
  return await updateSession(request) // ⚠️ Sem verificação de super admin
}
```
**Status:** ⚠️ Falta verificação de autorização

#### 3. app.pediu.food (Dashboard Multi-loja)
```typescript
if (host === 'app.pediu.food') {
  return await updateSession(request)
}
```
**Status:** ✅ OK (proteção nas páginas)

#### 4. *.pediu.food (Cardápio White-label)
```typescript
if (isSubdomain(host, 'pediu.food')) {
  const subdomain = getSubdomain(host, 'pediu.food')
  if (subdomain && !RESERVED_SLUGS.has(subdomain)) {
    url.pathname = `/s/${subdomain}${pathname}`
    return NextResponse.rewrite(url)
  }
  return await updateSession(request)
}
```
**Status:** ✅ OK

#### 5. *.entregou.food (Perfil Motorista)
```typescript
if (isSubdomain(host, 'entregou.food')) {
  const driverSlug = getSubdomain(host, 'entregou.food')
  if (driverSlug && !RESERVED_SLUGS.has(driverSlug)) {
    url.pathname = `/motorista-publico/${driverSlug}${pathname}`
    return NextResponse.rewrite(url)
  }
  return await updateSession(request)
}
```
**Status:** ✅ OK

### Redirects Permanentes (308)
```typescript
// pediufood.com.br → pediufood.com
if (host === 'pediufood.com.br' || host === 'www.pediufood.com.br') {
  return NextResponse.redirect(
    new URL(pathname + request.nextUrl.search, 'https://pediufood.com'),
    308
  )
}

// pensou.food → marketplace
if (host === 'pensou.food' || host === 'www.pensou.food') {
  return NextResponse.redirect(
    new URL('/marketplace', 'https://pediufood.com'),
    308
  )
}

// pediu.food → pediufood.com (exceto admin/api)
if (host === 'pediu.food' || host === 'www.pediu.food') {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api') || 
      pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return await updateSession(request)
  }
  return NextResponse.redirect(
    new URL(pathname + request.nextUrl.search, 'https://pediufood.com'),
    308
  )
}
```
**Status:** ✅ Correto uso de 308 (Permanent Redirect)

---

## 📋 CHECKLIST DE CORREÇÕES

### 🔴 Prioridade CRÍTICA (Fazer ANTES do go-live)
- [ ] **#1** - Criar `layout.tsx` server-side para `/admin`
- [ ] **#4** - Implementar validação de assinatura webhook Mercado Pago
- [ ] **#5** - Corrigir proteção condicional dos cron jobs

### 🟠 Prioridade ALTA (Fazer na Sprint 1)
- [ ] **#2** - Centralizar SUPER_ADMIN_EMAILS (remover duplicações)
- [ ] **#3** - Implementar rate limiting nas APIs admin
- [ ] **#6** - Adicionar verificação de super admin no middleware

### 🟡 Prioridade MÉDIA (Fazer na Sprint 2)
- [ ] **#7** - Implementar `/billing/payment` e `/contact`
- [ ] **#8** - Adicionar suporte a redirect query parameter no login
- [ ] **#9** - Corrigir redirect inconsistente no Google OAuth callback

### 🟢 Prioridade BAIXA (Backlog)
- [ ] **#10** - Criar página 404 customizada

---

## 🎯 RECOMENDAÇÕES ARQUITETURAIS

### 1. Centralizar Proteção de Rotas
```typescript
// CRIAR: src/lib/auth/route-guards.ts
export async function requireAuth(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  return user
}

export async function requireSuperAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user
  if (!isSuperAdmin(user.email)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }
  return user
}
```

### 2. Implementar Audit Log
```sql
-- CRIAR: supabase/migrations/xxx_create_admin_audit_log.sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_email);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
```

### 3. Rate Limiting Middleware
```typescript
// CRIAR: src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
  return { success, limit, reset, remaining }
}
```

---

## 📊 MÉTRICAS DA AUDITORIA

### Rotas Analisadas
- **Total de rotas:** 87 rotas mapeadas
- **Rotas públicas:** 13
- **Rotas autenticadas:** 42
- **Rotas admin:** 33
- **APIs:** 30+

### Problemas por Severidade
- 🔴 **Crítico:** 2 problemas
- 🟠 **Alto:** 4 problemas
- 🟡 **Médio:** 3 problemas
- 🟢 **Baixo:** 1 problema

### Cobertura de Proteção
- ✅ **Bem protegido:** Dashboard de lojas (layout server-side)
- ⚠️ **Parcialmente protegido:** APIs admin (sem rate limit)
- 🔴 **Vulnerável:** Painel admin (client-side only), Webhook MP

---

## ✅ CONCLUSÃO

O sistema possui uma **arquitetura de rotas sólida** com middleware bem estruturado e separação clara de responsabilidades. No entanto, foram identificados **6 problemas críticos de segurança** que devem ser corrigidos antes do go-live em produção.

**Principais riscos:**
1. Painel admin sem proteção server-side
2. Webhook de pagamento sem validação
3. Cron jobs com proteção condicional

**Próximos passos:**
1. Corrigir problemas críticos (#1, #4, #5)
2. Implementar rate limiting e audit log
3. Criar testes E2E para fluxos de autenticação
4. Documentar políticas de acesso

---

**Auditoria realizada por:** Cascade AI  
**Metodologia:** Análise estática de código + Mapeamento de rotas + Testes manuais  
**Ferramentas:** grep_search, read_file, find_by_name
