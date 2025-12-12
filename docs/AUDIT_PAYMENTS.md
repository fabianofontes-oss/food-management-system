# Auditoria de Pagamentos

**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Completo

---

## 📊 Resumo Executivo

- **Métodos Implementados:** 5 (manuais)
- **Gateway de Pagamento:** ❌ Não integrado
- **Status de Pagamento:** ✅ Implementado
- **Reconciliação:** ❌ Não implementada
- **Segurança:** ⚠️ Básica
- **Status Geral:** 🟡 **MVP** (funcional mas limitado)

---

## 💳 Métodos de Pagamento

### Enum payment_method

```sql
CREATE TYPE payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'pix',
  'voucher'
);
```

**Métodos Disponíveis:**

| Método | Tipo | Status | Automação | Verificação |
|--------|------|--------|-----------|-------------|
| Dinheiro | Manual | ✅ Ativo | ❌ Manual | ❌ Manual |
| Cartão de Crédito | Manual | ✅ Ativo | ❌ Manual | ❌ Manual |
| Cartão de Débito | Manual | ✅ Ativo | ❌ Manual | ❌ Manual |
| PIX | Manual | ✅ Ativo | ❌ Manual | ❌ Manual |
| Voucher | Manual | ✅ Ativo | ❌ Manual | ❌ Manual |

**Findings:**
- ✅ Métodos principais cobertos
- ❌ **BLOCKER**: Nenhum método automatizado
- ❌ **HIGH**: Sem integração com gateway
- ❌ **HIGH**: Sem validação de pagamento real
- ⚠️ **MEDIUM**: Depende 100% de confirmação manual

---

## 📊 Status de Pagamento

### Enum payment_status

```sql
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);
```

**Fluxo de Status:**

```
pending → paid (sucesso)
pending → failed (falha)
paid → refunded (estorno)
```

**Findings:**
- ✅ Estados bem definidos
- ✅ Fluxo lógico
- ⚠️ **MEDIUM**: Falta status 'processing'
- ⚠️ **MEDIUM**: Falta status 'cancelled'
- ⚠️ **LOW**: Falta timestamp de mudança de status

---

## 🔄 Fluxo de Pagamento Atual

### 1. Checkout (Manual)

```typescript
// Cliente finaliza pedido
const order = await supabase
  .from('orders')
  .insert({
    store_id,
    customer_id,
    payment_method: 'cash', // Selecionado pelo cliente
    payment_status: 'pending',
    total: calculateTotal()
  })
```

**Findings:**
- ✅ Pedido criado com status pending
- ❌ **HIGH**: Nenhuma validação de pagamento
- ❌ **HIGH**: Cliente pode selecionar qualquer método
- ⚠️ **MEDIUM**: Não gera comprovante

---

### 2. Confirmação (Manual)

```typescript
// Lojista confirma pagamento manualmente
await supabase
  .from('orders')
  .update({ payment_status: 'paid' })
  .eq('id', orderId)
```

**Findings:**
- ✅ Lojista pode confirmar pagamento
- ❌ **HIGH**: Sem auditoria de quem confirmou
- ❌ **HIGH**: Sem timestamp de confirmação
- ⚠️ **MEDIUM**: Sem validação de valor recebido

---

### 3. Estorno (Manual)

```typescript
// Lojista faz estorno manualmente
await supabase
  .from('orders')
  .update({ payment_status: 'refunded' })
  .eq('id', orderId)
```

**Findings:**
- ✅ Estorno possível
- ❌ **HIGH**: Sem registro de motivo
- ❌ **HIGH**: Sem validação de permissão
- ❌ **HIGH**: Não devolve dinheiro automaticamente

---

## 💰 Cálculo de Valores

### Estrutura de Pedido

```sql
CREATE TABLE orders (
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL
);
```

**Fórmula:**
```
total = subtotal - discount_amount + delivery_fee
```

**Findings:**
- ✅ Cálculo simples e claro
- ✅ Desconto e taxa de entrega separados
- ⚠️ **MEDIUM**: Cálculo feito no client (deveria ser server)
- ⚠️ **MEDIUM**: Sem validação de total no banco
- ⚠️ **LOW**: Falta campo para gorjeta/taxa de serviço

---

## 🎫 Sistema de Cupons

### Validação de Cupom

