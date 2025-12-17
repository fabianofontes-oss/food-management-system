# 🧪 RLS Smoke Test - Validação de Isolamento Multi-Store

**Data:** _____________  
**Executor:** _____________  
**Pré-requisito:** Migrations RLS aplicadas (ver `rls_apply_proof.md`)

---

## 🎯 Objetivo

Provar que:
1. Usuário de Loja A **não vê** dados da Loja B
2. Cardápio público continua funcionando
3. Fluxos de pedido e cozinha estão operacionais

---

## 📋 Setup de Teste

### Passo 1: Criar/Identificar 2 Lojas de Teste

```sql
-- Verificar lojas existentes
SELECT id, name, slug, is_active FROM stores LIMIT 10;
```

| Loja | ID | Slug | Nome |
|------|----|----- |------|
| Store A | `________________` | `________________` | ________________ |
| Store B | `________________` | `________________` | ________________ |

### Passo 2: Criar/Identificar 2 Usuários de Teste

```sql
-- Verificar usuários e vínculos
SELECT 
  u.id as user_id,
  u.email,
  su.store_id,
  s.name as store_name,
  su.role
FROM auth.users u
JOIN store_users su ON su.user_id = u.id
JOIN stores s ON s.id = su.store_id
LIMIT 20;
```

| Usuário | Email | Store Vinculada | Role |
|---------|-------|-----------------|------|
| UserA | `________________` | Store A | ________________ |
| UserB | `________________` | Store B | ________________ |

---

## 🔒 Teste 1: Isolamento de Dados (SQL)

### 1.1 Testar como UserA

```sql
-- Simular contexto de UserA (substitua o UUID)
-- No Supabase, faça login como UserA e execute:

SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_customers FROM customers;
```

**Resultado UserA:**

| Tabela | Count | Esperado (só Store A) |
|--------|-------|----------------------|
| orders | ___ | Apenas de Store A |
| products | ___ | Apenas de Store A |
| customers | ___ | Apenas de Store A |

### 1.2 Testar como UserB

```sql
-- Fazer login como UserB e repetir

SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_customers FROM customers;
```

**Resultado UserB:**

| Tabela | Count | Esperado (só Store B) |
|--------|-------|----------------------|
| orders | ___ | Apenas de Store B |
| products | ___ | Apenas de Store B |
| customers | ___ | Apenas de Store B |

### 1.3 Validar Isolamento

- [ ] UserA **NÃO** vê dados de Store B
- [ ] UserB **NÃO** vê dados de Store A
- [ ] Counts são diferentes entre usuários (se lojas têm dados diferentes)

---

## 🌐 Teste 2: Fluxo Público (Cardápio)

### 2.1 Acessar Cardápio Público

**URL:** `http://localhost:3000/{slug-da-loja}`

**Passos:**
1. [ ] Abrir URL em modo anônimo (sem login)
2. [ ] Verificar se categorias carregam
3. [ ] Verificar se produtos carregam
4. [ ] Verificar se preços aparecem

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Página carrega | [ ] ✅ [ ] ❌ | |
| Categorias listadas | [ ] ✅ [ ] ❌ | |
| Produtos listados | [ ] ✅ [ ] ❌ | |
| Imagens carregam | [ ] ✅ [ ] ❌ | |

### 2.2 Adicionar ao Carrinho (sem login)

**Passos:**
1. [ ] Clicar em um produto
2. [ ] Adicionar ao carrinho
3. [ ] Verificar carrinho

**Resultado:**

| Item | Status |
|------|--------|
| Modal do produto abre | [ ] ✅ [ ] ❌ |
| Adicionar funciona | [ ] ✅ [ ] ❌ |
| Carrinho atualiza | [ ] ✅ [ ] ❌ |

---

## 🔐 Teste 3: Fluxo Dashboard (Autenticado)

### 3.1 Login como UserA

**URL:** `http://localhost:3000/login`

**Passos:**
1. [ ] Fazer login com credenciais de UserA
2. [ ] Verificar redirecionamento para dashboard

**Resultado:**

