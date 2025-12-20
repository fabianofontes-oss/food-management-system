# BACKLOG - TRABALHO RESTANTE - AUDITORIA 08
**Data:** 2024-12-19 23:27  
**Projeto:** food-management-system

---

## 📊 RESUMO EXECUTIVO

| Categoria | % Completo | Itens Restantes |
|-----------|------------|-----------------|
| Infraestrutura | 100% | 0 |
| Roteamento/Domínios | 100% | 0 |
| Onboarding | 100% | 0 |
| Dashboard Lojista | 95% | 1 |
| SuperAdmin | 100% | 0 |
| Driver Dashboard | 90% | 2 |
| Billing Enforcement | 95% | 1 |
| Afiliados | 60% | 3 |
| Gateway Pagamento | 0% | 5 |
| **TOTAL** | **~85%** | **12 itens** |

---

## 🔴 P0 - CRÍTICO (Bloqueia produção)

| # | Item | Esforço | Descrição | Arquivo/Local |
|---|------|---------|-----------|---------------|
| 1 | Executar migrations afiliados | S (5min) | Rodar 3 SQLs no Supabase | `supabase/migrations/20251219000004-6*.sql` |
| 2 | Teste manual billing | S (10min) | Validar 4 URLs no navegador | URLs test-* |

**Total P0:** 2 itens, ~15 minutos

---

## 🟡 P1 - IMPORTANTE (Pré-release ou sprint seguinte)

| # | Item | Esforço | Descrição | Dependência |
|---|------|---------|-----------|-------------|
| 3 | Integração gateway pagamento | L | Stripe ou MercadoPago | - |
| 4 | Webhooks de pagamento | M | Processar eventos de cobrança | #3 |
| 5 | Suspensão automática | M | Cron ou trigger para suspender inadimplentes | #4 |
| 6 | Faturas automáticas | M | Gerar e enviar faturas | #3 |
| 7 | Integração checkout→afiliados | M | Registrar sale quando pedido é pago | #3 |
| 8 | Payout/ledger afiliados | M | Controlar saldo e saques | #7 |

**Total P1:** 6 itens, ~2-3 sprints

---

## 🟢 P2 - MELHORIAS (Nice to have)

| # | Item | Esforço | Descrição |
|---|------|---------|-----------|
| 9 | Testes E2E billing | M | Playwright para billing enforcement |
| 10 | Driver entregas reais | M | Integrar com tabela deliveries |
| 11 | Driver avaliações | S | Componente de rating |
| 12 | APM/Observabilidade | M | Sentry, DataDog ou similar |

**Total P2:** 4 itens, ~1-2 sprints

---

## 📅 CAMINHO CRÍTICO PARA GO

```
AGORA (15 min)
├── [P0] Executar migrations afiliados (5 min)
├── [P0] Teste manual billing (10 min)
└── ✅ GO PARA PRODUÇÃO (MVP)

SPRINT 1 (após GO)
├── [P1] Integração gateway pagamento
├── [P1] Webhooks de pagamento
└── [P1] Suspensão automática

SPRINT 2
├── [P1] Faturas automáticas
├── [P1] Integração checkout→afiliados
└── [P1] Payout/ledger afiliados

SPRINT 3+
├── [P2] Testes E2E
├── [P2] Driver entregas reais
├── [P2] Driver avaliações
└── [P2] Observabilidade avançada
```

---

## 📋 DETALHAMENTO DOS ITENS

### P0-1: Executar Migrations Afiliados
**Descrição:** As tabelas de afiliados (referral_partners, referral_codes, tenant_referrals, referral_sales) estão definidas em migrations mas não foram executadas no Supabase de produção.

**Ação:**
```sql
-- Executar no Supabase SQL Editor (em ordem):
\i supabase/migrations/20251219000004_referral_affiliates.sql
\i supabase/migrations/20251219000005_referral_rls_selfservice.sql
\i supabase/migrations/20251219000006_referral_driver_split.sql
```

**Critério de aceite:** Tabelas referral_* existem e RLS está habilitado.

---

### P0-2: Teste Manual Billing
**Descrição:** O billing enforcement está implementado em código mas não foi testado em produção.

**Ação:**
1. Login em https://app.pediu.food
2. Acessar:
   - `/test-active/dashboard` → Deve carregar dashboard
   - `/test-trial-expired/dashboard` → Deve redirecionar para `/billing/trial-expired`
   - `/test-past-due/dashboard` → Deve carregar com banner read-only
   - `/test-suspended/dashboard` → Deve redirecionar para `/billing/suspended`
3. Em `/test-past-due/dashboard`, tentar criar produto → Deve falhar

**Critério de aceite:** 4 cenários funcionam conforme esperado.

---

### P1-3: Integração Gateway Pagamento
**Descrição:** Conectar com Stripe ou MercadoPago para processar cobranças automaticamente.

**Arquivos a criar:**
- `src/lib/payment/stripe.ts` ou `src/lib/payment/mercadopago.ts`
- `src/app/api/webhooks/stripe/route.ts`
- Migrations para tabelas de subscription/invoice

**Estimativa:** 3-5 dias

---

### P1-7: Integração Checkout→Afiliados
**Descrição:** Quando um pedido é pago, registrar a venda no sistema de afiliados se houver código de referral associado.

**Lógica:**
1. No checkout, capturar `referral_code` (cookie ou query param)
2. Ao confirmar pagamento, criar registro em `referral_sales`
3. Calcular comissão (80% driver, 20% recruiter)
4. Status inicial: PENDING (D+60)

**Arquivos a modificar:**
- `src/modules/orders/actions.ts`
- `src/modules/referral/actions.ts` (novo)

**Estimativa:** 2-3 dias

---

## 📈 MÉTRICAS DE PROGRESSO

| Semana | P0 | P1 | P2 | % Total |
|--------|----|----|----|---------| 
| Atual | 2 | 6 | 4 | 85% |
| +1 semana | 0 | 6 | 4 | 87% |
| +2 semanas | 0 | 3 | 4 | 92% |
| +4 semanas | 0 | 0 | 2 | 98% |

---

## 🎯 QUANTO FALTA PARA FINALIZAR

| Fase | Itens | Tempo | Resultado |
|------|-------|-------|-----------|
| **MVP (GO)** | 2 P0 | 15 min | Sistema funcional para primeiros clientes |
| **v1.0** | + 6 P1 | 2-3 sprints | Billing automático + afiliados completos |
| **v1.1** | + 4 P2 | 1-2 sprints | Polimento e observabilidade |

**Conclusão:** O sistema está a **15 minutos** de ir para produção como MVP, e a **2-3 sprints** de estar 100% completo com billing automático.
