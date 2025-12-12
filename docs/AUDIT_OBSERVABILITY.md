# Auditoria de Observabilidade

**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Completo

---

## 📊 Resumo Executivo

- **Logs Estruturados:** ❌ Não implementado
- **Error Tracking:** ❌ Não implementado
- **Audit Logs:** ❌ Não implementado
- **Monitoring:** ❌ Não implementado
- **Alertas:** ❌ Não implementado
- **Status Geral:** 🔴 **CRÍTICO** (0% de observabilidade)

---

## 📝 Logs

### Status Atual

**Implementação:** ❌ Nenhuma

**Problema:**
- Apenas `console.log()` e `console.error()`
- Sem estrutura
- Sem contexto
- Sem níveis
- Sem persistência

**Exemplo Atual:**
```typescript
try {
  await supabase.from('orders').insert(data)
} catch (error) {
  console.error('Erro ao criar pedido:', error) // ❌ Ruim
}
```

---

### Solução Recomendada

#### 1. Implementar Logger Estruturado

**Biblioteca:** Winston ou Pino

```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Adicionar contexto
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}
```

**Uso:**
```typescript
// Com contexto
const log = createLogger({
  userId: user.id,
  storeId: store.id,
  action: 'create_order'
})

try {
  await supabase.from('orders').insert(data)
  log.info({ orderId: order.id }, 'Pedido criado com sucesso')
} catch (error) {
  log.error({ error, data }, 'Erro ao criar pedido')
  throw error
}
```

**Benefícios:**
- ✅ Logs estruturados (JSON)
- ✅ Contexto rico
- ✅ Níveis (debug, info, warn, error)
- ✅ Fácil de parsear
- ✅ Integração com ferramentas

**Prazo:** 3 dias

---

#### 2. Níveis de Log

```typescript
// DEBUG: Desenvolvimento
logger.debug({ query, params }, 'Executando query')

// INFO: Eventos importantes
logger.info({ userId, orderId }, 'Pedido criado')

// WARN: Avisos
logger.warn({ couponCode }, 'Cupom próximo do limite')

// ERROR: Erros
logger.error({ error, context }, 'Falha ao processar pagamento')
```

**Prazo:** 1 dia

---

#### 3. Contexto Automático

```typescript
// Middleware para adicionar contexto
export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  // Adicionar ao logger
  const log = createLogger({
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
  })
  
  // Disponibilizar no request
  request.logger = log
  
  return await updateSession(request)
}
```

**Prazo:** 2 dias

---

## 🚨 Error Tracking

### Status Atual

**Implementação:** ❌ Nenhuma

**Problema:**
- Erros não são rastreados
- Sem stack traces
- Sem contexto de usuário
- Sem agrupamento
- Sem alertas

---

### Solução Recomendada

