# AUDITORIA COMPLETA - MÓDULO DELIVERY
**Data:** 2025-12-20  
**Status:** Sistema funcional com gaps identificados

---

## 1. ESTRUTURA DE MÓDULOS

### ✅ `src/modules/driver/` (Completo)
**Propósito:** Módulo vertical slice para operação do motorista

**Arquivos:**
- `types.ts` - Tipagem Zod + interfaces (Delivery, DriverProfile, DriverStats)
- `repository.ts` - Queries Supabase (getDriverDeliveries, updateDeliveryStatus, etc.)
- `actions.ts` - Server Actions (updateDeliveryStatusAction, getCustomerNotificationMessage)
- `index.ts` - Barrel export

**Componentes:**
- `DriverDashboardShell.tsx` - Shell unificado do dashboard
- `DeliveryProofCapture.tsx` - Captura de foto obrigatória
- `DeliveryQRCode.tsx` - Geração de QR Code para confirmação
- `GPSToggle.tsx` - Toggle GPS on/off
- `NavigationChooser.tsx` - Escolha Google Maps/Waze
- `SignatureCapture.tsx` - Assinatura digital do cliente
- `DriverPhotoUpload.tsx` - Upload foto do motorista
- `tabs/` - DeliveriesTab, HistoryTab, EarningsTab, AffiliatesTab

**Hooks:**
- `useDriverDeliveries` - Gerencia entregas do motorista
- `useDriverStats` - Estatísticas (hoje, semana, total)
- `useDriverRealtime` - Realtime updates
- `useDriverLocation` - GPS sharing

**Utils:**
- `whatsapp.ts` - Mensagens prontas + links
- `delivery-fee.ts` - Cálculo de frete por distância

**Integrações:**
- `marketplace.ts` - Base iFood/Rappi/Uber (stub)

---

### ✅ `src/modules/delivery/` (NOVO - Recém criado)
**Propósito:** Configurações e turnos (backend logic)

**Arquivos:**
- `types.ts` - DeliverySettings, DriverShift, schemas Zod
- `repository.ts` - CRUD settings + turnos
- `actions.ts` - toggleDriverShift, completeDelivery, get/updateDeliverySettings
- `index.ts` - Barrel export

**Observação:** Este módulo foi criado AGORA para suportar as novas tabelas `delivery_settings` e `driver_shifts`.

---

## 2. PÁGINAS DO LOJISTA

### ✅ `/[slug]/dashboard/delivery/page.tsx` (Completo)
**Funcionalidades:**
- ✅ CRUD de motoristas (criar, editar, excluir, ativar/desativar)
- ✅ Listagem de entregas com filtros (status, data, busca)
- ✅ Atribuir motorista para entrega
- ✅ Atualizar status da entrega
- ✅ Realtime (Supabase subscriptions)
- ✅ Notificações (WhatsApp links)
- ✅ Métricas (total entregas, receita, tempo médio)
- ✅ Histórico do motorista (entregas + ganhos)
- ✅ Comissão configurável por motorista
- ✅ Link de rastreio (gerar + copiar)
- ✅ Impressão de comprovante

**Gaps:**
- ⚠️ Não usa o novo módulo `delivery` (settings/turnos)
- ⚠️ Não exibe motoristas "online" (driver_shifts)
- ⚠️ Auto-atribuição não implementada (require setting)

---

## 3. PÁGINAS DO MOTORISTA

### ✅ `/[slug]/motorista/page.tsx` (Refatorado)
**Funcionalidades:**
- ✅ Login por telefone (busca em `drivers` ou fallback em `deliveries`)
- ✅ Usa `DriverDashboardShell` (componente unificado)
- ✅ Tabs: Entregas, Histórico, Ganhos, Afiliados
- ✅ Captura de foto obrigatória para "Entregar"
- ✅ QR Code para confirmação do cliente
- ✅ Navegação (Google Maps/Waze)
- ✅ Realtime updates

**Gaps:**
- ❌ **Não tem toggle GPS** (componente existe, mas não está plugado)
- ❌ **Não gerencia turnos** (driver_shifts não usado)
- ⚠️ Login por telefone é inseguro (sem OTP/senha)

---

