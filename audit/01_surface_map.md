# API Surface Map - Security Audit
**Gerado em:** 2024-12-19  
**Commit:** d410642  
**Total de Rotas:** 25 API routes + 19 Server Actions

---

## 🔴 CRITICAL - Endpoints de Alto Risco

### 1. `/api/admin/audit/fix` (POST)
- **Métodos:** GET, POST
- **Runtime:** Node.js (default)
- **Auth Required:** ❌ **NÃO** - Sem verificação de autenticação
- **Admin Only:** ❌ **NÃO** - Sem verificação de role
- **Rate Limit:** ❌ **NÃO**
- **Side Effect in GET:** ✅ Não (GET apenas retorna mensagem)
- **Dados Sensíveis:** Executa script Python `faxineiro.py` com acesso total ao sistema
- **EVIDÊNCIA:** `src/app/api/admin/audit/fix/route.ts:7-45`
  - Linha 7: `export async function POST()` - sem parâmetros de request/auth
  - Linha 20-21: `execAsync('echo s | python scripts/faxineiro.py')` - execução de comando shell
  - Linha 9: Apenas verifica se está em produção, mas não verifica autenticação
- **SEVERIDADE:** 🔴 **CRÍTICA**
- **PATCH SUGERIDO:**
  ```typescript
  // Adicionar no início do POST:
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Verificar se é super admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  ```

### 2. `/api/admin/audit/fix-localhost` (POST)
- **Métodos:** GET, POST
- **Auth Required:** ❌ **NÃO**
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Executa script Python que modifica código-fonte
- **EVIDÊNCIA:** `src/app/api/admin/audit/fix-localhost/route.ts:7-40`
  - Linha 18: `execAsync('python scripts/fix_localhost.py')` - modifica arquivos do sistema
- **SEVERIDADE:** 🔴 **CRÍTICA**

### 3. `/api/admin/audit/run` (POST)
- **Métodos:** GET, POST
- **Auth Required:** ❌ **NÃO**
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Executa auditoria completa do sistema
- **EVIDÊNCIA:** `src/app/api/admin/audit/run/route.ts:7-40`
  - Linha 18: `execAsync('python scripts/auditor_funcional.py')`
- **SEVERIDADE:** 🔴 **CRÍTICA**

### 4. `/api/admin/demo-setup` (POST, GET)
- **Métodos:** GET, POST
- **Auth Required:** ❌ **NÃO**
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Side Effect in GET:** ✅ Não (apenas consulta)
- **Dados Sensíveis:** Cria/modifica tenants, stores, products com SERVICE_ROLE_KEY
- **EVIDÊNCIA:** `src/app/api/admin/demo-setup/route.ts:8-123`
  - Linha 9-11: Usa `SUPABASE_SERVICE_ROLE_KEY` sem autenticação
  - Linha 50-68: Cria loja com acesso total ao banco
  - Linha 87-91: Insere produtos diretamente
- **SEVERIDADE:** 🔴 **CRÍTICA** - Qualquer pessoa pode criar lojas/tenants

### 5. `/api/health/fix` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO**
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Modifica planos, tenants, subscriptions, categories, payments
- **EVIDÊNCIA:** `src/app/api/health/fix/route.ts:16-343`
  - Linha 17-19: Usa SERVICE_ROLE_KEY sem auth
  - Linha 72: Insere planos padrão
  - Linha 108-112: Cria tenants
  - Linha 185-193: Cria subscriptions para todos os tenants
  - Linha 244: Insere categorias
  - Linha 298: Modifica settings de stores
- **SEVERIDADE:** 🔴 **CRÍTICA** - Modificações massivas sem autorização

### 6. `/api/billing/generate` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO**
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Gera faturas para todos os tenants
- **EVIDÊNCIA:** `src/app/api/billing/generate/route.ts:8-104`
  - Linha 11-13: SERVICE_ROLE_KEY sem auth
  - Linha 73-83: Cria invoices para todos os tenants
- **SEVERIDADE:** 🔴 **CRÍTICA** - Geração de faturas não autorizada

---

## 🟡 WARNING - Endpoints com Proteção Parcial

### 7. `/api/cron/billing` (GET)
- **Métodos:** GET
- **Auth Required:** ✅ **SIM** - Via Bearer token
- **Admin Only:** ⚠️ Cron secret (não é role-based)
- **Rate Limit:** ❌ **NÃO**
- **Side Effect in GET:** ❌ **SIM** - GET modifica dados (suspende tenants, marca faturas vencidas)
- **Dados Sensíveis:** Suspende tenants, marca faturas como overdue
- **EVIDÊNCIA:** `src/app/api/cron/billing/route.ts:18-116`
  - Linha 20-22: Verifica `CRON_SECRET` no header authorization
  - Linha 39-44: UPDATE em invoices
  - Linha 73-82: UPDATE em tenants (suspensão)
  - Linha 92-101: UPDATE em tenants (trial expirado)
