import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const SUPER_ADMIN_EMAILS = [
  'fabianobraga@me.com',
  ...(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [])
]

export async function GET() {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Usar admin client para buscar dados (bypassa RLS)
    const { data: tenants } = await supabaseAdmin.from('tenants').select('*')
    const { data: stores } = await supabaseAdmin.from('stores').select('*')
    
    // Invoices e orders podem não existir ainda
    let invoices = null
    let orders = null
    
    try {
      const { data } = await supabaseAdmin.from('invoices').select('status, amount_cents')
      invoices = data
    } catch (e) {
      // Tabela pode não existir
    }
    
    try {
      const { data } = await supabaseAdmin.from('orders').select('id, total_amount, created_at')
      orders = data
    } catch (e) {
      // Tabela pode não existir
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = new Date().toISOString().slice(0, 10)

    // Calcular estatísticas
    const allTenants = tenants || []
    const activeCount = allTenants.filter((t: any) => t.status === 'active').length
    const trialCount = allTenants.filter((t: any) => t.status === 'trial').length
    const suspendedCount = allTenants.filter((t: any) => t.status === 'suspended').length
    const newThisMonth = allTenants.filter((t: any) => new Date(t.created_at) >= startOfMonth).length

    // Estatísticas de faturas
    let paidCount = 0
    let overdueCount = 0
    let mrrCents = 0
    let pendingCents = 0

    if (invoices) {
      paidCount = invoices.filter((i: any) => i.status === 'paid').length
      overdueCount = invoices.filter((i: any) => i.status === 'overdue').length
      mrrCents = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + (i.amount_cents || 0), 0)
      pendingCents = invoices.filter((i: any) => i.status === 'pending' || i.status === 'overdue').reduce((sum: number, i: any) => sum + (i.amount_cents || 0), 0)
    }

    // Pedidos de hoje
    let ordersToday = 0
    let revenueToday = 0

    if (orders) {
      const todayOrders = orders.filter((o: any) => o.created_at.startsWith(today))
      ordersToday = todayOrders.length
      revenueToday = todayOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
    }

    return NextResponse.json({
      tenantsCount: allTenants.length,
      storesCount: stores?.length || 0,
      activeTenantsCount: activeCount,
      trialTenantsCount: trialCount,
      suspendedTenantsCount: suspendedCount,
      mrrCents,
      pendingInvoicesCents: pendingCents,
      paidInvoicesCount: paidCount,
      overdueInvoicesCount: overdueCount,
      newTenantsThisMonth: newThisMonth,
      ordersToday,
      revenueToday
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