### ✅ `/driver/dashboard/page.tsx` (Alternativa)
**Funcionalidades:**
- ✅ Autenticação Supabase (auth.users)
- ✅ Seleção de loja (se motorista trabalha em múltiplas)
- ✅ Usa `DriverDashboardShell`

**Observação:** Esta rota é para motoristas autenticados (role DRIVER em store_users). A rota `/[slug]/motorista` é para login rápido por telefone.

---

## 4. PÁGINAS DO CLIENTE

### ✅ `/[slug]/rastreio/[deliveryId]/page.tsx` (Completo)
**Funcionalidades:**
- ✅ Timeline de status (pending → delivered)
- ✅ Informações do motorista (nome, telefone, foto)
- ✅ Mapa com localização em tempo real (Google Maps embed)
- ✅ Realtime updates (status + GPS)
- ✅ Link para WhatsApp do motorista
- ✅ Link para WhatsApp da loja
- ✅ Estimativa de tempo

**Gaps:**
- ⚠️ Mapa depende de `driver_latitude/longitude` (precisa GPS ativo)
- ⚠️ Sem fallback se Google Maps API não configurada

---

### ✅ `/[slug]/confirmar/[deliveryId]/page.tsx` (Completo)
**Funcionalidades:**
- ✅ Botão "Confirmar Recebimento"
- ✅ Salva `customer_confirmed_at`
- ✅ Redireciona para avaliação
- ✅ Exibe se já foi confirmado

**Gaps:**
- ⚠️ Não valida código/QR (só clica no botão)
- ⚠️ Qualquer pessoa com link pode confirmar

---

### ✅ `/[slug]/avaliar/[deliveryId]/page.tsx` (Completo)
**Funcionalidades:**
- ✅ Avaliação com estrelas (1-5)
- ✅ Comentário opcional
- ✅ Salva em `deliveries.driver_rating`, `rating_comment`, `rated_at`
- ✅ Exibe se já foi avaliado

**Gaps:**
- ❌ **Não atualiza média do motorista** (drivers.rating)
- ⚠️ Qualquer pessoa com link pode avaliar

---

## 5. BANCO DE DADOS

### ✅ Tabelas Existentes
- `stores` - Lojas
- `orders` - Pedidos (status: PENDING → DELIVERED)
- `deliveries` - Entregas (1:1 com orders, campos: driver_name, status, proof_photo_url, etc.)
- `drivers` - Motoristas (commission_percent, total_earnings, rating)
- `store_users` - Associação user↔store (role: DELIVERY)

### ✅ Migrations Recentes (Sessão anterior)
- `20251220000001_delivery_proof_photo.sql` - Adiciona `proof_photo_url`
- `20251220000002_delivery_confirmation.sql` - Adiciona `customer_confirmed_at`, `confirmation_code`
- `20251220000003_delivery_location.sql` - Adiciona `driver_latitude`, `driver_longitude`, `driver_location_updated_at`
- `20251220000004_delivery_signature_driver_photo.sql` - Adiciona `customer_signature_url`, `drivers.photo_url`, `timeout_at`, `refusal_reason`

### ✅ Migration Nova (Esta sessão)
- `20251220000005_delivery_settings_and_shifts.sql` - Adiciona:
  - `delivery_settings` (1:1 com stores)
  - `driver_shifts` (turnos online/offline)
  - Trigger `enforce_delivery_proof_photo()` (valida foto ao marcar DELIVERED)
  - RLS completo

---

## 6. FLUXO ATUAL (O QUE FUNCIONA)

### Lojista → Motorista → Cliente
1. **Lojista** cria entrega no dashboard (`/[slug]/dashboard/delivery`)
2. **Lojista** atribui motorista (manual ou futuro: auto)
3. **Motorista** acessa `/[slug]/motorista` (login por telefone)
4. **Motorista** vê entregas pendentes e avança status:
   - `assigned` → `picked_up` (Coletei)
   - `picked_up` → `in_transit` (Saí)
   - `in_transit` → `delivered` (Entregar + foto obrigatória)
5. **Cliente** rastreia em `/[slug]/rastreio/[deliveryId]`
6. **Cliente** confirma em `/[slug]/confirmar/[deliveryId]`
7. **Cliente** avalia em `/[slug]/avaliar/[deliveryId]`

---

## 7. GAPS CRÍTICOS (P0)

