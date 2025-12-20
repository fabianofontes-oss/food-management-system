# DELIVERY GAPS & BACKLOG
**Data:** 2024-12-20 00:15  
**Baseado em:** Auditoria Zero Trust

---

## 🔴 P0 - CRÍTICO (Bloqueia operação)

| # | GAP | ÁREA | DESCRIÇÃO | ESFORÇO | ARQUIVO AFETADO |
|---|-----|------|-----------|---------|-----------------|
| 1 | Stats mock em /driver/dashboard | Driver | totalDeliveries, pendingDeliveries são 0 hardcoded | S | `src/app/driver/dashboard/page.tsx:119-125` |
| 2 | Entregas pendentes sempre vazio | Driver | Lista não consulta banco real | S | `src/app/driver/dashboard/page.tsx:273-278` |

**Nota:** Usando `/[slug]/motorista` estes P0 não existem - página completa.

---

## 🟡 P1 - IMPORTANTE (Pré-produção)

| # | GAP | ÁREA | DESCRIÇÃO | ESFORÇO | AÇÃO |
|---|-----|------|-----------|---------|------|
| 3 | RLS muito permissivo | DB | drivers/deliveries usam `USING (true)` | M | Restringir por store_id |
| 4 | Duplicidade de páginas driver | UX | 2 páginas com features diferentes | M | Unificar ou redirecionar |
| 5 | Sem aprovação de motorista | SuperAdmin | Lojista cria driver sem validação | M | Criar workflow aprovação |
| 6 | /driver/dashboard sem fluxo entregas | Driver | Só afiliados funciona | M | Migrar código de /motorista |
| 7 | Rastreio tempo real ausente | Delivery | Mapa com posição do driver | L | Integrar Google Maps API |

---

## 🟢 P2 - MELHORIAS (Nice to have)

| # | GAP | ÁREA | DESCRIÇÃO | ESFORÇO |
|---|-----|------|-----------|---------|
| 8 | Chat driver-loja | Delivery | Comunicação direta | M |
| 9 | Comprovante de entrega | Delivery | Foto + assinatura | M |
| 10 | Push notifications mobile | Driver | FCM/OneSignal | M |
| 11 | Fila de entregas | Delivery | Ordenação por proximidade | L |
| 12 | Relatórios exportáveis | Merchant | CSV/PDF de entregas | S |
| 13 | Driver rating detalhado | Avaliação | Breakdown por critério | S |

---

## 📊 ESTIMATIVAS DE ESFORÇO

| Código | Descrição | Horas |
|--------|-----------|-------|
| **S** | Small | 1-2h |
| **M** | Medium | 3-6h |
| **L** | Large | 8-16h |

---

## 🎯 PRIORIZAÇÃO SUGERIDA

### Sprint 1 (Curto prazo - 1 semana)

| # | Item | Esforço | Justificativa |
|---|------|---------|---------------|
| 1-2 | Corrigir mock em /driver/dashboard | S+S | Página funcional |
| 3 | Melhorar RLS | M | Segurança |

**Total estimado:** 6-8h

### Sprint 2 (Médio prazo - 2 semanas)

| # | Item | Esforço | Justificativa |
|---|------|---------|---------------|
| 4 | Unificar páginas driver | M | UX consistente |
| 5 | Aprovação de motorista | M | Controle administrativo |
| 6 | Completar /driver/dashboard | M | Domínio driver.entregou.food |

**Total estimado:** 12-18h

### Sprint 3 (Longo prazo)

| # | Item | Esforço | Justificativa |
|---|------|---------|---------------|
| 7 | Rastreio tempo real | L | Feature premium |
| 8-13 | Melhorias diversas | Variado | Nice to have |

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Driver MVP (/[slug]/motorista)

- [x] Login por telefone
- [x] Ver entregas pendentes
- [x] Aceitar/recusar entrega
- [x] Mudar status (coletei/saí/entreguei)
- [x] Ver histórico
- [x] Ver ganhos/comissões
- [x] Navegação Google Maps
- [x] Notificações sonoras
- [x] Realtime updates
- [ ] Push notifications
- [ ] Chat com loja

### Driver MVP (/driver/dashboard)

- [x] Auth via Supabase
- [x] Ver lojas vinculadas
- [ ] Ver entregas pendentes
- [ ] Aceitar/recusar entrega
- [ ] Mudar status
- [ ] Ver histórico
- [ ] Ver ganhos
- [x] Afiliados completo
- [ ] Navegação Maps
- [ ] Realtime

### Merchant Delivery MVP

- [x] CRUD motoristas
- [x] Atribuir entrega a driver
- [x] Workflow de status
- [x] Métricas
- [x] Realtime updates
- [x] Notificações
- [x] Link de rastreio
- [x] Impressão de etiquetas
- [x] Histórico por motorista
- [x] Comissões calculadas
- [ ] Aprovação via SuperAdmin
- [ ] Mapa tempo real

### SuperAdmin Delivery

- [x] Ver total de drivers
- [x] Toggle Motoristas Globais
- [x] Toggle Realtime GPS
- [ ] Listar todos drivers
- [ ] Aprovar/reprovar driver
- [ ] Gerenciar comissões globais
- [ ] Relatórios de delivery

---

## 🔧 AÇÕES IMEDIATAS RECOMENDADAS

### Opção A: Manter /motorista como principal
1. Documentar que `/[slug]/motorista` é a versão operacional
2. Redirecionar `/driver/dashboard` → `/motorista` (com loja padrão)
3. **Esforço:** 2h

### Opção B: Unificar em /driver/dashboard
1. Migrar código de `/motorista` para `/driver/dashboard`
2. Adaptar auth (Supabase user em vez de telefone)
3. Manter `/motorista` como redirect
4. **Esforço:** 6-8h

### Recomendação: **Opção A** (curto prazo) + **Opção B** (médio prazo)
