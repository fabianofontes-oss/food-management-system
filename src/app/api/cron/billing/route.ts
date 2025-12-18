import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron Job para Billing Automatizado
 * URL: /api/cron/billing
 * 
 * Executar diariamente via:
 * - Vercel Cron Jobs
 * - Supabase Edge Functions
 * - Qualquer serviço de cron externo
 * 
 * Segurança: Verificar CRON_SECRET no header
 */

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verificar autenticação do cron
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Criar cliente com service role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = {
      overdueInvoices: 0,
      suspendedTenants: 0,
      expiredTrials: 0
    }

    // 1. Marcar faturas vencidas como 'overdue'
    const { data: overdueData } = await supabase
      .from('invoices')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().slice(0, 10))
      .select()

    results.overdueInvoices = overdueData?.length || 0

    // 2. Buscar configuração de billing
    const { data: config } = await supabase
      .from('billing_config')
      .select('grace_period_days, auto_suspend_enabled')
      .single()

    const graceDays = config?.grace_period_days || 3
    const autoSuspend = config?.auto_suspend_enabled !== false

    // 3. Suspender tenants com faturas muito vencidas
    if (autoSuspend) {
      const graceDate = new Date()
      graceDate.setDate(graceDate.getDate() - graceDays)

      // Buscar faturas vencidas além do período de carência
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('tenant_id')
        .eq('status', 'overdue')
        .lt('due_date', graceDate.toISOString().slice(0, 10))

      if (overdueInvoices && overdueInvoices.length > 0) {
        const tenantIds = [...new Set(overdueInvoices.map(i => i.tenant_id))]
        
        for (const tenantId of tenantIds) {
          const { data: updated } = await supabase
            .from('tenants')
            .update({
              status: 'suspended',
              suspended_at: new Date().toISOString(),
              suspended_reason: 'Fatura vencida - suspensão automática'
            })
            .eq('id', tenantId)
            .neq('status', 'suspended')
            .select()

          if (updated && updated.length > 0) {
            results.suspendedTenants++
          }
        }
      }
    }

    // 4. Verificar trials expirados
    const { data: expiredTrials } = await supabase
      .from('tenants')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_reason: 'Trial expirado'
      })
      .eq('status', 'trial')
      .lt('trial_ends_at', new Date().toISOString())
      .select()

    results.expiredTrials = expiredTrials?.length || 0

    console.log('Cron billing executado:', results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error('Erro no cron de billing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
