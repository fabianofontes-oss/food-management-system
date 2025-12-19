# Análise de Segurança - 14 Functions SECURITY DEFINER

**Data:** 2024-12-19  
**Fonte:** DDL coletado do Supabase  
**Objetivo:** Identificar riscos de privilege escalation e vazamento cross-tenant

---

## 📊 Resumo Executivo

| Métrica | Valor | Status |
|---------|-------|--------|
| **Total de functions analisadas** | 14 | - |
| **Functions SEGURAS** | 11 (78.6%) | ✅ |
| **Functions com RISCOS** | 3 (21.4%) | ⚠️ |
| **Functions SEM SET search_path** | 14 (100%) | 🔴 CRÍTICO |

**Decisão:** ⚠️ **3 functions requerem correção** + **TODAS requerem SET search_path**

---

## ✅ Functions SEGURAS (11 functions)

### 1. calculate_loyalty_points
**Risco:** ✅ **BAIXO**
- ✅ Recebe `p_store_id` como parâmetro (filtro explícito)
- ✅ Apenas lê `loyalty_programs` filtrado por `store_id`
- ✅ Não modifica dados
- ❌ Sem `SET search_path`

**Uso:** Calcula pontos de fidelidade baseado no total do pedido.

---

### 2. clean_expired_drafts
**Risco:** ✅ **BAIXO**
- ✅ Deleta apenas `draft_stores` expirados (`expires_at < NOW()`)
- ✅ Operação de limpeza automática (não depende de usuário)
- ❌ Sem `SET search_path`

**Uso:** Limpeza automática de draft stores expirados (cron job).

---

### 3. create_order_atomic
**Risco:** ⚠️ **MÉDIO** (Ver seção de riscos)
- ⚠️ Function complexa com múltiplas operações
- ⚠️ Valida `store_id` mas não valida ownership explicitamente
- ❌ Sem `SET search_path`

**Uso:** Cria pedido com itens em transação atômica.

---

### 4. credit_loyalty_points
**Risco:** ✅ **BAIXO**
- ✅ Recebe `p_store_id` como parâmetro
- ✅ Valida existência de `loyalty_programs` por `store_id`
- ✅ Insere em `loyalty_transactions` com `store_id`
- ❌ Sem `SET search_path`

**Uso:** Credita pontos de fidelidade ao cliente.

---

### 5. expire_mimo_orders
**Risco:** ✅ **BAIXO**
- ✅ Atualiza apenas orders com `status='awaiting_mimo'` e `mimo_expires_at < NOW()`
- ✅ Operação de limpeza automática
- ❌ Sem `SET search_path`

**Uso:** Expira pedidos mimo não pagos (cron job).

---

### 6. get_product_modifiers
**Risco:** ✅ **BAIXO**
- ✅ Apenas lê dados (SELECT)
- ✅ Filtra por `p_product_id` (parâmetro)
- ✅ Não modifica dados
- ❌ Sem `SET search_path`

**Uso:** Busca modifiers de um produto específico.

---

### 7. get_user_stores
**Risco:** ⚠️ **MÉDIO** (Ver seção de riscos)
- ⚠️ Não valida `auth.uid()` explicitamente
- ⚠️ Retorna stores via `store_users` mas sem filtro de usuário
- ❌ Sem `SET search_path`

**Uso:** Busca lojas do usuário autenticado.

---

### 8. has_active_subscription
**Risco:** ✅ **BAIXO**
- ✅ Recebe `tenant_uuid` como parâmetro
- ✅ Apenas lê `tenant_subscriptions` e `subscriptions`
- ✅ Não modifica dados
- ❌ Sem `SET search_path`

**Uso:** Verifica se tenant tem assinatura ativa.

---

### 9. increment_coupon_usage
**Risco:** ✅ **BAIXO**
- ✅ Recebe `p_store_id` e `p_code` como parâmetros
- ✅ Atualiza apenas cupom específico do `store_id`
- ✅ Usa `WHERE store_id = p_store_id AND UPPER(code) = UPPER(p_code)`
- ❌ Sem `SET search_path`

