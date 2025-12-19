# ETAPA 6.1 - Plano de Teste E2E Multi-Tenant (P0)

**Data:** 2024-12-19  
**Objetivo:** Provar com evidências que não há vazamento cross-tenant no sistema  
**Ambiente:** Staging (recomendado) ou Produção com rollback

---

## 🎯 Meta

**Validar que um usuário autenticado não consegue ler/escrever dados fora do próprio tenant/store**, incluindo via:
- Queries diretas (RLS)
- Server Actions
- Functions SECURITY DEFINER

---

## 📋 Pré-requisitos

### 1. Criar Atores e Dados Mínimos

#### Tenants
- **Tenant A** com **Store A1**
- **Tenant B** com **Store B1**

#### Usuários
- **User A**: membro/owner da Store A1
- **User B**: membro/owner da Store B1

#### Dados Mínimos por Store
- 1 produto (Produto A / Produto B)
- 1 customer (Cliente A / Cliente B)
- 1 order com order_items
- (Opcional) 1 invoice/payment_history se o fluxo gerar

### 2. Evidências a Capturar

Para cada teste, documentar:
- ✅ Screenshot da tela ou response JSON
- ✅ IDs usados (tenant_id, store_id, user_id, order_id, etc.)
- ✅ Resultado esperado vs obtido
- ✅ Logs de erro (se aplicável)

---

## 🧪 Matriz de Testes

### SUITE A - Leitura Cross-Tenant (DEVE FALHAR ou RETORNAR VAZIO)

#### A1. Listar Stores
**Ator:** User A (logado)  
**Ação:** Acessar dashboard e listar stores disponíveis  
**Esperado:** Retorna **apenas Store A1**. Nunca Store B1.

**Como testar:**
1. Login como User A
2. Acessar `/[slug]/dashboard` ou chamar `get_user_stores()`
3. Verificar lista de stores retornadas

**Critério de aprovação:** ✅ Apenas Store A1 visível

---

#### A2. Consultar Customers de Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar listar customers da Store B1  
**Esperado:** **0 registros** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Tentar acessar `/store-b1-slug/dashboard/customers`
3. Ou executar query: `SELECT * FROM customers WHERE store_id = '<store_b1_id>'`

**Critério de aprovação:** ✅ Nenhum customer de Store B1 acessível

---

#### A3. Consultar Orders de Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar listar orders da Store B1  
**Esperado:** **0 registros** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Tentar acessar `/store-b1-slug/dashboard/orders`
3. Ou executar query: `SELECT * FROM orders WHERE store_id = '<store_b1_id>'`

**Critério de aprovação:** ✅ Nenhum order de Store B1 acessível

---

#### A4. Consultar Order Items de Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar acessar order_items de um order da Store B1  
**Esperado:** **0 registros** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Tentar acessar detalhes de um order_id da Store B1
3. Ou executar query: `SELECT * FROM order_items WHERE order_id = '<order_b1_id>'`

**Critério de aprovação:** ✅ Nenhum order_item de Store B1 acessível

---

#### A5. Consultar Dados Financeiros de Outro Tenant (CRÍTICO)
**Ator:** User A (logado)  
**Ação:** Tentar acessar invoices/payment_history/tenant_subscriptions do Tenant B  
**Esperado:** **0 registros** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Executar queries:
   ```sql
   SELECT * FROM invoices WHERE tenant_id = '<tenant_b_id>';
   SELECT * FROM payment_history WHERE tenant_id = '<tenant_b_id>';
   SELECT * FROM tenant_subscriptions WHERE tenant_id = '<tenant_b_id>';
   ```

**Critério de aprovação:** ✅ Nenhum dado financeiro de Tenant B acessível

**⚠️ IMPORTANTE:** Este é o teste mais crítico - vazamentos financeiros são violações graves de GDPR/LGPD.

---

#### A6. Repetir Testes Invertidos
**Ator:** User B (logado)  
**Ação:** Repetir testes A1-A5 tentando acessar dados do Tenant A / Store A1  
**Esperado:** Mesmos resultados (isolamento total)

---

### SUITE B - Escrita Cross-Tenant (DEVE FALHAR)

#### B1. Criar Order em Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar criar order usando `store_id = Store B1`  
**Esperado:** **Erro** `forbidden_store` ou `permission denied`

**Como testar:**
1. Login como User A
2. Chamar `create_order_atomic()` com payload:
   ```json
   {
     "store_id": "<store_b1_id>",
     "idempotency_key": "<uuid>",
     "channel": "DELIVERY",
     "payment_method": "CASH",
     "customer": {"name": "Test", "phone": "+5500000000"},
     "items": [{"product_id": "<produto_b1_id>", "quantity": 1, "unit_type": "unit"}]
   }
   ```

**Critério de aprovação:** ✅ Erro antes de qualquer INSERT

---

#### B2. Inserir Customer em Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar inserir customer com `store_id = Store B1`  
**Esperado:** **Falha RLS** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   INSERT INTO customers (store_id, name, phone)
   VALUES ('<store_b1_id>', 'Hacker', '+5500000000');
   ```

**Critério de aprovação:** ✅ INSERT bloqueado por RLS

---

#### B3. Atualizar Customer de Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar atualizar customer da Store B1  
**Esperado:** **Falha RLS** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   UPDATE customers 
   SET name = 'Hacked' 
   WHERE id = '<customer_b1_id>';
   ```

**Critério de aprovação:** ✅ UPDATE bloqueado por RLS

---

