# 🧪 RLS Smoke Test - Validação de Isolamento Multi-Store

**Data:** 17 de Dezembro de 2025  
**Executor:** QA Engineer  
**Pré-requisito:** Migrations RLS aplicadas (`20251217_04_rls_remainder_safe.sql`)

---

## 🎯 Objetivo

Provar que:
1. Usuário de Loja A **não vê** dados da Loja B
2. Cardápio público continua funcionando
3. Fluxos de pedido e cozinha estão operacionais

---

## 📋 Setup de Teste

### Passo 1: Verificar Lojas Existentes

```sql
-- Verificar lojas existentes
SELECT id, name, slug, is_active FROM stores ORDER BY created_at LIMIT 10;
```

**Resultado:**

| Loja | ID | Slug | Nome |
|------|----|----- |------|
| Store A | `________________` | `________________` | ________________ |
| Store B | `________________` | `________________` | ________________ |

### Passo 2: Verificar Usuários e Vínculos

```sql
-- Verificar usuários e vínculos com lojas
SELECT 
  u.id as user_id,
  u.email,
  su.store_id,
  s.name as store_name,
  su.role
FROM auth.users u
JOIN public.store_users su ON su.user_id = u.id
JOIN public.stores s ON s.id = su.store_id
ORDER BY s.name, u.email
LIMIT 20;
```

**Resultado:**

| Usuário | Email | Store Vinculada | Role |
|---------|-------|-----------------|------|
| UserA | `________________` | Store A | ________________ |
| UserB | `________________` | Store B | ________________ |

### Passo 3 (OPCIONAL): Criar Dados de Teste

Se não existirem 2 lojas com usuários diferentes, use estes scripts:

```sql
-- ⚠️ APENAS SE NECESSÁRIO - Criar Store B de teste
INSERT INTO stores (id, tenant_id, name, slug, is_active)
SELECT 
  gen_random_uuid(),
  (SELECT tenant_id FROM stores LIMIT 1),
  'Loja Teste B',
  'loja-teste-b',
  true
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE slug = 'loja-teste-b');

-- Criar vínculo para usuário existente com Store B
-- (substitua USER_ID e STORE_B_ID pelos valores reais)
-- INSERT INTO store_users (user_id, store_id, role)
-- VALUES ('USER_ID', 'STORE_B_ID', 'OWNER');
```

---

## 🔒 Teste 1: Isolamento de Dados (SQL)

### 1.1 Testar como UserA (via Supabase Dashboard)

**Método:** Use o SQL Editor do Supabase logado como UserA (ou use a API com token do UserA)

```sql
-- Contar registros visíveis para o usuário atual
SELECT 'orders' as tabela, COUNT(*) as total FROM orders
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'kitchen_chefs', COUNT(*) FROM kitchen_chefs;
```

**Resultado UserA:**

| Tabela | Count | Esperado |
|--------|-------|----------|
| orders | ___ | Apenas de Store A |
| products | ___ | Apenas de Store A |
| categories | ___ | Apenas de Store A |
| customers | ___ | Apenas de Store A |
| kitchen_chefs | ___ | Apenas de Store A |

### 1.2 Testar como UserB

**Método:** Logout e login como UserB, repetir a query acima

**Resultado UserB:**

| Tabela | Count | Esperado |
|--------|-------|----------|
| orders | ___ | Apenas de Store B |
| products | ___ | Apenas de Store B |
| categories | ___ | Apenas de Store B |
| customers | ___ | Apenas de Store B |
| kitchen_chefs | ___ | Apenas de Store B |

### 1.3 Teste de Isolamento Direto (CRÍTICO)

```sql
-- Como UserA, tentar acessar dados de Store B diretamente
-- Substitua STORE_B_ID pelo ID real da Store B
SELECT * FROM orders WHERE store_id = 'STORE_B_ID' LIMIT 5;
SELECT * FROM products WHERE store_id = 'STORE_B_ID' LIMIT 5;
SELECT * FROM customers WHERE store_id = 'STORE_B_ID' LIMIT 5;
```

**Resultado Esperado:** 0 linhas retornadas (RLS bloqueando acesso)