#### 1. Implementar Sentry

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  
  beforeSend(event, hint) {
    // Adicionar contexto
    if (event.user) {
      event.user = {
        id: event.user.id,
        email: event.user.email,
        // Não enviar dados sensíveis
      }
    }
    return event
  },
})
```

**Uso:**
```typescript
try {
  await processPayment(order)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      action: 'process_payment',
      store_id: order.store_id,
    },
    extra: {
      orderId: order.id,
      amount: order.total,
    },
  })
  throw error
}
```

**Benefícios:**
- ✅ Stack traces completos
- ✅ Contexto de usuário
- ✅ Agrupamento automático
- ✅ Alertas configuráveis
- ✅ Dashboard visual
- ✅ Integração com Slack/Email

**Custo:** Free até 5k eventos/mês  
**Prazo:** 2 dias

---

#### 2. Error Boundaries

```typescript
// src/app/error.tsx (já existe)
'use client'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Enviar para Sentry
    Sentry.captureException(error)
  }, [error])
  
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
```

**Prazo:** 1 dia (já implementado, só adicionar Sentry)

---

## 📊 Audit Logs

### Status Atual

**Implementação:** ❌ Nenhuma

**Problema:**
- Sem rastreamento de ações
- Não sabe quem fez o quê
- Sem histórico de mudanças
- Dificulta investigações
- Problemas de compliance

---

### Solução Recomendada

#### 1. Criar Tabela de Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  store_id UUID REFERENCES stores(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_store ON audit_logs(store_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

**Prazo:** 1 dia

---

#### 2. Função Helper

```typescript
// src/lib/audit.ts
export async function logAudit({
  userId,
  storeId,
  action,
  resourceType,
  resourceId,
  oldValues,
  newValues,
  metadata,
}: AuditLogParams) {
  const supabase = await createClient()
  
  await supabase.from('audit_logs').insert({
    user_id: userId,
    store_id: storeId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    old_values: oldValues,
    new_values: newValues,
    metadata,
    ip_address: getClientIp(),
    user_agent: getUserAgent(),
  })
}
```

**Uso:**
```typescript
// Ao atualizar produto
await logAudit({
  userId: user.id,
  storeId: product.store_id,
  action: 'update',
  resourceType: 'product',
  resourceId: product.id,
  oldValues: oldProduct,
  newValues: newProduct,
  metadata: { reason: 'price_update' },
})
```

**Prazo:** 2 dias

---

#### 3. Ações a Auditar

**Críticas (sempre auditar):**
- ✅ Criar/editar/deletar produtos
- ✅ Criar/editar/deletar pedidos
- ✅ Confirmar/estornar pagamentos
- ✅ Adicionar/remover membros da loja
- ✅ Mudar roles de membros
- ✅ Alterar configurações da loja
- ✅ Criar/editar cupons

**Importantes (considerar):**
- ⚠️ Login/logout
- ⚠️ Mudança de senha
- ⚠️ Exportar relatórios
- ⚠️ Acessar dados de clientes

**Prazo:** 3 dias

---

## 📈 Monitoring

### Status Atual

**Implementação:** ❌ Nenhuma

**Problema:**
- Não sabe se sistema está funcionando
- Não detecta problemas antes dos usuários
- Sem métricas de uso
- Sem alertas proativos

---

### Solução Recomendada

#### 1. Vercel Analytics (Built-in)

```typescript
// next.config.js
module.exports = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
}
```

**Métricas:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Referrers
- ✅ Devices

**Custo:** Incluído no Vercel  
**Prazo:** 1 dia

---

#### 2. Supabase Monitoring

**Dashboard nativo:**
- ✅ Database connections
- ✅ Query performance
- ✅ Storage usage
- ✅ API requests
- ✅ Auth events

**Alertas:**
```sql
-- Configurar alertas no Supabase Dashboard
- Database CPU > 80%
- Connections > 90%
- Slow queries > 1s
```

**Prazo:** 1 dia

---

#### 3. Custom Metrics

```typescript
// src/lib/metrics.ts
export async function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
) {
  // Enviar para serviço de métricas
  await fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({ name, value, tags }),
  })
}

// Uso
await trackMetric('order.created', 1, {
  store_id: storeId,
  payment_method: 'pix',
})