| Item | Status |
|------|--------|
| Login funciona | [ ] ✅ [ ] ❌ |
| Redireciona para dashboard | [ ] ✅ [ ] ❌ |

### 3.2 Verificar Listagens no Dashboard

**Páginas a testar:**

| Página | URL | Carrega? | Mostra dados? |
|--------|-----|----------|---------------|
| Dashboard Home | `/{slug}/dashboard` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ |
| Pedidos | `/{slug}/dashboard/orders` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ |
| Produtos | `/{slug}/dashboard/products` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ |
| Clientes | `/{slug}/dashboard/customers` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ |
| Configurações | `/{slug}/dashboard/settings` | [ ] ✅ [ ] ❌ | [ ] ✅ [ ] ❌ |

### 3.3 Tentar Acessar Store B como UserA

**Teste de segurança:** UserA tenta acessar dashboard de Store B

**URL:** `http://localhost:3000/{slug-store-b}/dashboard`

**Resultado esperado:** Acesso negado ou redirecionado

| Resultado | Status |
|-----------|--------|
| Acesso bloqueado | [ ] ✅ |
| Conseguiu acessar (FALHA!) | [ ] ❌ |

---

## 👨‍🍳 Teste 4: Fluxo Cozinha (KDS)

### 4.1 Acessar Página da Cozinha

**URL:** `http://localhost:3000/{slug}/dashboard/kitchen`

**Passos:**
1. [ ] Fazer login como usuário da loja
2. [ ] Acessar página da cozinha
3. [ ] Verificar se pedidos carregam
4. [ ] Verificar se chefs carregam

**Resultado:**

| Item | Status | Observação |
|------|--------|------------|
| Página carrega | [ ] ✅ [ ] ❌ | |
| Pedidos listados | [ ] ✅ [ ] ❌ | |
| Lista de chefs | [ ] ✅ [ ] ❌ | |
| Atribuir chef | [ ] ✅ [ ] ❌ | |
| Mudar status | [ ] ✅ [ ] ❌ | |

### 4.2 Verificar Isolamento na Cozinha

```sql
-- Como UserA, verificar kitchen_chefs
SELECT * FROM kitchen_chefs;
```

**Resultado:** Deve mostrar apenas chefs da Store A

| Esperado | Obtido |
|----------|--------|
| Apenas chefs de Store A | [ ] ✅ [ ] ❌ |

---

## ❌ Registro de Falhas

### Falha 1

**Componente:** _____________  
**Erro:** 
```
# Cole o erro aqui
```
**Stack/Response:**
```
# Cole detalhes técnicos
```
**Causa provável:** _____________

**Patch proposto:**
```sql
-- SQL para corrigir
```

---

### Falha 2

**Componente:** _____________  
**Erro:** _____________  
**Patch proposto:**
```sql
-- SQL para corrigir
```

---

## 📊 Resumo Final

| Teste | Status |
|-------|--------|
| 1. Isolamento SQL | [ ] ✅ Passou [ ] ❌ Falhou |
| 2. Fluxo Público | [ ] ✅ Passou [ ] ❌ Falhou |
| 3. Fluxo Dashboard | [ ] ✅ Passou [ ] ❌ Falhou |
| 4. Fluxo Cozinha | [ ] ✅ Passou [ ] ❌ Falhou |

### Critérios de Aceite

| Critério | Status |
|----------|--------|
| UserA não acessa Store B | [ ] ✅ |
| Fluxo público funciona | [ ] ✅ |
| Dashboard funciona | [ ] ✅ |
| Cozinha funciona | [ ] ✅ |

### Resultado Final

- [ ] ✅ **APROVADO** - Todos os testes passaram
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Falhas menores documentadas
- [ ] ❌ **REPROVADO** - Falhas críticas encontradas

---

## 🔧 Patches Aplicados (se houver)

| # | Descrição | Arquivo/SQL | Status |
|---|-----------|-------------|--------|
| 1 | | | [ ] Aplicado |
| 2 | | | [ ] Aplicado |

---

## 📝 Notas Adicionais

```
# Observações gerais do teste
```

---

*Template de smoke test para validação de RLS multi-store.*