#### B4. Deletar Order de Outra Store
**Ator:** User A (logado)  
**Ação:** Tentar deletar order da Store B1  
**Esperado:** **Falha RLS** ou **403 Forbidden**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   DELETE FROM orders WHERE id = '<order_b1_id>';
   ```

**Critério de aprovação:** ✅ DELETE bloqueado por RLS

---

### SUITE C - SECURITY DEFINER Functions (CRÍTICA)

#### C1. get_user_stores()
**Ator:** User A (logado)  
**Ação:** Chamar `get_user_stores()`  
**Esperado:** Retorna **apenas Store A1**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   SELECT * FROM public.get_user_stores();
   ```

**Critério de aprovação:** ✅ Apenas Store A1 retornada

---

#### C2. create_order_atomic() com store_id de outro tenant
**Ator:** User A (logado)  
**Ação:** Chamar `create_order_atomic()` com `store_id = Store B1`  
**Esperado:** **Erro** `forbidden_store` antes de qualquer INSERT

**Como testar:**
1. Login como User A
2. Executar em transação com rollback:
   ```sql
   BEGIN;
   
   SELECT public.create_order_atomic(
     jsonb_build_object(
       'store_id', '<store_b1_id>',
       'idempotency_key', gen_random_uuid(),
       'channel', 'DELIVERY',
       'payment_method', 'CASH',
       'customer', jsonb_build_object('name','Test', 'phone','+5500000000'),
       'items', jsonb_build_array(
         jsonb_build_object('product_id','<produto_b1_id>','quantity',1,'unit_type','unit')
       )
     )
   );
   
   ROLLBACK;
   ```

**Critério de aprovação:** ✅ Erro `forbidden_store` ou `not_authenticated`

---

#### C3. user_has_store_access()
**Ator:** User A (logado)  
**Ação:** Chamar `user_has_store_access(store_b1_id)`  
**Esperado:** Retorna **false**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   SELECT public.user_has_store_access('<store_b1_id>');
   ```

**Critério de aprovação:** ✅ Retorna `false`

---

#### C4. user_is_store_owner()
**Ator:** User A (logado)  
**Ação:** Chamar `user_is_store_owner(store_b1_id)`  
**Esperado:** Retorna **false**

**Como testar:**
1. Login como User A
2. Executar:
   ```sql
   SELECT public.user_is_store_owner('<store_b1_id>');
   ```

**Critério de aprovação:** ✅ Retorna `false`

---

### SUITE D - Fluxo Normal (DEVE FUNCIONAR)

#### D1. User A Opera Store A1 Normalmente
**Ator:** User A (logado)  
**Ação:** Executar operações normais na Store A1  
**Esperado:** **Tudo funciona normalmente**

**Como testar:**
1. Login como User A
2. Listar stores → vê Store A1
3. Listar customers → vê customers de A1
4. Listar orders → vê orders de A1
5. Criar novo order em A1 → sucesso
6. Atualizar customer de A1 → sucesso

**Critério de aprovação:** ✅ Todas as operações funcionam sem erros

---

## 📊 Critérios de Aprovação (GO/NO-GO)

### ✅ GO PARA PRODUÇÃO - Se TODOS os critérios forem atendidos:

- [ ] **100% dos testes de leitura cross-tenant** retornam vazio ou 403
- [ ] **100% dos testes de escrita cross-tenant** falham com erro apropriado
- [ ] **get_user_stores()** retorna apenas stores do usuário autenticado
- [ ] **create_order_atomic()** bloqueia `store_id` fora do acesso do caller
- [ ] **user_has_store_access()** retorna `false` para stores de outros tenants
- [ ] **Dados financeiros** (invoices, payment_history) totalmente isolados
- [ ] **Fluxo normal** funciona sem regressões (User A opera Store A1)

### ❌ NO-GO PARA PRODUÇÃO - Se QUALQUER critério falhar:

- [ ] Qualquer teste de leitura cross-tenant retorna dados
- [ ] Qualquer teste de escrita cross-tenant tem sucesso
- [ ] Functions SECURITY DEFINER permitem acesso cross-tenant
- [ ] Fluxo normal quebrado (regressão)

---

## 📁 Entregáveis

Após executar todos os testes, gerar:

1. **`audit/06_e2e_results.md`** - Resultados detalhados de cada teste com:
   - Screenshots ou logs
   - IDs usados
   - Resultado esperado vs obtido
   - Status (✅ PASS / ❌ FAIL)

2. **`audit/06_prod_readiness_checklist.md`** - Checklist GO/NO-GO final

---

## 🔧 Troubleshooting

### Se algum teste falhar:

**Leitura cross-tenant retorna dados:**
- Verificar policies em `pg_policies`
- Verificar se RLS está habilitado e forçado
- Verificar filtros por `store_id` ou `tenant_id`

**Escrita cross-tenant tem sucesso:**
- Verificar policies com `WITH CHECK`
- Verificar se RLS está forçado (`FORCE ROW LEVEL SECURITY`)

**Functions SECURITY DEFINER permitem acesso:**
- Verificar DDL das functions (PASSO 6 da ETAPA 3)
- Confirmar que validações de `auth.uid()` estão presentes
- Confirmar que `search_path` está correto

**Fluxo normal quebrado:**
- Verificar se policies não estão muito restritivas
- Verificar se `auth.uid()` está sendo passado corretamente
- Verificar logs de erro no Supabase

---

## 🎯 Próximos Passos Após ETAPA 6.1

Se **GO**:
- Prosseguir para ETAPA 4 (SuperAdmin Hardening)
- Prosseguir para ETAPA 5 (Billing Enforcement)

Se **NO-GO**:
- Corrigir vulnerabilidades identificadas
- Re-executar testes
- Não fazer deploy em produção até 100% de aprovação

---

**FIM DO PLANO DE TESTE**

**Execute os testes e documente os resultados em `audit/06_e2e_results.md`**
