# DRIVER UNIFICATION STATUS
**Data:** 2024-12-20 00:45  
**Branch:** main

---

## RESUMO

Criado módulo unificado `src/modules/driver/` com componentes, hooks e tipos compartilhados.
A página `/driver/dashboard` foi refatorada para usar o novo módulo.
A página `/[slug]/motorista` foi mantida como está (100% funcional, 622 linhas).

---

## ESTRUTURA CRIADA

```
src/modules/driver/
├── types.ts                         # Tipos compartilhados (Delivery, DriverStats, etc)
├── repository.ts                    # Queries ao Supabase
├── index.ts                         # Barrel export
├── hooks/
│   ├── useDriverDeliveries.ts       # Hook para buscar/gerenciar entregas
│   ├── useDriverStats.ts            # Hook para calcular estatísticas
│   └── useDriverRealtime.ts         # Hook para subscriptions realtime
└── components/
    ├── DriverDashboardShell.tsx     # Shell principal com tabs
    └── tabs/
        ├── DeliveriesTab.tsx        # Tab de entregas pendentes
        ├── HistoryTab.tsx           # Tab de histórico
        ├── EarningsTab.tsx          # Tab de ganhos
        └── AffiliatesTab.tsx        # Tab de afiliados
```

---

## O QUE FOI MOVIDO/EXTRAÍDO

### De `/[slug]/motorista/page.tsx` (fonte de referência)

| Componente | Origem (linhas) | Destino |
|------------|-----------------|---------|
| Interface Delivery | L16-30 | `types.ts` |
| Interface DriverStats | L32-40 | `types.ts` |
| STATUS_LABELS | L284-294 | `types.ts` |
| STATUS_COLORS | L272-282 | `types.ts` |
| calculateStats() | L231-256 | `repository.ts` |
| updateStatus() | L258-269 | `repository.ts` |
| getGoogleMapsLink | L517-524 | `repository.ts` |
| Realtime subscription | L154-183 | `useDriverRealtime.ts` |
| playNotificationSound | L185-229 | `useDriverRealtime.ts` |
| Lista entregas | L453-530 | `DeliveriesTab.tsx` |
| Histórico | L533-562 | `HistoryTab.tsx` |
| Ganhos | L565-616 | `EarningsTab.tsx` |

### De `/driver/dashboard/page.tsx`

| Componente | Origem (linhas) | Destino |
|------------|-----------------|---------|
| Tab Afiliados | L255-376 | `AffiliatesTab.tsx` |
| ReferralData interface | L23-33 | `types.ts` |

---

## O QUE FICOU COMO LEGACY

### `/[slug]/motorista/page.tsx` (622 linhas)

**Status:** ✅ Mantido integralmente - funciona 100%

**Motivo:** 
- Página já está completa e operacional
- Login por telefone é característica única
- Refatorar poderia introduzir bugs
- Será migrada para usar Shell em fase futura

**Funcionalidades mantidas:**
- Login por telefone do motorista
- Stats reais (hoje/semana/total)
- Lista de entregas pendentes
- Mudança de status (coletei/saí/entreguei)
- Botão Google Maps
- Histórico de entregas
- Tab de ganhos
- Realtime com notificação sonora

---

## PÁGINAS ATUALIZADAS

### `/driver/dashboard/page.tsx` (168 linhas)

**Antes:** 411 linhas com mock data e lógica duplicada
**Depois:** 168 linhas usando módulo compartilhado

**Mudanças:**
- Usa `DriverDashboardShell` do módulo
- Seletor de loja (para drivers com múltiplas lojas)
- Stats e entregas reais via hooks
- Tab de afiliados via `AffiliatesTab`

**Fluxo:**
1. Auth via Supabase
2. Busca lojas onde user é DRIVER
3. Se múltiplas lojas → mostra seletor
4. Após selecionar → renderiza Shell

---

## COMO TESTAR

### driver.entregou.food → /driver/dashboard

1. Acessar `https://driver.entregou.food`
2. Fazer login com conta Supabase que tenha role DRIVER em alguma loja
3. Verificar:
   - [ ] Stats mostram valores reais (não 0)
   - [ ] Lista de entregas aparece (se houver)
   - [ ] Botões de status funcionam
   - [ ] Tab Afiliados funciona
   - [ ] Realtime conecta (indicador "Ao vivo")

### app.pediu.food/{slug}/motorista

1. Acessar `https://app.pediu.food/{slug}/motorista`
2. Fazer login por telefone
3. Verificar:
   - [ ] Login funciona
   - [ ] Stats mostram valores reais
   - [ ] Lista de entregas aparece
   - [ ] Botões de status funcionam
   - [ ] Histórico mostra entregas passadas
   - [ ] Ganhos mostra comissões
   - [ ] Botão Maps abre navegação
   - [ ] Som de notificação funciona

---

## PRÓXIMOS PASSOS (Futuro)

1. **Migrar /motorista para usar Shell**
   - Manter login por telefone
   - Após login, renderizar DriverDashboardShell
   - Esforço: 2-3h

2. **Vincular driver por user_id**
   - Atualmente busca por telefone ou nome
   - Ideal: tabela drivers ter coluna user_id
   - Permitiria unificação total

3. **Melhorar RLS**
   - Policies de drivers/deliveries muito permissivas
   - Restringir por store_id

---

## ARQUIVOS MODIFICADOS

| Arquivo | Ação |
|---------|------|
| `src/modules/driver/types.ts` | CRIADO |
| `src/modules/driver/repository.ts` | CRIADO |
| `src/modules/driver/index.ts` | CRIADO |
| `src/modules/driver/hooks/useDriverDeliveries.ts` | CRIADO |
| `src/modules/driver/hooks/useDriverStats.ts` | CRIADO |
| `src/modules/driver/hooks/useDriverRealtime.ts` | CRIADO |
| `src/modules/driver/components/DriverDashboardShell.tsx` | CRIADO |
| `src/modules/driver/components/tabs/DeliveriesTab.tsx` | CRIADO |
| `src/modules/driver/components/tabs/HistoryTab.tsx` | CRIADO |
| `src/modules/driver/components/tabs/EarningsTab.tsx` | CRIADO |
| `src/modules/driver/components/tabs/AffiliatesTab.tsx` | CRIADO |
| `src/app/driver/dashboard/page.tsx` | REFATORADO |
| `src/app/[slug]/motorista/page.tsx` | MANTIDO |
| `audit/09_ROUTE_MAP.md` | CRIADO |
| `audit/09_DRIVER_UNIFICATION_STATUS.md` | CRIADO |

---

## VALIDAÇÃO BUILD

```bash
npm run build
```

Verificar que não há erros de TypeScript ou ESLint relacionados ao módulo driver.