await trackMetric('order.total', order.total, {
  store_id: storeId,
})
```

**Prazo:** 3 dias

---

## 🔔 Alertas

### Status Atual

**Implementação:** ❌ Nenhuma

**Problema:**
- Não é notificado de problemas
- Descobre erros tarde demais
- Sem SLA definido

---

### Solução Recomendada

#### 1. Alertas Críticos

**Sentry:**
- 🔴 Error rate > 1%
- 🔴 New error type
- 🔴 Error spike (10x normal)

**Supabase:**
- 🔴 Database down
- 🔴 CPU > 90%
- 🔴 Connections > 95%

**Aplicação:**
- 🔴 Payment failure rate > 5%
- 🔴 API response time > 5s

**Prazo:** 2 dias

---

#### 2. Alertas Importantes

**Negócio:**
- ⚠️ Orders down 50% vs yesterday
- ⚠️ No orders in 1 hour (business hours)
- ⚠️ Coupon usage spike

**Técnico:**
- ⚠️ Slow queries > 2s
- ⚠️ High memory usage
- ⚠️ Storage > 80%

**Prazo:** 3 dias

---

#### 3. Canais de Notificação

**Slack:**
```typescript
// src/lib/slack.ts
export async function sendSlackAlert(message: string, severity: 'error' | 'warning') {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: message,
      attachments: [{
        color: severity === 'error' ? 'danger' : 'warning',
        fields: [
          { title: 'Environment', value: process.env.NODE_ENV },
          { title: 'Time', value: new Date().toISOString() },
        ],
      }],
    }),
  })
}
```

**Email:**
- Usar SendGrid ou Resend
- Apenas para alertas críticos

**Prazo:** 2 dias

---

## 🚨 Findings Consolidados

### 🔴 BLOCKER (1)

1. **Sem observabilidade alguma**
   - **Impacto:** Não sabe o que está acontecendo
   - **Risco:** Problemas não detectados
   - **Fix:** Implementar logging + error tracking
   - **Prazo:** 1 semana

### 🔴 HIGH (5)

2. **Sem logs estruturados**
   - **Impacto:** Dificulta debugging
   - **Fix:** Implementar Pino/Winston
   - **Prazo:** 3 dias

3. **Sem error tracking**
   - **Impacto:** Erros não rastreados
   - **Fix:** Implementar Sentry
   - **Prazo:** 2 dias

4. **Sem audit logs**
   - **Impacto:** Não sabe quem fez o quê
   - **Fix:** Criar tabela + função helper
   - **Prazo:** 3 dias

5. **Sem monitoring**
   - **Impacto:** Não detecta problemas
   - **Fix:** Configurar Vercel + Supabase
   - **Prazo:** 2 dias

6. **Sem alertas**
   - **Impacto:** Descobre problemas tarde
   - **Fix:** Configurar alertas críticos
   - **Prazo:** 2 dias

---

## 🎯 Plano de Ação

### Semana 1

**Dia 1:**
- ✅ Criar tabela audit_logs (#4)
- ✅ Configurar Vercel Analytics (#5)

**Dias 2-3:**
- ✅ Implementar Sentry (#3)
- ✅ Adicionar error boundaries

**Dias 4-5:**
- ✅ Implementar logger estruturado (#2)
- ✅ Adicionar contexto automático

### Semana 2

**Dias 8-9:**
- ✅ Implementar função de audit log (#4)
- ✅ Auditar ações críticas

**Dias 10-11:**
- ✅ Configurar alertas críticos (#6)
- ✅ Integrar Slack

**Dias 12-14:**
- ✅ Implementar custom metrics
- ✅ Dashboard de métricas

---

## 📊 Stack Recomendada

| Ferramenta | Propósito | Custo | Prioridade |
|------------|-----------|-------|------------|
| Pino | Logs estruturados | Free | 🔴 HIGH |
| Sentry | Error tracking | Free (5k/mês) | 🔴 HIGH |
| Vercel Analytics | Page views | Incluído | ⚠️ MEDIUM |
| Supabase Monitoring | Database | Incluído | ⚠️ MEDIUM |
| Slack | Alertas | Free | ⚠️ MEDIUM |
| Grafana | Dashboards | Free (self-hosted) | 🟡 LOW |

---

## 📈 Métricas de Sucesso

### Antes

| Métrica | Valor | Status |
|---------|-------|--------|
| Logs estruturados | 0% | 🔴 |
| Erros rastreados | 0% | 🔴 |
| Ações auditadas | 0% | 🔴 |
| Uptime monitoring | 0% | 🔴 |
| Alertas configurados | 0 | 🔴 |
| MTTR (Mean Time to Recovery) | ∞ | 🔴 |

### Depois (Esperado)

| Métrica | Valor | Status |
|---------|-------|--------|
| Logs estruturados | 100% | 🟢 |
| Erros rastreados | 100% | 🟢 |
| Ações auditadas | 80% | 🟢 |
| Uptime monitoring | 99.9% | 🟢 |
| Alertas configurados | 10+ | 🟢 |
| MTTR | < 30min | 🟢 |

---

## ✅ Conclusão

O sistema tem **ZERO observabilidade**, o que é **CRÍTICO** para produção.

**Prioridades:**
1. 🔴 Implementar error tracking (Sentry)
2. 🔴 Implementar logs estruturados (Pino)
3. 🔴 Criar audit logs
4. 🔴 Configurar monitoring básico
5. 🔴 Configurar alertas críticos

**Não pode ir para produção sem:**
- ✅ Error tracking
- ✅ Logs estruturados
- ✅ Audit logs
- ✅ Alertas críticos

**Status Geral:** 🔴 **CRÍTICO** (0% de observabilidade)  
**Após Correções:** 🟢 **BOM** (85% esperado)  
**Prazo Mínimo:** 2 semanas