```sql
CREATE OR REPLACE FUNCTION validate_coupon(
  p_store_id UUID,
  p_code TEXT,
  p_subtotal NUMERIC
)
RETURNS JSON
```

**Validações:**
1. ✅ Cupom existe
2. ✅ Cupom está ativo
3. ✅ Data válida (starts_at, ends_at)
4. ✅ Limite de usos não atingido
5. ✅ Valor mínimo do pedido

**Cálculo de Desconto:**
```sql
-- Percentual
v_discount := ROUND(p_subtotal * (v_coupon.value / 100), 2);

-- Fixo
v_discount := LEAST(v_coupon.value, p_subtotal);

-- Garantir que não excede subtotal
v_discount := LEAST(v_discount, p_subtotal);
```

**Findings:**
- ✅ Validação completa
- ✅ Arredondamento correto
- ✅ Não permite desconto maior que subtotal
- ✅ Incremento atômico de uso
- ⚠️ **LOW**: Não valida uso por cliente (permite reutilização)

---

## 🚨 Riscos Identificados

### 🔴 BLOCKER (1)

#### 1. Nenhum método de pagamento automatizado
**Severidade:** 🔴 BLOCKER  
**Impacto:** Sistema não pode processar pagamentos reais  
**Risco:** 
- Fraudes (cliente diz que pagou mas não pagou)
- Perda de vendas (cliente desiste por falta de opções)
- Trabalho manual excessivo
- Sem comprovante de pagamento

**Solução:**
Integrar gateway de pagamento (Stripe, Mercado Pago, etc)

**Prazo:** 2-4 semanas

---

### 🔴 HIGH (8)

#### 2. Sem validação de pagamento real
**Severidade:** 🔴 HIGH  
**Impacto:** Fraudes possíveis  
**Risco:** Cliente marca como "pago" sem pagar

**Fix:**
- Integrar webhook de gateway
- Validar comprovante de pagamento
- Adicionar campo `payment_proof_url`

**Prazo:** 2 semanas

---

#### 3. Sem integração com gateway
**Severidade:** 🔴 HIGH  
**Impacto:** Pagamentos online impossíveis  
**Risco:** Perda de vendas

**Gateways Recomendados:**

| Gateway | PIX | Cartão | Boleto | Taxa | Recomendação |
|---------|-----|--------|--------|------|--------------|
| Mercado Pago | ✅ | ✅ | ✅ | ~4% | ⭐⭐⭐⭐⭐ |
| Stripe | ❌ | ✅ | ❌ | ~3% | ⭐⭐⭐⭐ |
| PagSeguro | ✅ | ✅ | ✅ | ~4% | ⭐⭐⭐ |
| Asaas | ✅ | ✅ | ✅ | ~3% | ⭐⭐⭐⭐ |

**Recomendação:** Mercado Pago (melhor para Brasil)

**Prazo:** 3 semanas

---

#### 4. Sem auditoria de confirmação
**Severidade:** 🔴 HIGH  
**Impacto:** Não sabe quem confirmou pagamento  
**Risco:** Disputas sem evidência

**Fix:**
```sql
ALTER TABLE orders 
  ADD COLUMN payment_confirmed_by UUID REFERENCES auth.users(id),
  ADD COLUMN payment_confirmed_at TIMESTAMPTZ;
```

**Prazo:** 1 dia

---

#### 5. Sem registro de motivo de estorno
**Severidade:** 🔴 HIGH  
**Impacto:** Não sabe por que foi estornado  
**Risco:** Disputas, problemas legais

**Fix:**
```sql
ALTER TABLE orders 
  ADD COLUMN refund_reason TEXT,
  ADD COLUMN refund_requested_by UUID REFERENCES auth.users(id),
  ADD COLUMN refund_requested_at TIMESTAMPTZ;
```

**Prazo:** 1 dia

---

#### 6. Estorno não devolve dinheiro
**Severidade:** 🔴 HIGH  
**Impacto:** Cliente não recebe dinheiro de volta  
**Risco:** Problemas legais, insatisfação

**Fix:**
- Integrar API de estorno do gateway
- Criar tabela `refunds` para rastrear
- Adicionar workflow de aprovação

**Prazo:** 2 semanas

---

#### 7. Sem validação de permissão para estorno
**Severidade:** 🔴 HIGH  
**Impacto:** Qualquer membro pode estornar  
**Risco:** Fraudes internas

