import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireInternalAuth } from '@/lib/security/internal-auth'

/**
 * API de Diagnóstico do Banco de Dados
 * Verifica tamanho, tabelas, conexões e inconsistências
 */

interface TableInfo {
  name: string
  rows: number
}

interface DatabaseHealth {
  totalRecords: number
  tables: TableInfo[]
  inconsistencies: {
    name: string
    count: number
    severity: 'critical' | 'warning' | 'info'
  }[]
}

export async function GET(request: NextRequest) {
  // SECURITY: Proteger endpoint (expõe estrutura do banco)
  try {
    requireInternalAuth(request)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Contar registros das principais tabelas
    const tables: TableInfo[] = []
    const tablesToCheck = [
      'tenants', 'stores', 'users', 'store_users', 'products', 'categories', 
      'orders', 'order_items', 'customers', 'invoices', 'payment_history',
      'coupons', 'tables', 'reservations', 'reviews', 'delivery_persons'
    ]

    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          tables.push({
            name: tableName,
            rows: count || 0
          })
        }
      } catch (e) {
        // Tabela pode não existir
      }
    }

    // Verificar inconsistências
    const inconsistencies: DatabaseHealth['inconsistencies'] = []

    // 1. Lojas sem tenant
    try {
      const { count } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .is('tenant_id', null)
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Lojas sem tenant vinculado',
          count,
          severity: 'critical'
        })
      }
    } catch (e) {}

    // 2. Pedidos sem loja
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .is('store_id', null)
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Pedidos sem loja vinculada',
          count,
          severity: 'critical'
        })
      }
    } catch (e) {}

    // 3. Produtos sem categoria
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('category_id', null)
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Produtos sem categoria',
          count,
          severity: 'warning'
        })
      }
    } catch (e) {}

    // 4. Produtos sem preço
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .or('base_price.is.null,base_price.eq.0')
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Produtos sem preço definido',
          count,
          severity: 'warning'
        })
      }
    } catch (e) {}

    // 5. Categorias vazias (sem produtos)
    try {
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
      
      if (categories) {
        let emptyCount = 0
        for (const cat of categories) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
          if (!count || count === 0) emptyCount++
        }
        if (emptyCount > 0) {
          inconsistencies.push({
            name: 'Categorias sem produtos',
            count: emptyCount,
            severity: 'info'
          })
        }
      }
    } catch (e) {}

    // 6. Tenants sem plano
    try {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
      
      const { data: subscriptions } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
      
      if (tenants && subscriptions) {
        const subscribedIds = new Set(subscriptions.map(s => s.tenant_id))
        const withoutPlan = tenants.filter(t => !subscribedIds.has(t.id)).length
        if (withoutPlan > 0) {
          inconsistencies.push({
            name: 'Tenants sem plano atribuído',
            count: withoutPlan,
            severity: 'warning'
          })
        }
      }
    } catch (e) {}

    // 7. Lojas inativas
    try {
      const { count } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Lojas inativas',
          count,
          severity: 'info'
        })
      }
    } catch (e) {}

    // 8. Pedidos pendentes há mais de 24h
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .lt('created_at', yesterday.toISOString())
      if (count && count > 0) {
        inconsistencies.push({
          name: 'Pedidos pendentes há mais de 24h',
          count,
          severity: 'warning'
        })
      }
    } catch (e) {}

    // Calcular total de registros
    const totalRecords = tables.reduce((sum, t) => sum + t.rows, 0)

    const response: DatabaseHealth = {
      totalRecords,
      tables: tables.sort((a, b) => b.rows - a.rows),
      inconsistencies: inconsistencies.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Erro ao verificar database:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