- **SEVERIDADE:** 🟡 **MÉDIA** - Protegido por secret, mas GET com side effects viola REST

### 8. `/api/cron/clean-expired-drafts` (GET)
- **Métodos:** GET
- **Auth Required:** ✅ **SIM** - Via Bearer token
- **Admin Only:** ⚠️ Cron secret
- **Rate Limit:** ❌ **NÃO**
- **Side Effect in GET:** ❌ **SIM** - DELETE de registros
- **Dados Sensíveis:** Deleta draft_stores
- **EVIDÊNCIA:** `src/app/api/cron/clean-expired-drafts/route.ts:15-57`
  - Linha 18-23: Verifica CRON_SECRET
  - Linha 27-31: DELETE em draft_stores
- **SEVERIDADE:** 🟡 **MÉDIA** - GET com DELETE viola REST

### 9. `/api/webhooks/mercadopago` (POST, GET)
- **Métodos:** GET, POST
- **Auth Required:** ❌ **NÃO** - Webhooks públicos por design
- **Admin Only:** N/A
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Processa pagamentos, atualiza invoices
- **EVIDÊNCIA:** `src/app/api/webhooks/mercadopago/route.ts:11-45`
  - Linha 11: POST sem validação de assinatura MercadoPago
  - Linha 23: Chama `processPaymentWebhook(paymentId)` sem verificar origem
- **SEVERIDADE:** 🟡 **MÉDIA** - Falta validação de assinatura do webhook
- **PATCH SUGERIDO:**
  ```typescript
  // Validar assinatura do MercadoPago
  const signature = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  if (!validateMercadoPagoSignature(body, signature, requestId)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  ```

### 10. `/api/upload/logo` (POST, DELETE)
- **Métodos:** POST, DELETE
- **Auth Required:** ⚠️ **PARCIAL** - Permite loja demo sem auth
- **Admin Only:** ❌ **NÃO** - Verifica store_users
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Upload de arquivos, acesso ao Storage
- **EVIDÊNCIA:** `src/app/api/upload/logo/route.ts:16-212`
  - Linha 19: `getUser()` - pode retornar null
  - Linha 38-39: Se não tem user E é demo, usa admin client
  - Linha 56-60: Se não tem user E não é demo, retorna 401
  - Linha 42-55: Verifica permissão apenas se tem user
- **SEVERIDADE:** 🟡 **MÉDIA** - Loja demo permite upload sem auth
- **HIPÓTESE A VALIDAR:** Verificar se loja demo pode ser explorada para upload malicioso

### 11. `/api/upload/banner` (POST, DELETE)
- **Métodos:** POST, DELETE
- **Auth Required:** ⚠️ **PARCIAL** - Permite loja demo sem auth
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Upload de arquivos
- **EVIDÊNCIA:** `src/app/api/upload/banner/route.ts:16-186`
  - Mesma lógica do logo - permite demo sem auth
- **SEVERIDADE:** 🟡 **MÉDIA**

### 12. `/api/onboarding/publish-draft` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO** - Recebe userId no body
- **Admin Only:** ❌ **NÃO**
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Cria tenant, store, subscription com SERVICE_ROLE
- **EVIDÊNCIA:** `src/app/api/onboarding/publish-draft/route.ts:15-146`
  - Linha 18: `const { draftToken, userId, email, name, phone } = body` - userId vem do body
  - Linha 50-58: Cria tenant com userId do body (não verificado)
  - Linha 70-86: Cria store
  - Linha 115-124: Cria subscription
- **SEVERIDADE:** 🟡 **MÉDIA** - userId não é verificado contra sessão autenticada
- **PATCH SUGERIDO:**
  ```typescript
  // Verificar se userId corresponde ao usuário autenticado
  const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```

---

## 🟢 OK - Endpoints com Proteção Adequada

### 13. `/api/draft-store/create` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO** - Público por design (onboarding)
- **Rate Limit:** ✅ **SIM** - Rate limit implementado
- **Dados Sensíveis:** Cria draft temporário
- **EVIDÊNCIA:** `src/app/api/draft-store/create/route.ts:5-56`
  - Linha 8-12: `checkRateLimit` com config `draftStore`
  - Linha 14-22: Retorna 429 se exceder limite
- **SEVERIDADE:** 🟢 **BAIXA** - Rate limit protege contra abuso

