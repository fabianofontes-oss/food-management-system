# Incident Playbook - Food Management System

## Visão Geral

Este documento descreve os procedimentos para identificar, diagnosticar e resolver incidentes em produção.

---

## 1. Checklist Inicial (Qualquer Incidente)

- [ ] Verificar se é incidente isolado ou generalizado
- [ ] Identificar desde quando está ocorrendo
- [ ] Verificar Sentry/logs para erros recentes
- [ ] Verificar status do Supabase (supabase.com/dashboard)
- [ ] Verificar status da Vercel (vercel.com/status)

---

## 2. Incidentes Comuns

### 2.1 Usuário não consegue fazer login

**Sintomas:**
- Tela de login não redireciona
- Erro "Unauthorized" ou similar

**Diagnóstico:**
```bash
# Verificar logs do Supabase Auth
# Dashboard → Logs → Auth
```

**Possíveis causas:**
1. **Token expirado** → Limpar cookies e tentar novamente
2. **RLS bloqueando** → Verificar policies de `users` e `store_users`
3. **Supabase Auth down** → Verificar status

**Resolução:**
- Se RLS: Aplicar fix via SQL Editor
- Se Auth: Aguardar Supabase ou contatar suporte

---

### 2.2 Cardápio não carrega (página pública)

**Sintomas:**
- Página `/[slug]` mostra erro ou vazia
- Produtos não aparecem

**Diagnóstico:**
```sql
-- Verificar se loja está ativa
SELECT id, name, slug, is_active FROM stores WHERE slug = '<SLUG>';

-- Verificar policies para anon
SET ROLE anon;
SELECT COUNT(*) FROM products WHERE store_id = '<STORE_ID>';
RESET ROLE;
```

**Possíveis causas:**
1. **Loja inativa** → Ativar via dashboard
2. **RLS bloqueando anon** → Verificar policies `*_public_select`
3. **Produtos inativos** → Ativar produtos

**Resolução:**
```sql
-- Ativar loja
UPDATE stores SET is_active = true WHERE slug = '<SLUG>';

-- Verificar policy existe
SELECT * FROM pg_policies WHERE tablename = 'products' AND policyname LIKE '%public%';
```

---

### 2.3 Pedido não é criado

**Sintomas:**
- Checkout falha com erro
- Pedido some após confirmação

**Diagnóstico:**
```sql
-- Verificar últimos pedidos
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Verificar logs de erro
-- Sentry → Issues → Filtrar por "createOrder"
```

**Possíveis causas:**
1. **Validação falhando** → Verificar erro específico (STORE_CLOSED, INVALID_ITEMS, etc.)
2. **RLS bloqueando INSERT** → Verificar policy de orders
3. **Timeout/conexão** → Retry

**Códigos de erro conhecidos:**
| Código | Significado |
|--------|-------------|
| `STORE_NOT_FOUND` | ID da loja inválido |
| `STORE_CLOSED` | Loja fechada, agendamento não habilitado |
| `SCHEDULING_REQUIRED` | Loja fechada, precisa agendar |
| `SCHEDULE_INVALID` | Horário agendado inválido |
| `INVALID_ITEMS` | Produto inativo/indisponível |
| `OUT_OF_DELIVERY_AREA` | Fora do raio de entrega |
| `MIN_ORDER_NOT_MET` | Pedido abaixo do mínimo |

---

### 2.4 Realtime não funciona (KDS/Dashboard)

**Sintomas:**
- Novos pedidos não aparecem automaticamente
- Precisa dar F5 para atualizar

**Diagnóstico:**
```javascript
// Console do browser
// Verificar se há erros de WebSocket
```

**Possíveis causas:**
1. **Conexão WebSocket** → Verificar firewall/proxy
2. **Subscribe incorreto** → Verificar código de subscription
3. **Supabase Realtime down** → Verificar status

**Resolução:**
- Verificar se `NEXT_PUBLIC_SUPABASE_URL` está correto
- Verificar se RLS permite SELECT para o usuário

---

### 2.5 Performance lenta

**Sintomas:**
- Páginas demoram > 3s para carregar
- Queries timeout

**Diagnóstico:**
```sql
-- Verificar queries lentas no Supabase
-- Dashboard → Reports → Query Performance
```

**Possíveis causas:**
1. **Queries N+1** → Otimizar com JOINs
2. **Falta de índices** → Criar índices
3. **Muitos dados** → Paginação

**Resolução:**
```sql
-- Criar índice se necessário
CREATE INDEX IF NOT EXISTS idx_products_store_active 
ON products(store_id, is_active);
```

---

## 3. Escalation

### Nível 1 (Self-service)
- Consultar este playbook
- Verificar logs/Sentry
- Tentar fixes documentados

### Nível 2 (Dev Team)
- Incidente não resolvido em 30min
- Impacto em múltiplos usuários
- Dados possivelmente corrompidos

### Nível 3 (Emergência)
- Sistema completamente down
- Vazamento de dados
- Segurança comprometida

---

## 4. Contatos

| Função | Contato |
|--------|---------|
| Dev Lead | _preencher_ |
| Supabase Support | support@supabase.io |
| Vercel Support | support@vercel.com |

---

## 5. Post-Mortem Template

Após resolver incidente crítico:

```markdown
## Incidente: [TÍTULO]

**Data:** YYYY-MM-DD HH:mm
**Duração:** X horas
**Impacto:** N usuários afetados

### Timeline
- HH:mm - Incidente detectado
- HH:mm - Diagnóstico iniciado
- HH:mm - Causa identificada
- HH:mm - Fix aplicado
- HH:mm - Confirmado resolvido

### Causa Raiz
[Descrição]

### Resolução
[O que foi feito]

### Ações Preventivas
- [ ] Ação 1
- [ ] Ação 2
```
