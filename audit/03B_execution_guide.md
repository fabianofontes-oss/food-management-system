# ETAPA 3B - Guia de Execução
**Auditoria RLS/Policies/Grants/Functions no Supabase**  
**Data:** 2024-12-19

---

## 🎯 Objetivo

Coletar evidências objetivas (SQL) de isolamento multi-tenant e identificar gaps críticos no Supabase.

---

## 📋 Instruções de Execução

### Passo 1: Acessar Supabase SQL Editor

1. Acesse o projeto no Supabase Dashboard
2. Navegue até **SQL Editor** no menu lateral
3. Crie uma nova query

### Passo 2: Executar Queries

Abra o arquivo `audit/03B_supabase_sql_queries.sql` e execute cada query sequencialmente:

#### Query 3.1 - RLS Habilitado/Forçado
- **Objetivo:** Verificar quais tabelas têm RLS habilitado
- **Risco:** Tabelas sem RLS podem vazar dados entre tenants
- **Tempo estimado:** ~2 segundos

#### Query 3.2 - Policies por Tabela
- **Objetivo:** Listar todas as policies e suas regras
- **Risco:** Policies permissivas podem permitir acesso cross-tenant
- **Tempo estimado:** ~3 segundos

#### Query 3.3 - Grants e Permissões
- **Objetivo:** Verificar permissões concedidas a roles
- **Risco:** Grants excessivos podem permitir bypass de RLS
- **Tempo estimado:** ~2 segundos

#### Query 3.4 - Functions SECURITY DEFINER
- **Objetivo:** Identificar functions com privilégios elevados
- **Risco:** SECURITY DEFINER sem validação = privilege escalation
- **Tempo estimado:** ~3 segundos

#### Query 3.5 - Search Path em Functions
- **Objetivo:** Verificar se functions têm search_path seguro
- **Risco:** search_path inseguro = SQL injection
- **Tempo estimado:** ~2 segundos

#### Query 3.6 - Tabelas Críticas sem RLS
- **Objetivo:** Verificar tabelas multi-tenant core
- **Risco:** Tabelas core sem RLS = vazamento total
- **Tempo estimado:** ~2 segundos

#### Query 3.7 - Policies Permissivas
- **Objetivo:** Identificar policies sem filtro tenant
- **Risco:** Policies permissivas = cross-tenant leak
- **Tempo estimado:** ~2 segundos

#### Query 3.8 - Colunas de Isolamento
- **Objetivo:** Verificar se tabelas têm tenant_id/store_id
- **Risco:** Sem colunas de isolamento = RLS impossível
- **Tempo estimado:** ~2 segundos

#### Query 3.9 - Resumo de Segurança
- **Objetivo:** Dashboard geral de segurança
- **Tempo estimado:** ~3 segundos

### Passo 3: Copiar Resultados

Para cada query:
1. Execute a query no SQL Editor
2. Copie os resultados (formato tabela)
3. Cole no arquivo `audit/03B_results.txt` com o cabeçalho da query

### Passo 4: Análise

Após coletar todos os resultados:
1. Identifique itens marcados como 🔴 CRÍTICO
2. Identifique itens marcados como 🟡 ATENÇÃO
3. Liste tabelas sem RLS ou policies
4. Liste functions SECURITY DEFINER suspeitas

---

## 🚨 Sinais de Alerta

### 🔴 CRÍTICO (Ação Imediata)

- **RLS DESABILITADO** em tabelas multi-tenant
- **SEM POLICIES** em tabelas com dados sensíveis
- **POLICIES COM TRUE** (permitem acesso total)
- **SEM FILTRO TENANT** em policies
- **ANON COM WRITE** (insert/update/delete)
- **SECURITY DEFINER SEM AUTH CHECK**
- **SEM SEARCH_PATH** em functions DEFINER

### 🟡 ATENÇÃO (Revisar)

- **RLS NÃO FORÇADO** (pode ser bypassado)
- **SEM WITH CHECK** em policies INSERT/UPDATE
- **ANON COM READ** (pode expor dados)
- **AUTH COM DELETE** (pode ser perigoso)
- **SECURITY DEFINER** (revisar necessidade)

### ✅ OK

- **RLS HABILITADO E FORÇADO**
- **POLICIES COM FILTRO TENANT**
- **GRANTS APROPRIADOS**
- **SECURITY INVOKER** (padrão seguro)

---

## 📊 Template de Resultados

```
============================================================================
QUERY 3.1 - RLS HABILITADO/FORÇADO
============================================================================
Executado em: [DATA/HORA]

[COLAR RESULTADOS AQUI]

Análise:
- Total de tabelas: X
- Tabelas com RLS: Y
- Tabelas SEM RLS: Z
- Status: [CRÍTICO/ATENÇÃO/OK]

============================================================================
QUERY 3.2 - POLICIES POR TABELA
============================================================================
Executado em: [DATA/HORA]

[COLAR RESULTADOS AQUI]

Análise:
- Total de policies: X
- Policies críticas: Y
- Policies com atenção: Z
- Status: [CRÍTICO/ATENÇÃO/OK]

[... repetir para cada query ...]
```

---

## 🔍 Checklist de Validação

Após executar todas as queries, verificar:

### Multi-Tenant Core
- [ ] Tabela `tenants` tem RLS habilitado
- [ ] Tabela `stores` tem RLS habilitado
- [ ] Tabela `store_users` tem RLS habilitado
- [ ] Tabela `products` tem RLS habilitado e filtra por store_id
- [ ] Tabela `orders` tem RLS habilitado e filtra por store_id
- [ ] Tabela `customers` tem RLS habilitado

### Policies
- [ ] Todas as tabelas multi-tenant têm pelo menos 1 policy
- [ ] Nenhuma policy usa `true` como filtro
- [ ] Policies filtram por `tenant_id` ou `store_id` ou `auth.uid()`
- [ ] Policies têm `WITH CHECK` para INSERT/UPDATE

### Grants
- [ ] Role `anon` NÃO tem INSERT/UPDATE/DELETE
- [ ] Role `authenticated` tem apenas SELECT/INSERT/UPDATE necessários
- [ ] Role `service_role` tem acesso total (esperado)

### Functions
- [ ] Nenhuma function SECURITY DEFINER sem auth check
- [ ] Functions DEFINER têm `SET search_path = public, pg_temp`
- [ ] Functions críticas validam `auth.uid()`

---

## 📝 Próximos Passos

1. ✅ Executar todas as queries
2. ✅ Copiar resultados para `audit/03B_results.txt`
3. ⏳ Analisar resultados e identificar gaps
4. ⏳ Gerar relatório `audit/03B_rls_policies_report.md`
5. ⏳ Criar patches SQL para corrigir gaps críticos
6. ⏳ Aplicar patches (se aprovado)

---

## ⚠️ IMPORTANTE

- **NÃO APLIQUE ALTERAÇÕES** nesta etapa (somente leitura)
- **COPIE TODOS OS RESULTADOS** antes de analisar
- **DOCUMENTE TUDO** para evidência de auditoria
- **IDENTIFIQUE PRIORIDADES** (crítico vs atenção)

---

**FIM DO GUIA DE EXECUÇÃO**