### 14. `/api/draft-store/get` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO** - Requer token válido
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Retorna draft por token
- **EVIDÊNCIA:** `src/app/api/draft-store/get/route.ts:4-36`
  - Linha 7: Requer token no query param
- **SEVERIDADE:** 🟢 **BAIXA** - Token atua como autenticação

### 15. `/api/draft-store/update` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO** - Requer token válido
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Atualiza config do draft
- **EVIDÊNCIA:** `src/app/api/draft-store/update/route.ts:4-36`
- **SEVERIDADE:** 🟢 **BAIXA**

### 16. `/api/onboarding/complete-signup` (POST)
- **Métodos:** POST
- **Auth Required:** ⚠️ Token no body
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Finaliza cadastro
- **EVIDÊNCIA:** `src/app/api/onboarding/complete-signup/route.ts:4-23`
  - Linha 9: Requer token no body
- **SEVERIDADE:** 🟢 **BAIXA**

### 17. `/api/onboarding/reserve-slug` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO** - Público (onboarding)
- **Rate Limit:** ❌ **NÃO**
- **Dados Sensíveis:** Reserva slug temporário
- **EVIDÊNCIA:** `src/app/api/onboarding/reserve-slug/route.ts:4-17`
- **SEVERIDADE:** 🟢 **BAIXA** - Operação idempotente

---

## 📊 Endpoints de Diagnóstico (Somente Leitura)

### 18. `/api/health/status` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Side Effect in GET:** ✅ Não (apenas leitura)
- **Dados Sensíveis:** Expõe métricas do sistema (tenants count, stores count, orders today)
- **EVIDÊNCIA:** `src/app/api/health/status/route.ts:31-78`
  - Linha 65: Retorna métricas agregadas
- **SEVERIDADE:** 🟡 **MÉDIA** - Expõe informações do sistema publicamente
- **RECOMENDAÇÃO:** Adicionar autenticação ou limitar informações expostas

### 19. `/api/health/audit` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Side Effect in GET:** ✅ Não
- **Dados Sensíveis:** Lista todos os problemas do banco (tenants sem email, sem plano, etc)
- **EVIDÊNCIA:** `src/app/api/health/audit/route.ts:18-440`
  - Linha 29-44: Expõe tenants sem email
  - Linha 46-64: Expõe tenants sem plano
- **SEVERIDADE:** 🟡 **MÉDIA** - Information disclosure

### 20. `/api/health/diagnostic` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Dados Sensíveis:** Expõe status de todas as funcionalidades
- **EVIDÊNCIA:** `src/app/api/health/diagnostic/route.ts:37-438`
- **SEVERIDADE:** 🟡 **MÉDIA**

### 21. `/api/health/database` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Dados Sensíveis:** Expõe contagem de registros de todas as tabelas
- **EVIDÊNCIA:** `src/app/api/health/database/route.ts:24-217`
- **SEVERIDADE:** 🟡 **MÉDIA**

### 22. `/api/health/files` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Dados Sensíveis:** Lista arquivos grandes do sistema
- **EVIDÊNCIA:** `src/app/api/health/files/route.ts:226-258`
- **SEVERIDADE:** 🟢 **BAIXA** - Apenas metadados

### 23. `/api/health/pages` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO**
- **Dados Sensíveis:** Lista todas as páginas do sistema
- **EVIDÊNCIA:** `src/app/api/health/pages/route.ts:104-128`
- **SEVERIDADE:** 🟢 **BAIXA**

---

## 🔗 Integrações Externas

### 24. `/api/integrations/google/callback` (GET)
- **Métodos:** GET
- **Auth Required:** ❌ **NÃO** - OAuth callback
- **Dados Sensíveis:** Armazena tokens OAuth do Google
- **EVIDÊNCIA:** `src/app/api/integrations/google/callback/route.ts:8-95`
  - Linha 11: `state` param contém storeId (não validado)
  - Linha 38-74: Armazena access_token e refresh_token
- **SEVERIDADE:** 🟡 **MÉDIA** - State param não é validado (CSRF possível)
- **PATCH SUGERIDO:**
  ```typescript
  // Validar state contra sessão
  const session = await getSession(request)
  if (!session || session.storeId !== state) {
    return NextResponse.redirect(new URL('/error?code=invalid_state', request.url))
  }
  ```

### 25. `/api/integrations/google/sync` (POST)
- **Métodos:** POST
- **Auth Required:** ❌ **NÃO**
- **Dados Sensíveis:** Sincroniza reviews do Google, atualiza banco
- **EVIDÊNCIA:** `src/app/api/integrations/google/sync/route.ts:14-196`
  - Linha 16: Recebe integrationId e storeId do body (não valida ownership)