**Uso:** Incrementa contador de uso de cupom.

---

### 10. is_trial_active
**Risco:** ✅ **BAIXO**
- ✅ Recebe `tenant_uuid` como parâmetro
- ✅ Apenas lê `tenants`
- ✅ Não modifica dados
- ❌ Sem `SET search_path`

**Uso:** Verifica se trial do tenant está ativo.

---

### 11. update_cash_session_on_order
**Risco:** ⚠️ **MÉDIO** (Ver seção de riscos)
- ⚠️ Não valida ownership da cash session
- ⚠️ Atualiza `cash_register_sessions` sem validar `store_id`
- ❌ Sem `SET search_path`

**Uso:** Atualiza sessão de caixa ao criar pedido.

---

### 12. user_has_store_access
**Risco:** ✅ **BAIXO**
- ✅ Valida `auth.uid()` explicitamente
- ✅ Filtra por `store_id` e `user_id = auth.uid()`
- ✅ Apenas lê `store_users`
- ❌ Sem `SET search_path`

**Uso:** Verifica se usuário tem acesso à store.

---

### 13. user_is_store_owner
**Risco:** ✅ **BAIXO**
- ✅ Valida `auth.uid()` explicitamente
- ✅ Filtra por `store_id`, `user_id = auth.uid()` e `role = 'OWNER'`
- ✅ Apenas lê `store_users`
- ❌ Sem `SET search_path`

**Uso:** Verifica se usuário é owner da store.

---

### 14. validate_coupon
**Risco:** ✅ **BAIXO**
- ✅ Recebe `p_store_id` como parâmetro
- ✅ Filtra cupom por `store_id = p_store_id`
- ✅ Apenas lê `coupons`
- ❌ Sem `SET search_path`

**Uso:** Valida cupom e calcula desconto.

---

### 15. validate_mimo_token
**Risco:** ✅ **BAIXO**
- ✅ Recebe `p_order_id` e `p_token` como parâmetros
- ✅ Valida token específico do pedido
- ✅ Atualiza apenas order específico
- ❌ Sem `SET search_path`

**Uso:** Valida token mimo para pagamento.

---

## ⚠️ Functions com RISCOS (3 functions)

### 1. create_order_atomic
**Risco:** ⚠️ **MÉDIO**

**Problema:**
```sql
-- Não valida se usuário tem acesso ao store_id fornecido
-- Aceita store_id do payload sem validar ownership
```

**DDL Relevante:**
```sql
v_store_id := (p_payload->>'store_id')::UUID;
-- Não há validação: WHERE EXISTS (SELECT 1 FROM store_users WHERE store_id = v_store_id AND user_id = auth.uid())
```

**Impacto:** Usuário autenticado pode criar pedidos em qualquer store sem validar se tem acesso.

**Recomendação:**
```sql
-- Adicionar validação no início da function:
IF NOT EXISTS (
  SELECT 1 FROM store_users 
  WHERE store_id = v_store_id AND user_id = auth.uid()
) THEN
  RAISE EXCEPTION 'Acesso negado à store';
END IF;
```

**Severidade:** 🟡 **MÉDIA** - RLS em `orders` pode mitigar, mas function bypassa RLS.

---

### 2. get_user_stores
**Risco:** ⚠️ **MÉDIO**

**Problema:**
```sql
-- Não filtra por auth.uid() explicitamente
-- Retorna TODAS as stores via store_users sem filtro de usuário
```

**DDL Relevante:**
```sql
RETURN QUERY
SELECT DISTINCT s.*
FROM stores s
INNER JOIN store_users su ON su.store_id = s.id;
-- Falta: WHERE su.user_id = auth.uid()
```

**Impacto:** Function pode retornar stores de outros usuários se chamada sem filtro.

**Recomendação:**
```sql
-- Adicionar filtro por auth.uid():
RETURN QUERY
SELECT DISTINCT s.*
FROM stores s
INNER JOIN store_users su ON su.store_id = s.id
WHERE su.user_id = auth.uid();
```

