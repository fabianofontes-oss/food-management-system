# 🔧 PLANO DETALHADO DE CORREÇÃO - Problemas Críticos

**Data:** 19/12/2024  
**Tempo estimado total:** 10-12 dias  
**Prioridade:** MÁXIMA  

---

## 📋 ÍNDICE

1. [Problema #1: Billing não funcional](#problema-1-billing-não-funcional)
2. [Problema #2: Vulnerabilidades de segurança](#problema-2-vulnerabilidades-de-segurança)
3. [Problema #3: Rate Limiting](#problema-3-rate-limiting)
4. [Problema #4: Monitoramento](#problema-4-monitoramento)
5. [Problema #5: Performance (N+1)](#problema-5-performance-n1-queries)
6. [Cronograma de Implementação](#cronograma-de-implementação)

---

## PROBLEMA #1: BILLING NÃO FUNCIONAL

### 🔴 Severidade: CRÍTICA - BLOQUEADOR TOTAL

### Situação Atual

```typescript
// O que existe hoje:
- ✅ Tabela subscriptions criada
- ✅ Trial de 10 dias ao publicar
- ✅ Função para verificar trial ativo
- ❌ ZERO integração com gateway de pagamento
- ❌ ZERO cobrança automática
- ❌ ZERO suspensão de inadimplentes
```

### O Que Precisa Ser Feito

#### Etapa 1.1: Criar Conta no Stripe (30 min)

**Passos:**
1. Acesse https://stripe.com
2. Crie conta (use email da empresa)
3. Ative modo de teste primeiro
4. Copie as keys:
   - `pk_test_...` (Publishable Key)
   - `sk_test_...` (Secret Key)

**Adicionar no `.env.local`:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Vem depois
```

---

#### Etapa 1.2: Instalar Stripe SDK (5 min)

```bash
npm install stripe @stripe/stripe-js
```

---

#### Etapa 1.3: Criar Produtos e Preços no Stripe (1 hora)

**No Dashboard do Stripe:**

1. Vá em **Products** → **Add Product**

**Produto 1: Plano Pro**
```
Name: Plano Pro
Description: Pedidos ilimitados + Todos os módulos
Price: R$ 149,00 / mês
Billing: Recurring monthly
```

**Produto 2: Plano Enterprise**
```
Name: Plano Enterprise
Description: Tudo do Pro + White-label + API
Price: R$ 299,00 / mês
Billing: Recurring monthly
```

2. Copie os **Price IDs**:
   - `price_1ABC...` (Pro)
   - `price_2DEF...` (Enterprise)

**Adicionar no `.env.local`:**
```bash
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1ABC...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_2DEF...
```

---

#### Etapa 1.4: Criar Módulo de Billing (2 horas)

**Arquivo:** `src/modules/billing/types.ts`

```typescript
import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  tenantId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: number;
  cancel_at_period_end: boolean;
}
```

**Arquivo:** `src/modules/billing/stripe-client.ts`

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});
```

**Arquivo:** `src/modules/billing/actions.ts`

```typescript
'use server';

import { stripe } from './stripe-client';
import { createCheckoutSessionSchema } from './types';
import { createClient } from '@/lib/supabase/server';

export async function createCheckoutSession(input: unknown) {
  try {
    const validated = createCheckoutSessionSchema.parse(input);
    
    // Criar Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: validated.priceId,
          quantity: 1,
        },
      ],
      success_url: validated.successUrl,
      cancel_url: validated.cancelUrl,
      client_reference_id: validated.tenantId, // Importante!
      metadata: {
        tenant_id: validated.tenantId,
      },
    });

    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Erro ao criar checkout session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function getSubscriptionStatus(tenantId: string) {
  try {
    const supabase = createClient();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!subscription) {
      return { success: false, error: 'Subscription não encontrada' };
    }

    // Se tem stripe_subscription_id, buscar status atualizado
    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      return {
        success: true,
        data: {
          status: stripeSubscription.status,
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          trial_ends_at: subscription.trial_ends_at,
        },
      };
    }

    // Trial sem Stripe ainda
    return {
      success: true,
      data: {
        status: 'trialing',
        trial_ends_at: subscription.trial_ends_at,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
```

---

#### Etapa 1.5: Criar API Route para Checkout (30 min)

**Arquivo:** `src/app/api/billing/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/modules/billing/actions';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { priceId, tenantId } = body;

    // Verificar se usuário tem acesso ao tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .eq('owner_id', session.user.id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Criar checkout session
    const result = await createCheckoutSession({
      priceId,
      tenantId,
      successUrl: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/billing/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/billing/canceled`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na API de checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
```

---

#### Etapa 1.6: Criar Webhook do Stripe (3 horas) ⚠️ CRÍTICO

**Arquivo:** `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/modules/billing/stripe-client';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// IMPORTANTE: Desabilitar body parser do Next.js
export const runtime = 'edge';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.client_reference_id || session.metadata?.tenant_id;
  
  if (!tenantId) {
    console.error('No tenant_id in checkout session');
    return;
  }

  // Atualizar subscription no banco
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log(`✅ Checkout completed for tenant ${tenantId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log(`✅ Subscription updated: ${subscription.id} - ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Suspender loja
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('tenant_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (sub) {
    // Marcar todas as lojas do tenant como inativas
    await supabaseAdmin
      .from('stores')
      .update({ status: 'suspended' })
      .eq('tenant_id', sub.tenant_id);

    // Atualizar subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    console.log(`🔴 Subscription canceled and store suspended: ${sub.tenant_id}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // Marcar como past_due
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // TODO: Enviar email de cobrança
  console.log(`⚠️ Payment failed for subscription: ${subscriptionId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // Reativar se estava suspensa
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('tenant_id, status')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (sub && sub.status === 'past_due') {
    // Reativar lojas
    await supabaseAdmin
      .from('stores')
      .update({ status: 'active' })
      .eq('tenant_id', sub.tenant_id);

    // Atualizar subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    console.log(`✅ Payment succeeded and store reactivated: ${sub.tenant_id}`);
  }
}
```

---

#### Etapa 1.7: Configurar Webhook no Stripe (15 min)

**No Dashboard do Stripe:**

1. Vá em **Developers** → **Webhooks**
2. Clique **Add endpoint**
3. URL: `https://seu-dominio.com/api/webhooks/stripe`
4. Eventos a ouvir:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copie o **Signing secret**: `whsec_...`

**Adicionar no `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

#### Etapa 1.8: Criar Cron Job para Verificar Trials Expirados (2 horas)

**Arquivo:** `src/app/api/cron/check-expired-trials/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Verificar authorization header (Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar trials expirados
    const { data: expiredTrials, error } = await supabaseAdmin
      .from('subscriptions')
      .select('tenant_id, trial_ends_at')
      .eq('status', 'trialing')
      .lt('trial_ends_at', new Date().toISOString());

    if (error) throw error;

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired trials found' 
      });
    }

    // Suspender lojas
    for (const trial of expiredTrials) {
      // Suspender stores
      await supabaseAdmin
        .from('stores')
        .update({ status: 'suspended' })
        .eq('tenant_id', trial.tenant_id);

      // Atualizar subscription
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', trial.tenant_id);

      console.log(`🔴 Trial expired and store suspended: ${trial.tenant_id}`);
      
      // TODO: Enviar email notificando
    }

    return NextResponse.json({
      success: true,
      suspended: expiredTrials.length,
    });
  } catch (error) {
    console.error('Error checking expired trials:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

**Configurar no Vercel:**

1. Vá em **Settings** → **Cron Jobs**
2. Adicione:
   - Path: `/api/cron/check-expired-trials`
   - Schedule: `0 */6 * * *` (a cada 6 horas)

**Adicionar no `.env.local`:**
```bash
CRON_SECRET=seu-secret-aleatorio-aqui
```

---

#### Etapa 1.9: Criar UI de Billing no Dashboard (2 horas)

**Arquivo:** `src/app/[slug]/dashboard/billing/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSubscriptionStatus } from '@/modules/billing/actions';

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    // TODO: Buscar tenant_id da store
    const tenantId = 'xxx'; // Implementar
    
    const result = await getSubscriptionStatus(tenantId);
    if (result.success) {
      setSubscription(result.data);
    }
    setLoading(false);
  }

  async function handleUpgrade(priceId: string) {
    setLoading(true);
    
    const res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        tenantId: 'xxx', // TODO: Implementar
      }),
    });

    const data = await res.json();
    
    if (data.success && data.url) {
      window.location.href = data.url; // Redirecionar para Stripe Checkout
    } else {
      alert('Erro ao criar checkout');
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Assinatura</h1>

      {/* Status atual */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {isTrialing && (
            <>
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold">Trial Ativo</h2>
                <p className="text-gray-600">
                  Seu trial expira em{' '}
                  {subscription?.trial_ends_at 
                    ? new Date(subscription.trial_ends_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </>
          )}
          
          {isActive && (
            <>
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h2 className="text-xl font-bold">Assinatura Ativa</h2>
                <p className="text-gray-600">
                  Próxima cobrança em{' '}
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </>
          )}

          {isPastDue && (
            <>
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-600">Pagamento Pendente</h2>
                <p className="text-gray-600">
                  Atualize seu método de pagamento para continuar usando
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Planos */}
      {isTrialing && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-2 border-violet-500">
            <h3 className="text-2xl font-bold mb-2">Plano Pro</h3>
            <p className="text-4xl font-bold mb-4">
              R$ 149<span className="text-lg text-gray-600">/mês</span>
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Pedidos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Todos os módulos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Suporte prioritário
              </li>
            </ul>
            <Button
              onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)}
              className="w-full"
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Plano Pro
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold mb-2">Plano Enterprise</h3>
            <p className="text-4xl font-bold mb-4">
              R$ 299<span className="text-lg text-gray-600">/mês</span>
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Tudo do Pro
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                White-label
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                API access
              </li>
            </ul>
            <Button
              onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!)}
              className="w-full"
              disabled={loading}
              variant="outline"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Enterprise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

#### Etapa 1.10: Testar Fluxo Completo (1 dia)

**Checklist de testes:**

1. **Trial → Pagamento**
   - [ ] Criar loja nova
   - [ ] Verificar trial de 10 dias ativo
   - [ ] Clicar em "Assinar Plano Pro"
   - [ ] Preencher dados no Stripe Checkout (usar cartão de teste)
   - [ ] Verificar se webhook foi recebido
   - [ ] Verificar se subscription foi atualizada no banco
   - [ ] Verificar se loja continua ativa

2. **Pagamento Falhou**
   - [ ] Simular falha de pagamento no Stripe
   - [ ] Verificar se webhook foi recebido
   - [ ] Verificar se status mudou para `past_due`
   - [ ] Verificar se loja foi suspensa

3. **Pagamento Recuperado**
   - [ ] Simular pagamento bem-sucedido
   - [ ] Verificar se loja foi reativada
   - [ ] Verificar se status voltou para `active`

4. **Trial Expirado**
   - [ ] Criar loja com trial expirado (alterar data no banco)
   - [ ] Rodar cron job manualmente
   - [ ] Verificar se loja foi suspensa
   - [ ] Verificar se status mudou para `unpaid`

5. **Cancelamento**
   - [ ] Cancelar assinatura no Stripe
   - [ ] Verificar se webhook foi recebido
   - [ ] Verificar se loja foi suspensa
   - [ ] Verificar se status mudou para `canceled`

---

### ⏱️ Tempo Total: 5-7 dias

### 💰 Custo: R$ 0 (Stripe não cobra setup, só comissão por transação)

---

## PROBLEMA #2: VULNERABILIDADES DE SEGURANÇA

### 🔴 Severidade: CRÍTICA

### Correções Necessárias

#### Correção 2.1: Proteger Service Role Key (1 hora)

**Problema:**
```typescript
// ❌ NUNCA fazer isso
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

**Solução:**

1. **Mover lógica privilegiada para Edge Functions**

**Criar:** `supabase/functions/create-draft-store/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { slug } = await req.json()

  // Validar slug
  if (!slug || typeof slug !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Slug inválido' }),
      { status: 400 }
    )
  }

  // Criar draft
  const { data, error } = await supabaseAdmin
    .from('draft_stores')
    .insert({ slug, config: {} })
    .select()
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

2. **Chamar Edge Function ao invés de usar service role no client**

```typescript
// src/modules/draft-store/repository.ts
export const draftStoreRepository = {
  async createDraft(input: CreateDraftStoreInput): Promise<DraftStore> {
    // ✅ Chamar Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-draft-store`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(input),
      }
    )

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  },
}
```

---

#### Correção 2.2: Corrigir RLS do draft_stores (15 min)

**Problema:**
```sql
-- ❌ Qualquer um pode ler TUDO
CREATE POLICY "draft_stores_read_by_token" ON public.draft_stores
  FOR SELECT USING (true);
```

**Solução:**
```sql
-- ✅ Apenas quem tem o token pode ler
DROP POLICY IF EXISTS "draft_stores_read_by_token" ON public.draft_stores;

CREATE POLICY "draft_stores_read_by_token" ON public.draft_stores
  FOR SELECT
  USING (
    -- Permitir leitura apenas se o draft_token foi passado via RPC
    draft_token::text = current_setting('request.headers', true)::json->>'x-draft-token'
  );

-- Ou melhor ainda: usar Edge Function que não precisa de RLS
```

---

#### Correção 2.3: Ativar Confirmação de Email (5 min)

**No Supabase Dashboard:**

1. Vá em **Authentication** → **Email Templates**
2. Ative **Confirm signup**
3. Customize o template (opcional)

**No código:**
```typescript
// src/app/(auth)/signup/SignupClient.tsx
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      name: formData.name,
      phone: formData.phone,
    },
  },
})

// Mostrar mensagem
if (data.user && !data.session) {
  // Email de confirmação foi enviado
  setSuccess(true)
  setMessage('Verifique seu email para confirmar a conta')
}
```

---

#### Correção 2.4: Adicionar CAPTCHA (2 horas)

**Instalar:**
```bash
npm install @hcaptcha/react-hcaptcha
```

**Criar conta:** https://www.hcaptcha.com/

**Adicionar no signup:**
```typescript
// src/app/(auth)/signup/SignupClient.tsx
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function SignupClient() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  return (
    <form onSubmit={handleSubmit}>
      {/* ... campos ... */}
      
      <HCaptcha
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        onVerify={(token) => setCaptchaToken(token)}
      />

      <Button 
        type="submit" 
        disabled={!captchaToken || loading}
      >
        Criar conta
      </Button>
    </form>
  );
}
```

**Validar no backend:**
```typescript
// src/app/api/onboarding/publish-draft/route.ts
async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
  });

  const data = await response.json();
  return data.success;
}