### ❌ 1. Trigger de foto NÃO ESTÁ ATIVO
**Problema:** O trigger `enforce_delivery_proof_photo()` foi criado na migration, mas **não foi aplicado** (migration não rodou no banco).

**Solução:** Rodar migration no Supabase.

---

### ❌ 2. GPS Toggle não está plugado
**Problema:** Componente `GPSToggle` existe, mas não está na UI do motorista.

**Solução:** Adicionar `<GPSToggle />` no `DriverDashboardShell` ou na página `/[slug]/motorista`.

---

### ❌ 3. Turnos (driver_shifts) não usados
**Problema:** Tabela criada, mas nenhuma página usa `toggleDriverShift()`.

**Solução:** Adicionar botão "Entrar/Sair do Turno" no dashboard do motorista.

---

### ❌ 4. Avaliação não atualiza média do motorista
**Problema:** Ao avaliar, salva em `deliveries.driver_rating`, mas não recalcula `drivers.rating`.

**Solução:** Criar trigger ou atualizar no Server Action.

---

### ❌ 5. Confirmação/Avaliação sem autenticação
**Problema:** Qualquer pessoa com link pode confirmar/avaliar.

**Solução:** Adicionar token único no link ou validar código QR.

---

## 8. GAPS IMPORTANTES (P1)

### ⚠️ 1. Configurações de delivery não têm UI
**Problema:** Tabela `delivery_settings` existe, mas não há página para configurar.

**Solução:** Criar `/[slug]/dashboard/delivery/settings` com form para:
- `require_proof_photo`
- `auto_assign_orders`
- `delivery_fee_type`

---

### ⚠️ 2. Auto-atribuição não implementada
**Problema:** Flag `auto_assign_orders` existe, mas lógica não.

**Solução:** Criar Server Action que:
- Busca motoristas disponíveis (is_available=true, driver_shifts.status=active)
- Atribui por critério (menos entregas, mais próximo, etc.)

---

### ⚠️ 3. SLA/Timeout não implementado
**Problema:** Coluna `timeout_at` existe, mas não há lógica de alerta/reatribuição.

**Solução:** Criar cron job ou Edge Function que:
- Verifica entregas `in_transit` > X minutos
- Envia notificação ou reatribui

---

### ⚠️ 4. Cálculo de frete não está no checkout
**Problema:** Utils `delivery-fee.ts` existem, mas não são usados no fluxo de pedido.

**Solução:** Integrar no checkout (calcular frete por distância).

---

### ⚠️ 5. Marketplace (iFood/Rappi/Uber) é stub
**Problema:** Base existe em `marketplace.ts`, mas não há webhooks/import real.

**Solução:** Implementar quando houver credenciais/homologação.

---

## 9. RECOMENDAÇÕES

### Prioridade AGORA (P0)
1. ✅ Rodar migration `20251220000005_delivery_settings_and_shifts.sql` no Supabase
2. ✅ Adicionar `<GPSToggle />` na página do motorista
3. ✅ Adicionar botão "Entrar/Sair do Turno" (usar `toggleDriverShift`)
4. ✅ Criar trigger/action para atualizar `drivers.rating` ao avaliar
5. ✅ Adicionar validação de token nos links de confirmação/avaliação

### Próximos Passos (P1)
1. Criar página de configurações de delivery (`/[slug]/dashboard/delivery/settings`)
2. Implementar auto-atribuição de motoristas
3. Implementar SLA/timeout com alertas
4. Integrar cálculo de frete no checkout
5. Testar fluxo completo end-to-end

---

## 10. CONCLUSÃO

**Status Geral:** ✅ Sistema funcional para operação básica

**O que está pronto:**
- CRUD de motoristas (lojista)
- Operação do motorista (entregas, foto, navegação)
- Rastreio do cliente (tempo real)
- Confirmação e avaliação

**O que falta para produção:**
- Aplicar migration (trigger de foto)
- Plugar GPS toggle e turnos
- Atualizar média de rating
- Segurança nos links públicos
- UI de configurações

**Diferencial competitivo:**
- ✅ GPS em tempo real
- ✅ Foto obrigatória
- ✅ QR Code confirmação
- ✅ Assinatura digital
- ✅ Navegação integrada
- 🔜 Integração marketplaces (quando credenciais)

---

**Próxima ação recomendada:** Rodar migration e plugar GPS/turnos na UI.