**Fix:**
```typescript
// Middleware ou Server Action
if (action === 'refund') {
  const { data: membership } = await supabase
    .from('store_users')
    .select('role')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .single()
  
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new Error('Sem permissão para estornar')
  }
}
```

**Prazo:** 1 dia

---

#### 8. Cliente pode selecionar qualquer método
**Severidade:** 🔴 HIGH  
**Impacto:** Cliente seleciona PIX mas paga em dinheiro  
**Risco:** Confusão, relatórios incorretos

**Fix:**
- Validar métodos habilitados na loja
- Adicionar campo `enabled_payment_methods` em stores.settings
- Validar no server antes de criar pedido

**Prazo:** 2 dias

---

#### 9. Não gera comprovante
**Severidade:** 🔴 HIGH  
**Impacto:** Sem prova de pagamento  
**Risco:** Disputas, problemas fiscais

**Fix:**
- Gerar PDF de comprovante
- Enviar por email
- Armazenar em Supabase Storage
- Adicionar campo `receipt_url` em orders

**Prazo:** 1 semana

---

### ⚠️ MEDIUM (5)

#### 10. Cálculo de total no client
**Severidade:** ⚠️ MEDIUM  
**Impacto:** Total pode ser manipulado  
**Risco:** Cliente paga menos

**Fix:**
```typescript
// Server Action
'use server'
export async function createOrder(items, couponCode) {
  // Calcular total no servidor
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const discount = await calculateDiscount(couponCode, subtotal)
  const deliveryFee = await calculateDeliveryFee(address)
  const total = subtotal - discount + deliveryFee
  
  // Criar pedido com total calculado
  return await supabase.from('orders').insert({ total })
}
```

**Prazo:** 3 dias

---

#### 11. Sem validação de total no banco
**Severidade:** ⚠️ MEDIUM  
**Impacto:** Total incorreto pode ser salvo  
**Risco:** Perda de dinheiro

**Fix:**
```sql
-- Trigger para validar total
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total != (NEW.subtotal - NEW.discount_amount + NEW.delivery_fee) THEN
    RAISE EXCEPTION 'Total incorreto';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_order_total
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_total();
```

**Prazo:** 1 dia

---

#### 12. Falta status 'processing'
**Severidade:** ⚠️ MEDIUM  
**Impacto:** Não distingue pendente de processando  
**Risco:** Confusão em pagamentos assíncronos

**Fix:**
```sql
ALTER TYPE payment_status ADD VALUE 'processing' BEFORE 'paid';
```

**Prazo:** 1 dia

---

#### 13. Depende 100% de confirmação manual
**Severidade:** ⚠️ MEDIUM  
**Impacto:** Trabalho manual excessivo  
**Risco:** Atrasos, erros humanos

**Fix:**
- Integrar webhooks de gateway
- Confirmação automática via API
- Notificações em tempo real

**Prazo:** 2 semanas

---

#### 14. Cupom não valida uso por cliente
**Severidade:** ⚠️ MEDIUM  
**Impacto:** Cliente pode reusar cupom  
**Risco:** Perda de receita

**Fix:**
```sql
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, customer_id)
);
```

**Prazo:** 2 dias

---

### 🟡 LOW (3)

#### 15. Falta campo para gorjeta
**Severidade:** 🟡 LOW  
**Impacto:** Não pode cobrar gorjeta  
**Risco:** Perda de receita adicional

**Fix:**
```sql
ALTER TABLE orders ADD COLUMN tip_amount DECIMAL(10,2) DEFAULT 0;
```

**Prazo:** 1 dia

---

#### 16. Falta timestamp de mudança de status
**Severidade:** 🟡 LOW  
**Impacto:** Não sabe quando status mudou  
**Risco:** Dificulta análise

**Fix:**
```sql
ALTER TABLE orders 
  ADD COLUMN status_changed_at TIMESTAMPTZ,
  ADD COLUMN payment_status_changed_at TIMESTAMPTZ;
```

**Prazo:** 1 dia

---

#### 17. Falta status 'cancelled'
**Severidade:** 🟡 LOW  
**Impacto:** Não distingue falha de cancelamento  
**Risco:** Relatórios imprecisos

**Fix:**
```sql
ALTER TYPE payment_status ADD VALUE 'cancelled';
```

**Prazo:** 1 dia

---

## 🎯 Roadmap de Pagamentos