export async function POST(req: NextRequest) {
  const { captchaToken, ...rest } = await req.json();

  // Verificar CAPTCHA
  const isValid = await verifyCaptcha(captchaToken);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: 'CAPTCHA inválido' },
      { status: 400 }
    );
  }

  // Continuar...
}
```

---

### ⏱️ Tempo Total: 4-5 horas

---

## PROBLEMA #3: RATE LIMITING

### 🟡 Severidade: GRAVE

### Solução: Upstash Redis + Rate Limiting

#### Etapa 3.1: Criar Conta no Upstash (5 min)

1. Acesse https://upstash.com
2. Crie conta gratuita
3. Crie database Redis
4. Copie credenciais:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

#### Etapa 3.2: Instalar SDK (1 min)

```bash
npm install @upstash/ratelimit @upstash/redis
```

---

#### Etapa 3.3: Criar Middleware de Rate Limiting (1 hora)

**Arquivo:** `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Criar instância do Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters para diferentes endpoints
export const rateLimiters = {
  // API geral: 10 requests por 10 segundos
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  }),

  // Signup: 3 tentativas por hora
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
  }),

  // Draft store: 5 por hora
  draftStore: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
  }),
};

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; remaining?: number }> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return { success: false };
  }

  return { success: true, remaining };
}
```

---

#### Etapa 3.4: Aplicar em API Routes (30 min)

**Exemplo:**
```typescript
// src/app/api/draft-store/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Pegar IP do cliente
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';

  // Verificar rate limit
  const { success } = await checkRateLimit(
    `draft-store:${ip}`,
    rateLimiters.draftStore
  );

  if (!success) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Muitas tentativas. Tente novamente em 1 hora.' 
      },
      { status: 429 }
    );
  }

  // Continuar normalmente...
}
```

---

### ⏱️ Tempo Total: 2 horas

---

## PROBLEMA #4: MONITORAMENTO

### 🟡 Severidade: GRAVE

### Solução: Sentry + Logs Estruturados

#### Etapa 4.1: Integrar Sentry (30 min)

**Instalar:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Configurar:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Usar:**
```typescript
try {
  // código
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

#### Etapa 4.2: Configurar Alertas no Supabase (15 min)

**No Supabase Dashboard:**

1. Vá em **Settings** → **Alerts**
2. Configure:
   - Database CPU > 80%
   - Database Memory > 80%
   - API requests > 10k/min
   - Auth rate limit exceeded

---

#### Etapa 4.3: Logs Estruturados (1 hora)

**Arquivo:** `src/lib/logger.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  tenantId?: string;
  storeId?: string;
  [key: string]: any;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  },

  warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
    
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  },

  error(message: string, error: Error, context?: LogContext) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    }));

    Sentry.captureException(error, {
      extra: context,
    });
  },
};
```

**Usar:**
```typescript
import { logger } from '@/lib/logger';

logger.info('Pedido criado', { 
  orderId: order.id, 
  storeId: store.id 
});

logger.error('Falha ao processar pagamento', error, {
  orderId: order.id,
  amount: order.total,
});
```

---

### ⏱️ Tempo Total: 2 horas

---

## PROBLEMA #5: PERFORMANCE (N+1 QUERIES)

### 🟡 Severidade: GRAVE

### Solução: Otimizar Queries

#### Exemplo: Dashboard de Pedidos

**❌ ANTES (N+1):**
```typescript
const orders = await supabase.from('orders').select('*');

for (const order of orders) {
  const items = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);
  
  const customer = await supabase
    .from('customers')
    .select('*')
    .eq('id', order.customer_id)
    .single();
}
```

**✅ DEPOIS (1 query):**
```typescript
const { data: orders } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (*),
    customers (*)
  `)
  .order('created_at', { ascending: false })
  .limit(50);
