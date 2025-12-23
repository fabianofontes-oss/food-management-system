import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryTab } from '@/modules/driver'
import type { Delivery } from '@/modules/driver/types'

export default async function HistoricoPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${params.slug}/login`)
  }

  // 2. Buscar loja pelo slug
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!store) {
    redirect(`/${params.slug}/login`)
  }

  // 3. Buscar entregas do motorista
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      order:orders(
        order_code,
        customer_name,
        total_amount
      )
    `)
    .eq('driver_id', user.id)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })

  // 4. Buscar perfil do motorista para comissão
  const { data: profile } = await supabase
    .from('drivers')
    .select('commission_percent')
    .eq('user_id', user.id)
    .eq('store_id', store.id)
    .single()

  // Fallback seguro
  const safeDeliveries = (deliveries || []) as Delivery[]
  const commissionPercent = profile?.commission_percent || 10

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Histórico de Entregas</h1>
      <HistoryTab 
        deliveries={safeDeliveries} 
        commissionPercent={commissionPercent} 
      />
    </div>
  )
}
