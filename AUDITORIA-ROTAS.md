# 🗺️ AUDITORIA DE ROTAS - Food Management System

**Data:** 21/12/2024 | **Build:** ✅ Passando

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 P0 - Resolver Imediatamente

| # | Problema | Localização | Impacto | Ação |
|---|----------|-------------|---------|------|
| 1 | **Pasta `/admin` vazia** | `src/app/admin/` | Conflito com super-admin | ❌ DELETAR |
| 2 | **Duplicação motorista** | `/driver/dashboard` vs `/[slug]/motorista` | Confusão UX | 🔄 CONSOLIDAR |
| 3 | **Landing duplicada** | `/landing` (redirect para `/`) | Manutenção dupla | ❌ REMOVER |

### 🟡 P1 - Resolver em Breve

| # | Problema | Localização | Impacto | Ação |
|---|----------|-------------|---------|------|
| 4 | **Garçom duplicado** | `/[slug]/garcom` vs `/[slug]/waiter` | Inconsistência | ❌ REMOVER `/waiter` |
| 5 | **Settings duplicado** | `/settings` vs `/settings/index` | Rota redundante | ❌ REMOVER `/index` |
| 6 | **API publish duplicada** | `publish-draft` vs `store/publish` | API legada | 🏷️ DEPRECAR `publish-draft` |
| 7 | **Order vs Pedido** | `/order/[id]` vs `/pedido/[code]` | Nomenclatura confusa | 📝 DOCUMENTAR |

### 🟢 P2 - Avaliar

| # | Problema | Localização | Impacto | Ação |
|---|----------|-------------|---------|------|
| 8 | **Pasta `actions/`** | `src/app/actions/` | Propósito unclear | 🔍 INVESTIGAR |
| 9 | **10 rotas health** | `/admin/health/*` | Complexidade | 📊 AVALIAR |

---

## 📊 RESUMO EXECUTIVO

### Estatísticas

- **Total de Páginas:** 85+
- **Total de APIs:** 30
- **Rotas Públicas:** 12
- **Rotas Protegidas:** 60+
- **Rotas Admin:** 30+
- **Problemas Críticos:** 3
- **Problemas Médios:** 4
- **Problemas Baixos:** 2

### Status Geral

✅ **Arquitetura:** Sólida (route groups, middleware, multi-tenant)  
⚠️ **Duplicações:** 6 rotas duplicadas ou redundantes  
✅ **Segurança:** Middleware protegendo rotas corretamente  
⚠️ **Nomenclatura:** Inconsistências (PT/EN, order/pedido)  
✅ **Organização:** API routes bem estruturadas  

---

## 🎯 RECOMENDAÇÕES PRIORITÁRIAS

### 1️⃣ DELETAR (Imediato)

```bash
# Pasta vazia
rm -rf src/app/admin/

# Landing duplicada
rm -rf src/app/(public)/landing/

# Garçom em inglês
rm -rf src/app/[slug]/waiter/

# Settings duplicado
rm -rf src/app/[slug]/dashboard/settings/index/
```

### 2️⃣ CONSOLIDAR (Esta Sprint)

**Motorista:** Decidir entre:
- **Opção A:** Manter apenas `/[slug]/motorista` (por loja)
- **Opção B:** Manter apenas `/driver/dashboard` (global multi-loja)
- **Recomendação:** Opção A (alinhado com arquitetura multi-tenant)

### 3️⃣ DOCUMENTAR (Esta Sprint)

Criar `ROTAS.md` explicando:
- `/[slug]/order/[orderId]` → Confirmação interna (UUID)
- `/[slug]/pedido/[code]` → Rastreamento público (código amigável)
- Diferença entre `/garcom` (dashboard) e `/mesa/[numero]` (atendimento)

### 4️⃣ DEPRECAR (Próxima Release)

```typescript
// src/app/api/onboarding/publish-draft/route.ts
// @deprecated Use /api/onboarding/store/publish instead
// TODO: Remover em v2.0
```

---

## 📋 MAPEAMENTO COMPLETO

### 🌐 PÚBLICAS (12 rotas)

| URL | Propósito | Status |
|-----|-----------|--------|
| `/` | Landing | ✅ |
| `/login` | Autenticação | ✅ |
| `/signup` | Cadastro | ✅ |
| `/[slug]` | Cardápio público | ✅ |
| `/[slug]/cart` | Carrinho | ✅ |
| `/[slug]/checkout` | Finalizar pedido | ✅ |
| `/r/[code]` | Referral landing | ✅ |
| `/s/[slug]` | Cardápio via subdomínio | ✅ |
| `/unauthorized` | Acesso negado | ✅ |
| `/mapa-do-site` | Sitemap | ✅ |
| `/qa` | FAQ | ✅ |
| `/landing` | ⚠️ DUPLICADA | ❌ |

### 🔐 DASHBOARD (39 rotas)

**Core:**
- `/[slug]/dashboard` - Home
- `/[slug]/dashboard/products` - Cardápio
- `/[slug]/dashboard/orders` - Pedidos
- `/[slug]/dashboard/kitchen` - Cozinha (KDS)
- `/[slug]/dashboard/delivery` - Entregas
- `/[slug]/dashboard/pos` - PDV

**Operações:**
- `/[slug]/dashboard/tables` - Mesas
- `/[slug]/dashboard/reservations` - Reservas
- `/[slug]/dashboard/inventory` - Estoque
- `/[slug]/dashboard/custom-orders` - Encomendas
- `/[slug]/dashboard/waiters` - Garçons
- `/[slug]/dashboard/team` - Equipe

**Vendas:**
- `/[slug]/dashboard/financial` - Financeiro
- `/[slug]/dashboard/reports` - Relatórios
- `/[slug]/dashboard/analytics` - Métricas
- `/[slug]/dashboard/coupons` - Cupons
- `/[slug]/dashboard/marketing` - Campanhas

