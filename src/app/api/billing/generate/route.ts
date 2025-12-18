import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para gerar faturas mensais para todos os tenants
 * URL: /api/billing/generate
 */
export async function POST(request: NextRequest) {
  try {
    // Criar cliente com service role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    let generated = 0
    let skipped = 0
    let errors = 0

    // Buscar todos os tenants com plano ativo
    const { data: subscriptions, error: subError } = await supabase
      .from('tenant_subscriptions')
      .select(`
        tenant_id,
        plan_id,
        plan:plans(id, name, price_monthly_cents),
        tenant:tenants(id, name, email, status, billing_day)
      `)

    if (subError) {
      console.error('Erro ao buscar subscriptions:', subError)
      return NextResponse.json({ success: false, error: 'Erro ao buscar tenants' }, { status: 500 })
    }

    for (const sub of subscriptions || []) {
      const plan = sub.plan as any
      const tenant = sub.tenant as any

      // Pular tenants sem plano ou inativos
      if (!plan?.price_monthly_cents || plan.price_monthly_cents === 0) {
        skipped++
        continue
      }

      if (tenant?.status === 'cancelled') {
        skipped++
        continue
      }

      // Verificar se já existe fatura para o mês
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('tenant_id', sub.tenant_id)
        .eq('reference_month', currentMonth)
        .single()

      if (existingInvoice) {
        skipped++
        continue
      }

      // Calcular data de vencimento
      const billingDay = tenant?.billing_day || 10
      const dueDate = new Date()
      dueDate.setDate(billingDay)
      if (dueDate < new Date()) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      // Criar fatura
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: sub.tenant_id,
          plan_id: plan.id,
          amount_cents: plan.price_monthly_cents,
          reference_month: currentMonth,
          due_date: dueDate.toISOString().slice(0, 10),
          status: 'pending',
          payment_gateway: 'mercadopago'
        })

      if (invoiceError) {
        console.error('Erro ao criar fatura:', invoiceError)
        errors++
      } else {
        generated++
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      skipped,
      errors,
      month: currentMonth
    })
  } catch (error) {
    console.error('Erro ao gerar faturas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
