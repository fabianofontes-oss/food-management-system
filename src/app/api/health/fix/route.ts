import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de Correção Automática do Sistema
 * Corrige problemas detectados pelo diagnóstico
 */

interface FixResult {
  id: string
  name: string
  status: 'fixed' | 'failed' | 'skipped'
  message: string
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fixes: FixResult[] = []

  // ==========================================
  // 1. CRIAR PLANOS PADRÃO SE NÃO EXISTIR
  // ==========================================
  try {
    const { count } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })

    if (!count || count === 0) {
      const defaultPlans = [
        {
          name: 'Gratuito',
          slug: 'free',
          price: 0,
          billing_period: 'monthly',
          features: ['1 loja', 'Até 50 produtos', 'Pedidos ilimitados'],
          limits: { stores: 1, products: 50 },
          is_active: true
        },
        {
          name: 'Básico',
          slug: 'basic',
          price: 49.90,
          billing_period: 'monthly',
          features: ['1 loja', 'Até 200 produtos', 'Pedidos ilimitados', 'Suporte por email'],
          limits: { stores: 1, products: 200 },
          is_active: true
        },
        {
          name: 'Profissional',
          slug: 'pro',
          price: 99.90,
          billing_period: 'monthly',
          features: ['Até 3 lojas', 'Produtos ilimitados', 'PDV completo', 'Relatórios avançados', 'Suporte prioritário'],
          limits: { stores: 3, products: -1 },
          is_active: true
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          price: 299.90,
          billing_period: 'monthly',
          features: ['Lojas ilimitadas', 'Produtos ilimitados', 'API completa', 'Suporte 24/7', 'Gerente dedicado'],
          limits: { stores: -1, products: -1 },
          is_active: true
        }
      ]

      const { error } = await supabase.from('plans').insert(defaultPlans)
      
      if (error) throw error
      
      fixes.push({
        id: 'plans',
        name: 'Planos Padrão',
        status: 'fixed',
        message: '4 planos criados (Gratuito, Básico, Pro, Enterprise)'
      })
    } else {
      fixes.push({
        id: 'plans',
        name: 'Planos Padrão',
        status: 'skipped',
        message: `Já existem ${count} planos`
      })
    }
  } catch (e: any) {
    fixes.push({
      id: 'plans',
      name: 'Planos Padrão',
      status: 'failed',
      message: e.message || 'Erro ao criar planos'
    })
  }

  // ==========================================
  // 2. CRIAR TENANT PADRÃO SE NÃO EXISTIR
  // ==========================================
  try {
    const { count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    if (!count || count === 0) {
      const { data: tenant, error } = await supabase.from('tenants').insert({
        name: 'Tenant Demo',
        email: 'demo@sistema.com',
        status: 'active'
      }).select().single()
      
      if (error) throw error
      
      // Criar loja demo para o tenant
      if (tenant) {
        await supabase.from('stores').insert({
          tenant_id: tenant.id,
          name: 'Loja Demo',
          slug: 'demo',
          niche: 'burger',
          mode: 'store',
          is_active: true,
          settings: {
            sales: {
              delivery: { enabled: true, radius: 5, fee: 5 },
              pickup: { enabled: true, time: 30 },
              pdv: { enabled: true, theme: 'light', layout: 'grid' }
            },
            payments: {
              cash: true,
              credit: true,
              debit: true,
              pix: { enabled: true }
            }
          }
        })
      }
      
      fixes.push({
        id: 'tenant',
        name: 'Tenant Demo',
        status: 'fixed',
        message: 'Tenant e Loja Demo criados'
      })
    } else {
      fixes.push({
        id: 'tenant',
        name: 'Tenant Demo',
        status: 'skipped',
        message: `Já existem ${count} tenants`
      })
    }
  } catch (e: any) {
    fixes.push({
      id: 'tenant',
      name: 'Tenant Demo',
      status: 'failed',
      message: e.message || 'Erro ao criar tenant'
    })
  }

  // ==========================================
  // 3. VINCULAR TENANTS SEM PLANO AO PLANO GRATUITO
  // ==========================================
  try {
    // Buscar plano gratuito
    const { data: freePlan } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (freePlan) {
      // Buscar tenants sem assinatura
      const { data: tenants } = await supabase.from('tenants').select('id')
      const { data: subs } = await supabase.from('tenant_subscriptions').select('tenant_id')
      
      if (tenants && subs) {
        const subIds = new Set(subs.map(s => s.tenant_id))
        const tenantsWithoutPlan = tenants.filter(t => !subIds.has(t.id))
        
        if (tenantsWithoutPlan.length > 0) {
          const subscriptions = tenantsWithoutPlan.map(t => ({
            tenant_id: t.id,
            plan_id: freePlan.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }))
          
          await supabase.from('tenant_subscriptions').insert(subscriptions)
          
          fixes.push({
            id: 'subscriptions',
            name: 'Assinaturas',
            status: 'fixed',
            message: `${tenantsWithoutPlan.length} tenants vinculados ao plano Gratuito`
          })
        } else {
          fixes.push({
            id: 'subscriptions',
            name: 'Assinaturas',
            status: 'skipped',
            message: 'Todos os tenants já têm plano'
          })
        }
      }
    }
  } catch (e: any) {
    fixes.push({
      id: 'subscriptions',
      name: 'Assinaturas',
      status: 'failed',
      message: e.message || 'Erro ao vincular planos'
    })
  }

  // ==========================================
  // 4. CRIAR CATEGORIAS PADRÃO PARA LOJAS SEM CATEGORIAS
  // ==========================================
  try {
    const { data: stores } = await supabase.from('stores').select('id, niche')
    let storesFixed = 0

    if (stores) {
      for (const store of stores) {
        const { count } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)

        if (!count || count === 0) {
          // Criar categorias baseadas no nicho
          const defaultCategories = getCategoriesForNiche(store.niche)
          const categories = defaultCategories.map((name, idx) => ({
            store_id: store.id,
            name,
            sort_order: idx,
            is_active: true
          }))
          
          await supabase.from('categories').insert(categories)
          storesFixed++
        }
      }
    }

    if (storesFixed > 0) {
      fixes.push({
        id: 'categories',
        name: 'Categorias Padrão',
        status: 'fixed',
        message: `Categorias criadas para ${storesFixed} lojas`
      })
    } else {
      fixes.push({
        id: 'categories',
        name: 'Categorias Padrão',
        status: 'skipped',
        message: 'Todas as lojas já têm categorias'
      })
    }
  } catch (e: any) {
    fixes.push({
      id: 'categories',
      name: 'Categorias Padrão',
      status: 'failed',
      message: e.message || 'Erro ao criar categorias'
    })
  }

  // ==========================================
  // 5. CONFIGURAR FORMAS DE PAGAMENTO PADRÃO
  // ==========================================
  try {
    const { data: stores } = await supabase.from('stores').select('id, settings')
    let storesFixed = 0

    if (stores) {
      for (const store of stores) {
        const settings = (store.settings as any) || {}
        const payments = settings.payments || {}
        
        // Se não tem nenhuma forma de pagamento configurada
        if (!payments.cash && !payments.credit && !payments.debit && !payments.pix?.enabled) {
          const newSettings = {
            ...settings,
            payments: {
              cash: true,
              credit: true,
              debit: true,
              pix: { enabled: true }
            }
          }
          
          await supabase.from('stores').update({ settings: newSettings }).eq('id', store.id)
          storesFixed++
        }
      }
    }

    if (storesFixed > 0) {
      fixes.push({
        id: 'payments',
        name: 'Formas de Pagamento',
        status: 'fixed',
        message: `Pagamentos configurados para ${storesFixed} lojas`
      })
    } else {
      fixes.push({
        id: 'payments',
        name: 'Formas de Pagamento',
        status: 'skipped',
        message: 'Todas as lojas já têm pagamentos configurados'
      })
    }
  } catch (e: any) {
    fixes.push({
      id: 'payments',
      name: 'Formas de Pagamento',
      status: 'failed',
      message: e.message || 'Erro ao configurar pagamentos'
    })
  }

  // ==========================================
  // RESUMO
  // ==========================================
  const summary = {
    total: fixes.length,
    fixed: fixes.filter(f => f.status === 'fixed').length,
    failed: fixes.filter(f => f.status === 'failed').length,
    skipped: fixes.filter(f => f.status === 'skipped').length
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary,
    fixes
  })
}

// Helper: Categorias padrão por nicho
function getCategoriesForNiche(niche: string): string[] {
  const categories: Record<string, string[]> = {
    burger: ['Burgers', 'Combos', 'Acompanhamentos', 'Bebidas', 'Sobremesas'],
    acai: ['Açaí', 'Bowls', 'Cremes', 'Adicionais', 'Bebidas'],
    pizza: ['Pizzas Tradicionais', 'Pizzas Especiais', 'Pizzas Doces', 'Bebidas', 'Bordas'],
    hotdog: ['Hot Dogs', 'Combos', 'Batatas', 'Bebidas', 'Molhos Extra'],
    marmita: ['Pratos do Dia', 'Carnes', 'Frango', 'Peixes', 'Vegetariano', 'Bebidas'],
    ice_cream: ['Sorvetes', 'Casquinhas', 'Sundaes', 'Milkshakes', 'Açaí'],
    butcher: ['Carnes Bovinas', 'Carnes Suínas', 'Aves', 'Embutidos', 'Temperados'],
    other: ['Destaques', 'Pratos Principais', 'Acompanhamentos', 'Bebidas', 'Sobremesas']
  }
  return categories[niche] || categories['other']
}