### 1.4 Checklist de Isolamento

- [ ] UserA **NÃO** vê dados de Store B
- [ ] UserB **NÃO** vê dados de Store A
- [ ] Query direta com `WHERE store_id = 'OUTRA_LOJA'` retorna 0 linhas
- [ ] Counts são diferentes entre usuários (se lojas têm dados diferentes)

---

## 🌐 Teste 2: Fluxo Público (Cardápio)

### 2.1 Acessar Cardápio Público

**URL:** `http://localhost:3000/{slug-da-loja}`

**Passos:**
1. Abrir URL em modo anônimo (aba privada, sem login)
2. Verificar se categorias carregam
3. Verificar se produtos carregam
4. Verificar se preços aparecem

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Página carrega | [ ] ✅ [ ] ❌ | |
| Categorias listadas | [ ] ✅ [ ] ❌ | Qtd: ___ |
| Produtos listados | [ ] ✅ [ ] ❌ | Qtd: ___ |
| Imagens carregam | [ ] ✅ [ ] ❌ | |
| Preços visíveis | [ ] ✅ [ ] ❌ | |

### 2.2 Adicionar ao Carrinho (sem login)

**Passos:**
1. Clicar em um produto
2. Selecionar opções (se houver)
3. Adicionar ao carrinho
4. Verificar carrinho

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Modal do produto abre | [ ] ✅ [ ] ❌ | |
| Modificadores carregam | [ ] ✅ [ ] ❌ | |
| Adicionar funciona | [ ] ✅ [ ] ❌ | |
| Carrinho atualiza | [ ] ✅ [ ] ❌ | |

### 2.3 Erro Encontrado (se houver)

```
# Cole o erro do console ou da tela aqui
```

**Causa provável:** _____________

**Patch proposto:**
```sql
-- ou código/diff
```

---

## 🔐 Teste 3: Fluxo Dashboard (Autenticado)

### 3.1 Login como UserA

**URL:** `http://localhost:3000/login`

**Credenciais de teste:**
- Email: `________________`
- Senha: `________________`

**Passos:**
1. Fazer login com credenciais de UserA
2. Verificar redirecionamento para dashboard
3. Verificar se mostra dados da loja correta

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Login funciona | [ ] ✅ [ ] ❌ | |
| Redireciona para dashboard | [ ] ✅ [ ] ❌ | URL: ________________ |
| Mostra nome da loja correta | [ ] ✅ [ ] ❌ | |

### 3.2 Verificar Listagens no Dashboard

**Páginas a testar (como UserA):**

| Página | URL | Carrega? | Mostra dados? | Qtd |
|--------|-----|----------|---------------|-----|
| Dashboard Home | `/{slug}/dashboard` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | |
| Pedidos | `/{slug}/dashboard/orders` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | ___ |
| Produtos | `/{slug}/dashboard/products` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | ___ |
| Categorias | `/{slug}/dashboard/categories` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | ___ |
| Clientes | `/{slug}/dashboard/customers` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | ___ |
| Configurações | `/{slug}/dashboard/settings` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ | |

### 3.3 Teste de Segurança: Acessar Store B como UserA

**Teste CRÍTICO:** UserA tenta acessar dashboard de Store B

**URL:** `http://localhost:3000/{slug-store-b}/dashboard`

**Resultado esperado:** Acesso negado, redirecionado ou erro 403

| Resultado | Status |
|-----------|--------|
| Acesso bloqueado/redirecionado | [ ] ✅ |
| Conseguiu acessar dados de Store B (FALHA CRÍTICA!) | [ ] ❌ |

### 3.4 Erro Encontrado (se houver)

```
# Cole o erro do console ou da tela aqui
```

**Página afetada:** _____________

**Patch proposto:**
```sql
-- ou código/diff
```

---

## 👨‍🍳 Teste 4: Fluxo Cozinha (KDS)

### 4.1 Acessar Página da Cozinha

**URL:** `http://localhost:3000/{slug}/dashboard/kitchen`

