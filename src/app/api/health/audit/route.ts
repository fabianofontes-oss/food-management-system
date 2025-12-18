import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de Auditoria Completa do Sistema
 * Verifica TODOS os problemas possíveis no banco de dados
 */

interface AuditItem {
  category: string
  name: string
  description: string
  count: number
  severity: 'critical' | 'warning' | 'info'
  action?: string
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const audits: AuditItem[] = []

  // ========== TENANTS ==========
  
  // Tenants sem email
  try {
    const { count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .or('email.is.null,email.eq.')
    if (count && count > 0) {
      audits.push({
        category: 'Tenants',
        name: 'Tenants sem email',
        description: 'Tenants sem email cadastrado não receberão faturas',
        count,
        severity: 'critical',
        action: 'Adicionar email em /admin/tenants'
      })
    }
  } catch (e) {}

  // Tenants sem plano
  try {
    const { data: tenants } = await supabase.from('tenants').select('id')
    const { data: subs } = await supabase.from('tenant_subscriptions').select('tenant_id')
    if (tenants && subs) {
      const subIds = new Set(subs.map(s => s.tenant_id))
      const withoutPlan = tenants.filter(t => !subIds.has(t.id)).length
      if (withoutPlan > 0) {
        audits.push({
          category: 'Tenants',
          name: 'Tenants sem plano',
          description: 'Tenants sem plano não serão cobrados',
          count: withoutPlan,
          severity: 'critical',
          action: 'Atribuir plano em /admin/tenants'
        })
      }
    }
  } catch (e) {}

  // Tenants suspensos
  try {
    const { count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended')
    if (count && count > 0) {
      audits.push({
        category: 'Tenants',
        name: 'Tenants suspensos',
        description: 'Tenants com acesso bloqueado',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // Tenants em trial expirando
  try {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const { count } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trial')
      .lt('trial_ends_at', threeDaysFromNow.toISOString())
    if (count && count > 0) {
      audits.push({
        category: 'Tenants',
        name: 'Trials expirando em 3 dias',
        description: 'Tenants que vão perder acesso em breve',
        count,
        severity: 'warning'
      })
    }
  } catch (e) {}

  // ========== LOJAS ==========

  // Lojas sem tenant
  try {
    const { count } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .is('tenant_id', null)
    if (count && count > 0) {
      audits.push({
        category: 'Lojas',
        name: 'Lojas sem tenant',
        description: 'Lojas órfãs que não pertencem a nenhum tenant',
        count,
        severity: 'critical'
      })
    }
  } catch (e) {}

  // Lojas inativas
  try {
    const { count } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
    if (count && count > 0) {
      audits.push({
        category: 'Lojas',
        name: 'Lojas inativas',
        description: 'Lojas desativadas que não aparecem no sistema',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // Lojas sem produtos
  try {
    const { data: stores } = await supabase.from('stores').select('id')
    if (stores) {
      let emptyStores = 0
      for (const store of stores.slice(0, 50)) { // Limitar para performance
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
        if (!count || count === 0) emptyStores++
      }
      if (emptyStores > 0) {
        audits.push({
          category: 'Lojas',
          name: 'Lojas sem produtos',
          description: 'Lojas que não têm nenhum produto cadastrado',
          count: emptyStores,
          severity: 'warning'
        })
      }
    }
  } catch (e) {}

  // Lojas sem categorias
  try {
    const { data: stores } = await supabase.from('stores').select('id')
    if (stores) {
      let noCatStores = 0
      for (const store of stores.slice(0, 50)) {
        const { count } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id)
        if (!count || count === 0) noCatStores++
      }
      if (noCatStores > 0) {
        audits.push({
          category: 'Lojas',
          name: 'Lojas sem categorias',
          description: 'Lojas que não têm categorias de produtos',
          count: noCatStores,
          severity: 'warning'
        })
      }
    }
  } catch (e) {}

  // ========== PRODUTOS ==========

  // Produtos sem preço
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('base_price.is.null,base_price.eq.0')
    if (count && count > 0) {
      audits.push({
        category: 'Produtos',
        name: 'Produtos sem preço',
        description: 'Produtos com preço zero ou não definido',
        count,
        severity: 'critical'
      })
    }
  } catch (e) {}

  // Produtos sem categoria
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('category_id', null)
    if (count && count > 0) {
      audits.push({
        category: 'Produtos',
        name: 'Produtos sem categoria',
        description: 'Produtos órfãos sem categoria definida',
        count,
        severity: 'warning'
      })
    }
  } catch (e) {}

  // Produtos sem imagem
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('image_url.is.null,image_url.eq.')
    if (count && count > 0) {
      audits.push({
        category: 'Produtos',
        name: 'Produtos sem imagem',
        description: 'Produtos sem foto cadastrada',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // Produtos inativos
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
    if (count && count > 0) {
      audits.push({
        category: 'Produtos',
        name: 'Produtos inativos',
        description: 'Produtos desativados no cardápio',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // Produtos sem descrição
  try {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or('description.is.null,description.eq.')
    if (count && count > 0) {
      audits.push({
        category: 'Produtos',
        name: 'Produtos sem descrição',
        description: 'Produtos sem descrição detalhada',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // ========== PEDIDOS ==========

  // Pedidos pendentes há mais de 24h
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING')
      .lt('created_at', yesterday.toISOString())
    if (count && count > 0) {
      audits.push({
        category: 'Pedidos',
        name: 'Pedidos pendentes há +24h',
        description: 'Pedidos não processados há mais de um dia',
        count,
        severity: 'critical'
      })
    }
  } catch (e) {}

  // Pedidos sem loja
  try {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .is('store_id', null)
    if (count && count > 0) {
      audits.push({
        category: 'Pedidos',
        name: 'Pedidos sem loja',
        description: 'Pedidos órfãos sem loja vinculada',
        count,
        severity: 'critical'
      })
    }
  } catch (e) {}

  // Pedidos com valor zero
  try {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .or('total_amount.is.null,total_amount.eq.0')
    if (count && count > 0) {
      audits.push({
        category: 'Pedidos',
        name: 'Pedidos com valor zero',
        description: 'Pedidos sem valor definido',
        count,
        severity: 'warning'
      })
    }
  } catch (e) {}

  // ========== FATURAS ==========

  // Faturas vencidas
  try {
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')
    if (count && count > 0) {
      audits.push({
        category: 'Faturas',
        name: 'Faturas vencidas',
        description: 'Faturas não pagas após vencimento',
        count,
        severity: 'critical',
        action: 'Ver em /admin/billing'
      })
    }
  } catch (e) {}

  // Faturas pendentes
  try {
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (count && count > 0) {
      audits.push({
        category: 'Faturas',
        name: 'Faturas pendentes',
        description: 'Faturas aguardando pagamento',
        count,
        severity: 'info'
      })
    }
  } catch (e) {}

  // ========== USUÁRIOS ==========

  // Usuários sem store vinculada
  try {
    const { data: users } = await supabase.from('users').select('id')
    const { data: storeUsers } = await supabase.from('store_users').select('user_id')
    if (users && storeUsers) {
      const linkedIds = new Set(storeUsers.map(s => s.user_id))
      const unlinked = users.filter(u => !linkedIds.has(u.id)).length
      if (unlinked > 0) {
        audits.push({
          category: 'Usuários',
          name: 'Usuários sem loja',
          description: 'Usuários não vinculados a nenhuma loja',
          count: unlinked,
          severity: 'warning'
        })
      }
    }
  } catch (e) {}

  // ========== CATEGORIAS ==========

  // Categorias vazias
  try {
    const { data: categories } = await supabase.from('categories').select('id')
    if (categories) {
      let empty = 0
      for (const cat of categories.slice(0, 100)) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        if (!count || count === 0) empty++
      }
      if (empty > 0) {
        audits.push({
          category: 'Categorias',
          name: 'Categorias vazias',
          description: 'Categorias sem nenhum produto',
          count: empty,
          severity: 'info'
        })
      }
    }
  } catch (e) {}

  // ========== ESTATÍSTICAS ==========
  const stats = {
    total: audits.length,
    critical: audits.filter(a => a.severity === 'critical').length,
    warning: audits.filter(a => a.severity === 'warning').length,
    info: audits.filter(a => a.severity === 'info').length,
    totalIssues: audits.reduce((sum, a) => sum + a.count, 0)
  }

  // Agrupar por categoria
  const categories = [...new Set(audits.map(a => a.category))]
  const byCategory = categories.map(cat => ({
    category: cat,
    items: audits.filter(a => a.category === cat),
    totalIssues: audits.filter(a => a.category === cat).reduce((sum, a) => sum + a.count, 0)
  }))

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stats,
    byCategory,
    all: audits.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
  })
}
