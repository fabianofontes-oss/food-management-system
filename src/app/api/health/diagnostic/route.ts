import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de Diagnóstico Automático do Sistema
 * Verifica TODAS as funcionalidades e mostra o que está funcionando ou não
 */

interface FeatureStatus {
  id: string
  name: string
  category: string
  status: 'working' | 'broken' | 'incomplete' | 'not_configured'
  message: string
  details?: string[]
  fixAction?: string
}

interface DiagnosticResult {
  timestamp: string
  summary: {
    total: number
    working: number
    broken: number
    incomplete: number
    notConfigured: number
    healthScore: number
  }
  features: FeatureStatus[]
  byCategory: {
    category: string
    features: FeatureStatus[]
    score: number
  }[]
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const features: FeatureStatus[] = []

  // ==========================================
  // 1. INFRAESTRUTURA
  // ==========================================

  // Database
  try {
    const start = Date.now()
    const { data, error } = await supabase.from('tenants').select('id').limit(1)
    const latency = Date.now() - start
    if (error) throw error
    features.push({
      id: 'database',
      name: 'Banco de Dados (Supabase)',
      category: 'Infraestrutura',
      status: 'working',
      message: `Conectado (${latency}ms)`
    })
  } catch (e: any) {
    features.push({
      id: 'database',
      name: 'Banco de Dados (Supabase)',
      category: 'Infraestrutura',
      status: 'broken',
      message: e.message || 'Erro de conexão',
      fixAction: 'Verificar variáveis SUPABASE_URL e SUPABASE_KEY'
    })
  }

  // Auth
  try {
    const { error } = await supabase.auth.getSession()
    features.push({
      id: 'auth',
      name: 'Autenticação',
      category: 'Infraestrutura',
      status: 'working',
      message: 'Serviço disponível'
    })
  } catch (e: any) {
    features.push({
      id: 'auth',
      name: 'Autenticação',
      category: 'Infraestrutura',
      status: 'broken',
      message: e.message
    })
  }

