import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de Status de Saúde do Sistema
 * Verifica todos os componentes críticos
 */

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency?: number
  message?: string
  details?: Record<string, any>
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  version: string
  uptime: number
  checks: HealthCheck[]
  metrics: {
    tenantsCount: number
    storesCount: number
    ordersToday: number
    activeUsers: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthCheck[] = []

  // 1. Verificar Supabase Database
  const dbCheck = await checkDatabase()
  checks.push(dbCheck)

  // 2. Verificar Supabase Auth
  const authCheck = await checkAuth()
  checks.push(authCheck)

  // 3. Verificar Supabase Storage
  const storageCheck = await checkStorage()
  checks.push(storageCheck)

  // 4. Verificar Environment Variables
  const envCheck = checkEnvironment()
  checks.push(envCheck)

  // 5. Verificar MercadoPago (se configurado)
  const mpCheck = await checkMercadoPago()
  checks.push(mpCheck)

  // 6. Verificar Memória/Performance
  const perfCheck = checkPerformance()
  checks.push(perfCheck)

  // Calcular status geral
  const hasDown = checks.some(c => c.status === 'down')
  const hasDegraded = checks.some(c => c.status === 'degraded')
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy'

  // Buscar métricas
  const metrics = await getMetrics()

  const response: SystemHealth = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    checks,
    metrics
  }

  return NextResponse.json(response, {
    status: overallStatus === 'down' ? 503 : 200
  })
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.from('tenants').select('id').limit(1)
    const latency = Date.now() - start

    if (error) {
      return {
        name: 'Database',
        status: 'down',
        latency,
        message: error.message
      }
    }

    return {
      name: 'Database',
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency,
      message: latency > 1000 ? 'Latência alta' : 'Conexão OK'
    }
  } catch (error: any) {
    return {
      name: 'Database',
      status: 'down',
      latency: Date.now() - start,
      message: error.message || 'Erro de conexão'
    }
  }
}

async function checkAuth(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Apenas verificar se o auth está acessível
    const { data, error } = await supabase.auth.getSession()
    const latency = Date.now() - start

    return {
      name: 'Auth (Supabase)',
      status: 'healthy',
      latency,
      message: 'Serviço disponível'
    }
  } catch (error: any) {
    return {
      name: 'Auth (Supabase)',
      status: 'down',
      latency: Date.now() - start,
      message: error.message || 'Erro de conexão'
    }
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.storage.listBuckets()
    const latency = Date.now() - start

    if (error) {
      return {
        name: 'Storage',
        status: 'degraded',
        latency,
        message: error.message
      }
    }

    return {
      name: 'Storage',
      status: 'healthy',
      latency,
      message: `${data?.length || 0} buckets disponíveis`
    }
  } catch (error: any) {
    return {
      name: 'Storage',
      status: 'degraded',
      latency: Date.now() - start,
      message: error.message || 'Erro de conexão'
    }
  }
}

function checkEnvironment(): HealthCheck {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'MP_ACCESS_TOKEN',
    'CRON_SECRET',
    'INTERNAL_API_TOKEN'
  ]

  const missing = required.filter(key => !process.env[key])
  const missingOptional = optional.filter(key => !process.env[key])

  // SECURITY: Não expor nomes de variáveis em produção
  const isProduction = process.env.NODE_ENV === 'production'

  if (missing.length > 0) {
    return {
      name: 'Environment',
      status: 'down',
      message: isProduction ? 'Configuração incompleta' : `Faltando: ${missing.join(', ')}`,
      details: isProduction ? { count: missing.length } : { missing, missingOptional }
    }
  }

  if (missingOptional.length > 0) {
    return {
      name: 'Environment',
      status: 'degraded',
      message: isProduction ? 'Configurações opcionais ausentes' : `Opcionais faltando: ${missingOptional.join(', ')}`,
      details: isProduction ? { count: missingOptional.length } : { missingOptional }
    }
  }

  return {
    name: 'Environment',
    status: 'healthy',
    message: 'Todas as variáveis configuradas'
  }
}

async function checkMercadoPago(): Promise<HealthCheck> {
  if (!process.env.MP_ACCESS_TOKEN) {
    return {
      name: 'MercadoPago',
      status: 'unknown',
      message: 'Não configurado (MP_ACCESS_TOKEN)'
    }
  }

  const start = Date.now()
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    })
    const latency = Date.now() - start

    if (!response.ok) {
      return {
        name: 'MercadoPago',
        status: 'down',
        latency,
        message: `Erro HTTP ${response.status}`
      }
    }

    return {
      name: 'MercadoPago',
      status: 'healthy',
      latency,
      message: 'API disponível'
    }
  } catch (error: any) {
    return {
      name: 'MercadoPago',
      status: 'down',
      latency: Date.now() - start,
      message: error.message || 'Erro de conexão'
    }
  }
}

function checkPerformance(): HealthCheck {
  const memory = process.memoryUsage ? process.memoryUsage() : null
  
  if (!memory) {
    return {
      name: 'Performance',
      status: 'unknown',
      message: 'Métricas não disponíveis'
    }
  }

  const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024)
  const usagePercent = Math.round((memory.heapUsed / memory.heapTotal) * 100)

  return {
    name: 'Performance',
    status: usagePercent > 90 ? 'degraded' : 'healthy',
    message: `Memória: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
    details: {
      heapUsedMB,
      heapTotalMB,
      usagePercent,
      rss: Math.round(memory.rss / 1024 / 1024)
    }
  }
}

async function getMetrics() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const today = new Date().toISOString().slice(0, 10)

    const [tenantsRes, storesRes, ordersRes] = await Promise.all([
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase.from('stores').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today)
    ])

    return {
      tenantsCount: tenantsRes.count || 0,
      storesCount: storesRes.count || 0,
      ordersToday: ordersRes.count || 0,
      activeUsers: 0 // Seria necessário tracking de sessões
    }
  } catch (error) {
    return {
      tenantsCount: 0,
      storesCount: 0,
      ordersToday: 0,
      activeUsers: 0
    }
  }
}