**Clientes:**
- `/[slug]/dashboard/crm` - CRM
- `/[slug]/dashboard/reviews` - Avaliações
- `/[slug]/dashboard/afiliados` - Afiliados

**Configurações (10 rotas):**
- `/[slug]/dashboard/settings` - Geral
- `/[slug]/dashboard/settings/store` - Dados loja
- `/[slug]/dashboard/settings/integrations` - Integrações
- `/[slug]/dashboard/settings/platforms` - Marketplaces
- `/[slug]/dashboard/settings/loyalty` - Fidelidade
- `/[slug]/dashboard/settings/niche` - Template
- `/[slug]/dashboard/settings/modules` - Módulos
- `/[slug]/dashboard/settings/scheduling` - Horários
- `/[slug]/dashboard/settings/complete` - Completar
- `/[slug]/dashboard/settings/index` - ⚠️ DUPLICADA

**Avançado:**
- `/[slug]/dashboard/appearance` - Aparência
- `/[slug]/dashboard/addons` - Complementos
- `/[slug]/dashboard/kits` - Combos
- `/[slug]/dashboard/onboarding` - Wizard

### 👤 CLIENTE (6 rotas)

- `/[slug]/minha-conta` - Perfil
- `/[slug]/minha-conta/pedidos` - Histórico
- `/[slug]/minha-conta/fidelidade` - Pontos
- `/[slug]/mimo/[token]` - Resgate
- `/[slug]/avaliar/[deliveryId]` - Avaliar
- `/[slug]/confirmar/[deliveryId]` - Confirmar

### 🚗 MOTORISTA (6 rotas)

**Por Loja:**
- `/[slug]/motorista` - Dashboard
- `/[slug]/motorista/ganhos` - Ganhos
- `/[slug]/motorista/historico` - Histórico
- `/[slug]/motorista/indicacoes` - Afiliados
- `/[slug]/motorista/perfil` - Perfil

**Global:**
- `/driver/dashboard` - ⚠️ DUPLICADO

### 🍽️ GARÇOM (2 rotas)

- `/[slug]/garcom` - Dashboard PT
- `/[slug]/waiter` - ⚠️ DUPLICADO EN

### 👨‍💼 SUPER ADMIN (30+ rotas)

**Core:**
- `/admin` - Dashboard
- `/admin/tenants` - Tenants
- `/admin/stores` - Lojas
- `/admin/users` - Usuários
- `/admin/plans` - Planos
- `/admin/billing` - Billing

**Afiliados:**
- `/admin/affiliates` - Visão geral
- `/admin/affiliates/sales` - Vendas
- `/admin/affiliates/payouts` - Pagamentos
- `/admin/affiliates/settings` - Config

**Sistema:**
- `/admin/analytics` - Analytics
- `/admin/reports` - Relatórios
- `/admin/logs` - Logs
- `/admin/audit` - Auditoria
- `/admin/features` - Feature flags
- `/admin/integrations` - Integrações
- `/admin/automations` - Automações
- `/admin/tickets` - Suporte
- `/admin/demanda` - Roadmap

**Health (10 rotas):**
- `/admin/health` - Overview
- `/admin/health/monitor` - Monitor
- `/admin/health/database` - Banco
- `/admin/health/audit` - Auditoria
- `/admin/health/pages` - Páginas
- `/admin/health/files` - Arquivos
- `/admin/health/images` - Imagens
- `/admin/health/printing` - Impressão
- `/admin/health/slugs` - Slugs
- `/admin/health/builder` - Builder

### 🔌 API (30 endpoints)

**Admin:** 4 endpoints  
**Billing:** 1 endpoint  
**Cron:** 2 endpoints  
**Draft Store:** 3 endpoints  
**Health:** 7 endpoints  
**Integrations:** 2 endpoints  
**Onboarding:** 5 endpoints (1 duplicado)  
**Utilities:** 6 endpoints  

---

## ✅ CHECKLIST DE AÇÕES

### Imediato (Hoje)

- [ ] Deletar `src/app/admin/` (pasta vazia)
- [ ] Deletar `src/app/(public)/landing/`
- [ ] Deletar `src/app/[slug]/waiter/`
- [ ] Deletar `src/app/[slug]/dashboard/settings/index/`

### Esta Semana

- [ ] Decidir estratégia de motorista (global vs por loja)
- [ ] Implementar decisão de motorista
- [ ] Adicionar `@deprecated` em `publish-draft`
- [ ] Criar `docs/ROTAS.md` com explicações

### Próximo Sprint

- [ ] Remover API `publish-draft` (após migração)
- [ ] Avaliar necessidade de todas as rotas `/admin/health/*`
- [ ] Padronizar nomenclatura (tudo PT ou criar i18n)
- [ ] Investigar pasta `actions/` e mover conteúdo

---

## 📝 NOTAS FINAIS

### Pontos Fortes

✅ Arquitetura multi-tenant bem implementada  
✅ Middleware robusto com roteamento por host  
✅ Separação clara de responsabilidades  
✅ Route groups bem utilizados  
✅ Proteção de rotas funcionando  

### Áreas de Melhoria

⚠️ Eliminar duplicações (6 identificadas)  
⚠️ Padronizar nomenclatura (PT/EN)  
⚠️ Documentar diferenças entre rotas similares  
⚠️ Limpar código legado (pasta admin, APIs antigas)  

### Próximos Passos

1. Executar checklist de ações imediatas
2. Validar com stakeholders decisão sobre motorista
3. Atualizar documentação de rotas
4. Criar testes E2E para rotas críticas

---

**Gerado por:** Cascade AI  
**Última atualização:** 21/12/2024