  // Storage
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) throw error
    features.push({
      id: 'storage',
      name: 'Storage (Imagens)',
      category: 'Infraestrutura',
      status: 'working',
      message: `${data?.length || 0} buckets configurados`
    })
  } catch (e: any) {
    features.push({
      id: 'storage',
      name: 'Storage (Imagens)',
      category: 'Infraestrutura',
      status: 'broken',
      message: e.message
    })
  }

  // ==========================================
  // 2. TABELAS DO BANCO
  // ==========================================

  const tables = [
    { name: 'tenants', display: 'Tenants' },
    { name: 'stores', display: 'Lojas' },
    { name: 'products', display: 'Produtos' },
    { name: 'categories', display: 'Categorias' },
    { name: 'orders', display: 'Pedidos' },
    { name: 'order_items', display: 'Itens de Pedido' },
    { name: 'users', display: 'Usuários' },
    { name: 'store_users', display: 'Usuários de Loja' },
    { name: 'plans', display: 'Planos' },
    { name: 'tenant_subscriptions', display: 'Assinaturas' },
    { name: 'invoices', display: 'Faturas' },
    { name: 'customers', display: 'Clientes' },
    { name: 'tables', display: 'Mesas' },
    { name: 'waiters', display: 'Garçons' },
    { name: 'delivery_people', display: 'Entregadores' },
    { name: 'coupons', display: 'Cupons' },
    { name: 'reviews', display: 'Avaliações' },
    { name: 'addons', display: 'Adicionais' },
    { name: 'addon_groups', display: 'Grupos de Adicionais' },
    { name: 'cash_registers', display: 'Caixas' },
    { name: 'cash_transactions', display: 'Transações de Caixa' },
  ]

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
      features.push({
        id: `table_${table.name}`,
        name: `Tabela: ${table.display}`,
        category: 'Banco de Dados',
        status: 'working',
        message: `${count || 0} registros`
      })
    } catch (e: any) {
      features.push({
        id: `table_${table.name}`,
        name: `Tabela: ${table.display}`,
        category: 'Banco de Dados',
        status: 'broken',
        message: e.message || 'Tabela não existe',
        fixAction: `Criar tabela ${table.name} no Supabase`
      })
    }
  }

  // ==========================================
  // 3. FUNCIONALIDADES DO LOJISTA
  // ==========================================

  // Verificar se existem lojas para testar
  const { data: stores } = await supabase.from('stores').select('id, slug, name, settings').limit(5)
  const testStore = stores?.[0]

  if (testStore) {
    const settings = (testStore.settings as any) || {}
    const sales = settings.sales || {}
    const payments = settings.payments || {}

    // PDV
    features.push({
      id: 'pdv',
      name: 'PDV (Ponto de Venda)',
      category: 'Funcionalidades',
      status: sales.pdv?.enabled !== false ? 'working' : 'not_configured',
      message: sales.pdv?.enabled !== false ? 'Habilitado' : 'Desabilitado nas configurações',
      details: [
        `Tema: ${sales.pdv?.theme || 'light'}`,
        `Layout: ${sales.pdv?.layout || 'grid'}`
      ]
    })

    // Delivery
    features.push({
      id: 'delivery',
      name: 'Delivery',
      category: 'Funcionalidades',
      status: sales.delivery?.enabled ? 'working' : 'not_configured',
      message: sales.delivery?.enabled ? `Raio: ${sales.delivery.radius}km, Taxa: R$${sales.delivery.fee}` : 'Desabilitado',
    })

    // Retirada
    features.push({
      id: 'pickup',
      name: 'Retirada no Local',
      category: 'Funcionalidades',
      status: sales.pickup?.enabled ? 'working' : 'not_configured',
      message: sales.pickup?.enabled ? `Tempo: ${sales.pickup.time}min` : 'Desabilitado',
    })

    // Mesas
    features.push({
      id: 'tables',
      name: 'Sistema de Mesas',
      category: 'Funcionalidades',
      status: sales.tables?.enabled ? 'working' : 'not_configured',
      message: sales.tables?.enabled ? `${sales.tables.count} mesas` : 'Desabilitado',
    })

    // Cozinha
    features.push({
      id: 'kitchen',
      name: 'KDS (Cozinha)',
      category: 'Funcionalidades',
      status: sales.kitchen?.enabled !== false ? 'working' : 'not_configured',
      message: sales.kitchen?.enabled !== false ? 'Habilitado' : 'Desabilitado',
    })

    // Impressão
    features.push({
      id: 'printer',
      name: 'Impressão de Cupons',
      category: 'Funcionalidades',
      status: sales.printer?.enabled ? 'working' : 'not_configured',
      message: sales.printer?.enabled ? `Tipo: ${sales.printer.type}` : 'Não configurado',
    })

    // Pagamentos
    const paymentMethods = []
    if (payments.cash) paymentMethods.push('Dinheiro')
    if (payments.credit) paymentMethods.push('Crédito')
    if (payments.debit) paymentMethods.push('Débito')
    if (payments.pix?.enabled) paymentMethods.push('PIX')

    features.push({
      id: 'payments',
      name: 'Formas de Pagamento',
      category: 'Funcionalidades',
      status: paymentMethods.length > 0 ? 'working' : 'not_configured',
      message: paymentMethods.length > 0 ? paymentMethods.join(', ') : 'Nenhuma configurada',
      fixAction: paymentMethods.length === 0 ? 'Configurar em Settings > Pagamentos' : undefined
    })

    // PIX
    features.push({
      id: 'pix',
      name: 'PIX',
      category: 'Funcionalidades',
      status: payments.pix?.enabled && payments.pix?.key ? 'working' : 
              payments.pix?.enabled ? 'incomplete' : 'not_configured',
      message: payments.pix?.enabled && payments.pix?.key ? 
               `Chave: ${payments.pix.keyType}` : 
               payments.pix?.enabled ? 'Habilitado mas sem chave' : 'Desabilitado',
      fixAction: !payments.pix?.key ? 'Adicionar chave PIX nas configurações' : undefined
    })
  }

  // ==========================================
  // 4. INTEGRAÇÕES
  // ==========================================

  // MercadoPago
  features.push({
    id: 'mercadopago',
    name: 'MercadoPago',
    category: 'Integrações',
    status: process.env.MP_ACCESS_TOKEN ? 'working' : 'not_configured',
    message: process.env.MP_ACCESS_TOKEN ? 'Configurado' : 'MP_ACCESS_TOKEN não definido',
    fixAction: !process.env.MP_ACCESS_TOKEN ? 'Adicionar MP_ACCESS_TOKEN no .env' : undefined
  })

  // WhatsApp (Evolution API)
  features.push({
    id: 'whatsapp',
    name: 'WhatsApp (Evolution)',
    category: 'Integrações',
    status: process.env.EVOLUTION_API_URL ? 'working' : 'not_configured',
    message: process.env.EVOLUTION_API_URL ? 'Configurado' : 'Não configurado',
    fixAction: !process.env.EVOLUTION_API_URL ? 'Adicionar EVOLUTION_API_URL e EVOLUTION_API_KEY' : undefined
  })

  // Google
  features.push({
    id: 'google',
    name: 'Google My Business',
    category: 'Integrações',
    status: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'working' : 'not_configured',
    message: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Configurado' : 'Não configurado',
    fixAction: !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Adicionar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET' : undefined
  })

  // ==========================================
  // 5. SUPER ADMIN
  // ==========================================

  // Planos
  const { count: plansCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true })
  
  features.push({
    id: 'plans',
    name: 'Gestão de Planos',
    category: 'Super Admin',
    status: (plansCount || 0) > 0 ? 'working' : 'incomplete',
    message: (plansCount || 0) > 0 ? `${plansCount} planos cadastrados` : 'Nenhum plano cadastrado',
    fixAction: (plansCount || 0) === 0 ? 'Criar planos em /admin/plans' : undefined
  })

  // Tenants
  const { count: tenantsCount } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
  
  features.push({
    id: 'tenants',
    name: 'Gestão de Tenants',
    category: 'Super Admin',
    status: (tenantsCount || 0) > 0 ? 'working' : 'incomplete',
    message: `${tenantsCount || 0} tenants cadastrados`
  })

  // Billing automático
  const { count: invoicesCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
  
  features.push({
    id: 'billing',
    name: 'Sistema de Billing',
    category: 'Super Admin',
    status: process.env.MP_ACCESS_TOKEN ? 'working' : 'incomplete',
    message: process.env.MP_ACCESS_TOKEN ? 
             `${invoicesCount || 0} faturas geradas` : 
             'Gateway de pagamento não configurado',
    fixAction: !process.env.MP_ACCESS_TOKEN ? 'Configurar MercadoPago para billing automático' : undefined
  })

  // Cron Jobs
  features.push({
    id: 'cron',
    name: 'Jobs Automáticos (Cron)',
    category: 'Super Admin',
    status: process.env.CRON_SECRET ? 'working' : 'not_configured',
    message: process.env.CRON_SECRET ? 'Configurado' : 'CRON_SECRET não definido',
    fixAction: !process.env.CRON_SECRET ? 'Adicionar CRON_SECRET e configurar cron jobs' : undefined
  })

  // ==========================================
  // 6. CALCULAR RESUMO
  // ==========================================

  const summary = {
    total: features.length,
    working: features.filter(f => f.status === 'working').length,
    broken: features.filter(f => f.status === 'broken').length,
    incomplete: features.filter(f => f.status === 'incomplete').length,
    notConfigured: features.filter(f => f.status === 'not_configured').length,
    healthScore: 0
  }

  // Score: working = 100%, incomplete = 50%, not_configured = 25%, broken = 0%
  const totalPoints = features.reduce((sum, f) => {
    if (f.status === 'working') return sum + 100
    if (f.status === 'incomplete') return sum + 50
    if (f.status === 'not_configured') return sum + 25
    return sum // broken = 0
  }, 0)
  summary.healthScore = Math.round(totalPoints / features.length)

  // Agrupar por categoria
  const categories = [...new Set(features.map(f => f.category))]
  const byCategory = categories.map(cat => {
    const catFeatures = features.filter(f => f.category === cat)
    const catPoints = catFeatures.reduce((sum, f) => {
      if (f.status === 'working') return sum + 100
      if (f.status === 'incomplete') return sum + 50
      if (f.status === 'not_configured') return sum + 25
      return sum
    }, 0)
    return {
      category: cat,
      features: catFeatures,
      score: Math.round(catPoints / catFeatures.length)
    }
  })

  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    summary,
    features,
    byCategory
  }

  return NextResponse.json(result)
}