- **SEVERIDADE:** 🟡 **MÉDIA** - Falta validar se usuário tem acesso ao storeId

---

## 📋 Server Actions (use server)

**Total:** 19 arquivos com `'use server'`

### Arquivos com Server Actions:
1. `src/modules/store/actions.ts`
2. `src/modules/reports/actions.ts`
3. `src/modules/orders/actions.ts`
4. `src/modules/onboarding/actions.ts`
5. `src/modules/draft-store/actions.ts`
6. `src/modules/menu/actions.ts`
7. `src/modules/minisite/actions.ts`
8. `src/lib/superadmin/users.ts`
9. `src/lib/superadmin/actions.ts`
10. `src/lib/qa/actions.ts`
11. `src/lib/modifiers/actions.ts`
12. `src/lib/plan-access.ts`
13. `src/lib/demo/actions.ts`
14. `src/lib/coupons/actions.ts`
15. `src/lib/actions/menu.ts`
16. `src/lib/actions/orders.ts`
17. `src/app/[slug]/dashboard/team/actions.ts`
18. `src/app/actions/seed-store.ts`
19. `src/app/actions/loyalty.ts`

**NOTA:** Server Actions requerem análise individual para verificar:
- Validação de autenticação (`createClient()` + `getUser()`)
- Validação de autorização (role, store ownership)
- Validação de input (Zod schemas)
- Proteção contra IDOR (Insecure Direct Object Reference)

---

## 🎯 Resumo Executivo

### Estatísticas de Superfície
- **Total de Rotas API:** 25
- **Total de Server Actions:** 19
- **Endpoints Críticos:** 6 (24%)
- **Endpoints com Proteção Parcial:** 6 (24%)
- **Endpoints Adequados:** 13 (52%)

### Vulnerabilidades Críticas Identificadas

| ID | Endpoint | Vulnerabilidade | Impacto |
|----|----------|-----------------|---------|
| V1 | `/api/admin/audit/fix` | Execução de código sem auth | RCE, Data Loss |
| V2 | `/api/admin/audit/fix-localhost` | Execução de código sem auth | RCE, Code Modification |
| V3 | `/api/admin/audit/run` | Execução de código sem auth | Information Disclosure |
| V4 | `/api/admin/demo-setup` | Criação de recursos sem auth | Privilege Escalation |
| V5 | `/api/health/fix` | Modificação massiva sem auth | Data Corruption |
| V6 | `/api/billing/generate` | Geração de faturas sem auth | Financial Fraud |

### Violações de Arquitetura

1. **GET com Side Effects:** 2 endpoints (cron jobs)
2. **Falta de Rate Limiting:** 22 endpoints (88%)
3. **Information Disclosure:** 4 endpoints de health sem auth
4. **Falta de CSRF Protection:** OAuth callback
5. **Webhook sem Signature Validation:** MercadoPago

### Recomendações Prioritárias

#### 🔴 URGENTE (Implementar Imediatamente)
1. **Adicionar autenticação + role check** em todos os endpoints `/api/admin/*`
2. **Adicionar autenticação + role check** em `/api/health/fix`
3. **Adicionar autenticação + role check** em `/api/billing/generate`
4. **Validar userId contra sessão** em `/api/onboarding/publish-draft`

#### 🟡 IMPORTANTE (Implementar em 1 semana)
1. Adicionar **validação de assinatura** no webhook MercadoPago
2. Adicionar **rate limiting** em todos os endpoints públicos
3. Adicionar **autenticação** nos endpoints de health ou remover informações sensíveis
4. Validar **state param** no OAuth callback do Google
5. Converter **GET com side effects** para POST nos cron jobs

#### 🟢 MELHORIAS (Implementar em 1 mês)
1. Implementar **CSRF tokens** para formulários
2. Adicionar **logging de auditoria** para ações administrativas
3. Implementar **IP whitelisting** para cron jobs
4. Adicionar **Content Security Policy** headers
5. Revisar todos os **Server Actions** para validação de auth/authz

---

## 🔍 Próximos Passos da Auditoria

1. **ETAPA 2:** Análise detalhada de Server Actions
2. **ETAPA 3:** Teste de penetração automatizado (OWASP ZAP)
3. **ETAPA 4:** Análise de RLS (Row Level Security) no Supabase
4. **ETAPA 5:** Auditoria de variáveis de ambiente e secrets
5. **ETAPA 6:** Relatório final com POCs (Proof of Concepts)

---

**FIM DO MAPA DE SUPERFÍCIE**