```

---

### ⏱️ Tempo Total: 1 dia (revisar todos os endpoints)

---

## CRONOGRAMA DE IMPLEMENTAÇÃO

### Semana 1 (Dias 1-5) - CRÍTICO

| Dia | Tarefa | Tempo | Responsável |
|-----|--------|-------|-------------|
| 1 | Stripe: Setup + Produtos | 2h | Dev |
| 1-2 | Stripe: Módulo Billing | 4h | Dev |
| 2 | Stripe: API Routes | 2h | Dev |
| 3 | Stripe: Webhook | 4h | Dev |
| 3 | Stripe: Configurar webhook | 1h | Dev |
| 4 | Stripe: Cron Job | 2h | Dev |
| 4 | Stripe: UI Billing | 2h | Dev |
| 5 | Stripe: Testes completos | 8h | Dev + QA |

### Semana 2 (Dias 6-10) - IMPORTANTE

| Dia | Tarefa | Tempo | Responsável |
|-----|--------|-------|-------------|
| 6 | Segurança: Edge Functions | 2h | Dev |
| 6 | Segurança: RLS | 1h | Dev |
| 6 | Segurança: Email confirm | 1h | Dev |
| 7 | Segurança: CAPTCHA | 2h | Dev |
| 7 | Rate Limiting: Setup | 2h | Dev |
| 8 | Monitoramento: Sentry | 1h | Dev |
| 8 | Monitoramento: Logs | 2h | Dev |
| 9-10 | Performance: Otimizar queries | 16h | Dev |

### Semana 3 (Dias 11-12) - TESTES

| Dia | Tarefa | Tempo | Responsável |
|-----|--------|-------|-------------|
| 11 | Testes E2E completos | 8h | QA |
| 12 | Correções de bugs | 8h | Dev |

---

## ✅ CHECKLIST FINAL

Antes de lançar em produção:

### Billing
- [ ] Stripe configurado (test mode)
- [ ] Produtos e preços criados
- [ ] Webhook configurado e testado
- [ ] Cron job rodando
- [ ] UI de billing funcionando
- [ ] Teste: Trial → Pagamento → Ativo
- [ ] Teste: Pagamento falhou → Suspensão
- [ ] Teste: Trial expirado → Suspensão

### Segurança
- [ ] Service role key protegida
- [ ] RLS corrigido
- [ ] Email confirmation ativo
- [ ] CAPTCHA implementado
- [ ] Rate limiting ativo
- [ ] Secrets rotacionados

### Monitoramento
- [ ] Sentry configurado
- [ ] Alertas do Supabase ativos
- [ ] Logs estruturados
- [ ] Dashboard de métricas

### Performance
- [ ] N+1 queries corrigidos
- [ ] Imagens otimizadas
- [ ] Caching implementado

### Testes
- [ ] Todos os testes E2E passando
- [ ] Testes manuais completos
- [ ] Load testing (opcional)

---

## 💰 CUSTOS ESTIMADOS

| Serviço | Custo/mês | Observação |
|---------|-----------|------------|
| Stripe | 2.9% + R$ 0,39 por transação | Só paga quando vende |
| Upstash Redis | Grátis até 10k requests | Depois ~$10/mês |
| Sentry | Grátis até 5k events | Depois ~$26/mês |
| Supabase | R$ 125/mês (Pro) | Já está usando |
| Vercel | Grátis (Hobby) | Ou $20/mês (Pro) |
| **TOTAL** | **~R$ 125-200/mês** | Sem contar transações |

---

## 🎯 RESULTADO ESPERADO

Após implementar tudo:

✅ Sistema cobra automaticamente  
✅ Trials expiram e suspendem lojas  
✅ Inadimplentes são suspensos  
✅ Pagamentos reativam lojas  
✅ Sistema é seguro contra ataques  
✅ Você sabe quando algo quebra  
✅ Performance é boa  

**Aí sim pode lançar em produção! 🚀**

---

**Boa sorte com a implementação!**