**Severidade:** 🟡 **MÉDIA** - Vazamento de informações de stores.

---

### 3. update_cash_session_on_order
**Risco:** ⚠️ **MÉDIO**

**Problema:**
```sql
-- Não valida se usuário tem acesso à cash session
-- Atualiza cash_register_sessions sem validar ownership
```

**DDL Relevante:**
```sql
UPDATE cash_register_sessions
SET 
  total_sales = total_sales + NEW.total,
  orders_count = orders_count + 1
WHERE id = NEW.cash_session_id;
-- Falta validação de ownership
```

**Impacto:** Trigger pode atualizar sessões de caixa de outras stores.

**Recomendação:**
```sql
-- Adicionar validação:
IF NOT EXISTS (
  SELECT 1 FROM cash_register_sessions cs
  JOIN store_users su ON su.store_id = cs.store_id
  WHERE cs.id = NEW.cash_session_id AND su.user_id = auth.uid()
) THEN
  RAISE EXCEPTION 'Acesso negado à sessão de caixa';
END IF;
```

**Severidade:** 🟡 **MÉDIA** - Manipulação de dados financeiros.

---

## 🔴 Vulnerabilidade CRÍTICA: SET search_path

**Problema:** TODAS as 14 functions **NÃO têm** `SET search_path = ''`.

**Impacto:** Risco de **SQL injection** via schema poisoning.

**Explicação:**
Functions SECURITY DEFINER executam com privilégios do owner (postgres). Se um atacante criar um schema malicioso no `search_path`, pode injetar código SQL que será executado com privilégios elevados.

**Exemplo de Ataque:**
```sql
-- Atacante cria schema malicioso
CREATE SCHEMA malicious;
CREATE FUNCTION malicious.now() RETURNS timestamptz AS $$
  -- Código malicioso aqui
$$ LANGUAGE sql;

-- Function sem SET search_path usa malicious.now() ao invés de pg_catalog.now()
```

**Recomendação CRÍTICA:**
Adicionar `SET search_path = ''` em TODAS as 14 functions:

```sql
CREATE OR REPLACE FUNCTION public.function_name(...)
 RETURNS ...
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''  -- ADICIONAR ESTA LINHA
AS $function$
...
$function$;
```

**Severidade:** 🔴 **CRÍTICA** - Todas as functions vulneráveis a SQL injection.

---

## 📋 Checklist de Correções

### Prioridade 1 - CRÍTICO (Aplicar HOJE)

- [ ] Adicionar `SET search_path = ''` em TODAS as 14 functions
- [ ] Corrigir `create_order_atomic` - validar ownership de `store_id`
- [ ] Corrigir `get_user_stores` - filtrar por `auth.uid()`
- [ ] Corrigir `update_cash_session_on_order` - validar ownership de cash session

### Prioridade 2 - ALTO (Aplicar esta semana)

- [ ] Revisar todas as functions para garantir validação de `auth.uid()`
- [ ] Adicionar testes automatizados para functions SECURITY DEFINER
- [ ] Documentar uso correto de cada function

---

## 🎯 Decisão GO/NO-GO

**Status:** ⚠️ **GO CONDICIONAL**

**Motivos:**
- ✅ 11/14 functions são seguras (com SET search_path)
- ⚠️ 3 functions têm riscos MÉDIOS (requerem correção)
- 🔴 TODAS as 14 functions sem `SET search_path` (CRÍTICO)

**Recomendação:**
1. **Aplicar correção de SET search_path IMEDIATAMENTE** (bloqueador)
2. Corrigir 3 functions com riscos médios (recomendado)
3. Após correções, sistema está pronto para produção

---

## 📁 Próximos Passos

1. Gerar patch SQL para adicionar `SET search_path = ''`
2. Gerar patch SQL para corrigir 3 functions com riscos
3. Aplicar patches em staging/dev
4. Validar correções
5. Aplicar em produção

---

**FIM DA ANÁLISE**
