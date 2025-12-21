# ✅ CHECKLIST DE CONFIGURAÇÃO - BILLING

**Tempo estimado:** 1h 15min  
**Objetivo:** Sistema 100% funcional e cobrando

---

## 📋 PASSO A PASSO

### ✅ Passo 1: Aplicar Migrations SQL (5min)

```bash
# Conectar ao Supabase via SQL Editor ou CLI
psql $DATABASE_URL -f supabase/migrations/20251221000000_performance_indexes.sql
psql $DATABASE_URL -f supabase/migrations/20251221000001_audit_logs.sql
psql $DATABASE_URL -f supabase/migrations/20251221000002_idempotency_keys.sql
psql $DATABASE_URL -f supabase/migrations/20251221000003_stripe_billing_fields.sql
```

**Ou via Supabase Dashboard:**
1. SQL Editor → New Query
2. Copiar conteúdo de cada migration
3. Run

---

### ✅ Passo 2: Criar Conta Stripe (10min)

1. Acesse: https://stripe.com
2. Clique em "Sign up"
3. Preencha dados da empresa
4. **Use modo TEST primeiro**
5. Acesse Dashboard

---

### ✅ Passo 3: Criar Produtos no Stripe (10min)

**No Stripe Dashboard:**

1. Products → Add Product

**Produto 1: Plano Básico**
```
Name: Plano Básico
Description: Ideal para começar
Price: R$ 49,00
Billing: Recurring monthly
```
→ Copiar `price_xxx`

**Produto 2: Plano Pro**
```
Name: Plano Pro
Description: Completo para crescer
Price: R$ 149,00
Billing: Recurring monthly
```
→ Copiar `price_yyy`

**Produto 3: Plano Enterprise**
```
Name: Plano Enterprise
Description: Para redes e franquias
Price: R$ 299,00
Billing: Recurring monthly
```
→ Copiar `price_zzz`

---

### ✅ Passo 4: Atualizar Price IDs no Banco (2min)

```sql
-- No Supabase SQL Editor:
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxx' 
WHERE id = 'basic';

UPDATE subscription_plans 
SET stripe_price_id = 'price_yyy' 
WHERE id = 'pro';

UPDATE subscription_plans 
SET stripe_price_id = 'price_zzz' 
WHERE id = 'enterprise';
```

---

### ✅ Passo 5: Configurar Webhook no Stripe (5min)

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Add endpoint
6. Copiar: `whsec_...` (Signing secret)

---

### ✅ Passo 6: Copiar Keys do Stripe (3min)

**No Stripe Dashboard:**

1. Developers → API keys
2. Copiar:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...` (Reveal)
3. Developers → Webhooks → [seu webhook]
4. Copiar:
   - **Signing secret:** `whsec_...`

---

### ✅ Passo 7: Configurar Email no Supabase (5min)

1. Supabase Dashboard → Authentication → Settings
2. **Enable email confirmation:** ON
3. Email Templates → Customize (opcional)
4. URL Configuration:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: Adicionar URLs de produção

---

### ✅ Passo 8: Adicionar Variáveis no .env.local (5min)

```env
# Supabase (já deve ter)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (ADICIONAR)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Opcional (sistema funciona sem)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=https://...
```

---

### ✅ Passo 9: Deploy Vercel (15min)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar variáveis de ambiente
# Vercel Dashboard → Settings → Environment Variables
# Adicionar TODAS as variáveis do .env.local
```

---

### ✅ Passo 10: Testar Fluxo Completo (30min)

**Teste 1: Criar Loja**
1. Acesse `/onboarding`
2. Preencha dados
3. Publique loja
4. Verifique trial de 10 dias ativado

**Teste 2: Fazer Pedido**
1. Acesse cardápio público: `/{slug}`
2. Adicione produtos ao carrinho
3. Finalize pedido
4. Verifique pedido no dashboard

**Teste 3: Checkout Stripe (Cartão Teste)**
1. Acesse `/billing/plans`
2. Selecione plano Pro
3. Clique "Assinar"
4. Use cartão teste: `4242 4242 4242 4242`
5. Data: qualquer futura
6. CVC: qualquer 3 dígitos
7. Confirme pagamento
8. Verifique subscription ativada

**Teste 4: Webhook**
1. Stripe Dashboard → Developers → Webhooks
2. Clique no webhook criado
3. Verifique eventos recebidos
4. Status deve ser: `200 OK`

**Teste 5: Portal do Cliente**
1. Dashboard → Billing → Gerenciar Assinatura
2. Deve abrir Stripe Portal
3. Teste: atualizar cartão, cancelar, etc

---

## 🎉 PRONTO!

Após completar estes 10 passos:

**✅ Sistema 100% funcional**  
**✅ Cobrança automática ativa**  
**✅ Trial → Pagamento funcionando**  
**✅ Suspensão automática de inadimplentes**  
**✅ Pronto para receber clientes pagantes**

---

## 🆘 TROUBLESHOOTING

### Webhook não recebe eventos

**Solução:**
1. Verificar URL está correta
2. Verificar endpoint está público
3. Testar com Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

### Checkout redireciona mas não ativa

**Solução:**
1. Verificar webhook está configurado
2. Verificar `STRIPE_WEBHOOK_SECRET` está correto
3. Ver logs do webhook no Stripe Dashboard

### Build falha no deploy

**Solução:**
```bash
# Local
npm run build

# Se passar local mas falhar no Vercel:
# Verificar Node version (deve ser 18+)
# Limpar cache: Vercel Dashboard → Deployments → ... → Redeploy
```

---

**FIM DO CHECKLIST**

*Siga estes passos e terá sistema 100% funcional em 1h 15min.*