### Fase 1: MVP Atual (Completo) ✅
- ✅ Métodos manuais
- ✅ Status de pagamento
- ✅ Sistema de cupons
- ✅ Cálculo de total

**Status:** Funcional mas limitado

---

### Fase 2: Melhorias Críticas (2 semanas)

**Semana 1:**
- ✅ Adicionar auditoria de confirmação (#4)
- ✅ Adicionar registro de estorno (#5)
- ✅ Validar permissão para estorno (#7)
- ✅ Validar métodos habilitados (#8)
- ✅ Adicionar validação de total (#11)

**Semana 2:**
- ✅ Gerar comprovante PDF (#9)
- ✅ Calcular total no servidor (#10)
- ✅ Adicionar status 'processing' (#12)

---

### Fase 3: Integração Gateway (4 semanas)

**Semana 3:**
- ✅ Escolher gateway (Mercado Pago)
- ✅ Criar conta e obter credenciais
- ✅ Instalar SDK
- ✅ Implementar checkout PIX

**Semana 4:**
- ✅ Implementar checkout Cartão
- ✅ Implementar webhooks
- ✅ Testar em sandbox

**Semana 5:**
- ✅ Implementar estorno automático (#6)
- ✅ Validar pagamento real (#2)
- ✅ Adicionar comprovante de gateway

**Semana 6:**
- ✅ Testes em produção
- ✅ Documentação
- ✅ Treinamento da equipe

---

### Fase 4: Features Avançadas (4 semanas)

**Semana 7-8:**
- ✅ Parcelamento
- ✅ Assinatura recorrente
- ✅ Split de pagamento (marketplace)

**Semana 9-10:**
- ✅ Reconciliação bancária
- ✅ Relatórios financeiros
- ✅ Dashboard de pagamentos

---

## 💡 Recomendações

### Curto Prazo (1-2 semanas)
1. Adicionar auditoria e validações (#4, #5, #7, #11)
2. Gerar comprovantes (#9)
3. Calcular total no servidor (#10)

### Médio Prazo (1 mês)
1. Integrar Mercado Pago (#3)
2. Implementar webhooks (#2)
3. Estorno automático (#6)

### Longo Prazo (3 meses)
1. Parcelamento
2. Assinatura recorrente
3. Reconciliação bancária

---

## 📊 Comparação de Gateways

### Mercado Pago ⭐⭐⭐⭐⭐

**Prós:**
- ✅ PIX instantâneo
- ✅ Cartão de crédito/débito
- ✅ Boleto bancário
- ✅ Parcelamento sem juros
- ✅ SDK bem documentado
- ✅ Webhooks confiáveis
- ✅ Suporte em português

**Contras:**
- ⚠️ Taxa ~4%
- ⚠️ Requer conta Mercado Pago

**Recomendação:** **MELHOR OPÇÃO** para Brasil

---

### Stripe ⭐⭐⭐⭐

**Prós:**
- ✅ SDK excelente
- ✅ Documentação top
- ✅ Webhooks robustos
- ✅ Dashboard completo

**Contras:**
- ❌ Sem PIX
- ❌ Sem boleto
- ⚠️ Suporte em inglês

**Recomendação:** Bom para internacional, ruim para Brasil

---

### Asaas ⭐⭐⭐⭐

**Prós:**
- ✅ PIX, cartão, boleto
- ✅ Taxa ~3%
- ✅ Suporte brasileiro
- ✅ Split de pagamento

**Contras:**
- ⚠️ SDK menos maduro
- ⚠️ Documentação média

**Recomendação:** Boa alternativa ao Mercado Pago

---

## ✅ Conclusão

O sistema de pagamentos está em **MVP funcional** mas com **limitações críticas**:

**Pontos Fortes:**
- ✅ Estrutura de dados sólida
- ✅ Sistema de cupons completo
- ✅ Múltiplos métodos suportados

**Pontos Fracos:**
- ❌ Nenhum método automatizado
- ❌ Sem integração com gateway
- ❌ Sem validação de pagamento real
- ❌ Depende de confirmação manual

**Prioridade Máxima:**
1. Integrar Mercado Pago (4 semanas)
2. Adicionar auditoria e validações (1 semana)
3. Gerar comprovantes (1 semana)

**Status Geral:** 🟡 **MVP** (40% de maturidade)  
**Após Fase 2:** 🟢 **BOM** (70% esperado)  
**Após Fase 3:** 🟢 **EXCELENTE** (95% esperado)
