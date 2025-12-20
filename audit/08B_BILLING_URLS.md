# BILLING ENFORCEMENT - URLs DE TESTE
**Gerado em:** 2024-12-19 23:32

---

## BASE URLs

```
BASE_1=https://app.pediu.food
BASE_2=https://www.pediu.food
```

---

## URLs DE TESTE

### 1. test-active (Tenant ATIVO)
```
${BASE}/test-active/dashboard
```
**Esperado:** 
- Status: 200 OK
- Comportamento: Dashboard carrega normalmente
- Redirect: NENHUM
- Mode: ALLOW

---

### 2. test-trial-expired (Tenant TRIAL EXPIRADO)
```
${BASE}/test-trial-expired/dashboard
```
**Esperado:**
- Status: 307/302 Redirect
- Redirect para: `/billing/trial-expired`
- Mode: BLOCK
- Reason: TRIAL_EXPIRED

---

### 3. test-past-due (Tenant INADIMPLENTE - GRACE PERIOD)
```
${BASE}/test-past-due/dashboard
```
**Esperado:**
- Status: 200 OK
- Comportamento: Dashboard carrega COM banner de aviso
- Redirect: NENHUM
- Mode: READ_ONLY
- Reason: PAST_DUE_GRACE
- Mutações: BLOQUEADAS

---

### 4. test-suspended (Tenant SUSPENSO)
```
${BASE}/test-suspended/dashboard
```
**Esperado:**
- Status: 307/302 Redirect
- Redirect para: `/billing/suspended`
- Mode: BLOCK
- Reason: SUSPENDED

---

## TESTE DE MUTAÇÃO (test-past-due)

No cenário `test-past-due`:
1. Acessar dashboard (deve carregar)
2. Tentar criar produto/pedido
3. **Esperado:** Erro "Ação bloqueada: pagamento atrasado"

---

## HEADERS RELEVANTES

| Header | Descrição |
|--------|-----------|
| `x-billing-mode` | ALLOW, READ_ONLY ou BLOCK |
| `x-billing-reason` | Motivo do bloqueio |
| `x-billing-grace-days` | Dias restantes de grace period |
| `Location` | URL de redirect (quando BLOCK) |

---

## RESULTADO ESPERADO

| URL | Status | Redirect | Mode |
|-----|--------|----------|------|
| test-active | 200 | - | ALLOW |
| test-trial-expired | 307 | /billing/trial-expired | BLOCK |
| test-past-due | 200 | - | READ_ONLY |
| test-suspended | 307 | /billing/suspended | BLOCK |