**Passos:**
1. Fazer login como usuário da loja (se não estiver logado)
2. Acessar página da cozinha
3. Verificar se pedidos carregam
4. Verificar se lista de chefs carrega
5. Testar ações (atribuir chef, mudar status)

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Página carrega | [ ] ✅ [ ] ❌ | |
| Pedidos listados | [ ] ✅ [ ] ❌ | Qtd: ___ |
| Lista de chefs | [ ] ✅ [ ] ❌ | Qtd: ___ |
| Dropdown de chefs funciona | [ ] ✅ [ ] ❌ | |
| Atribuir chef a pedido | [ ] ✅ [ ] ❌ | |
| Mudar status do pedido | [ ] ✅ [ ] ❌ | |
| Realtime funciona | [ ] ✅ [ ] ❌ | |

### 4.2 Verificar Isolamento na Cozinha (SQL)

```sql
-- Como UserA, verificar kitchen_chefs visíveis
SELECT id, name, store_id, is_active FROM kitchen_chefs;
```

**Resultado esperado:** Apenas chefs da Store A

| Verificação | Status |
|-------------|--------|
| Apenas chefs de Store A listados | [ ] ✅ [ ] ❌ |
| Nenhum chef de Store B aparece | [ ] ✅ [ ] ❌ |

### 4.3 Erro Encontrado (se houver)

```
# Cole o erro do console ou da tela aqui
```

**Componente afetado:** _____________

**Patch proposto:**
```sql
-- ou código/diff
```

---

## ❌ Registro de Falhas

### Falha 1 (se houver)

**Componente:** _____________  
**Fluxo afetado:** [ ] Público [ ] Dashboard [ ] Cozinha  
**Erro:** 
```
# Cole o erro aqui
```

**Causa raiz:** _____________

**Patch aplicado:**
```sql
-- SQL ou código
```

**Status:** [ ] Corrigido [ ] Pendente

---

### Falha 2 (se houver)

**Componente:** _____________  
**Erro:** _____________  
**Patch:** _____________  
**Status:** [ ] Corrigido [ ] Pendente

---

## 📊 Resumo Final

### Resultados dos Testes

| # | Teste | Status | Observação |
|---|-------|--------|------------|
| 1 | Isolamento SQL (UserA vs UserB) | [ ] ✅ [ ] ❌ | |
| 2 | Fluxo Público (cardápio anônimo) | [ ] ✅ [ ] ❌ | |
| 3 | Fluxo Dashboard (autenticado) | [ ] ✅ [ ] ❌ | |
| 4 | Fluxo Cozinha (KDS) | [ ] ✅ [ ] ❌ | |
| 5 | Teste de segurança (acesso cross-store) | [ ] ✅ [ ] ❌ | |

### Critérios de Aceite

| Critério | Status | Evidência |
|----------|--------|-----------|
| UserA não acessa dados de Store B | [ ] ✅ [ ] ❌ | Query retorna 0 linhas |
| UserB não acessa dados de Store A | [ ] ✅ [ ] ❌ | Query retorna 0 linhas |
| Cardápio público funciona | [ ] ✅ [ ] ❌ | Categorias/produtos carregam |
| Dashboard funciona | [ ] ✅ [ ] ❌ | Listagens funcionam |
| Cozinha funciona | [ ] ✅ [ ] ❌ | Pedidos/chefs carregam |

### Veredito Final

- [ ] ✅ **APROVADO** - Todos os testes passaram, RLS funcionando corretamente
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Falhas menores documentadas e corrigidas
- [ ] ❌ **REPROVADO** - Falhas críticas encontradas, requer correção

---

## 🔧 Patches Aplicados Durante o Teste

| # | Descrição | Arquivo | Status |
|---|-----------|---------|--------|
| 1 | | | [ ] Aplicado |
| 2 | | | [ ] Aplicado |

---

## 📝 Notas do Testador

```
# Observações gerais, dificuldades encontradas, sugestões de melhoria
```

---

## 📅 Histórico

| Data | Executor | Resultado |
|------|----------|-----------|
| ____/____/____ | ____________ | [ ] ✅ [ ] ❌ |

---

*Documento de smoke test para validação de isolamento RLS multi-store.*  
*Gerado em: 17/12/2025*
