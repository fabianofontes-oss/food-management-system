// Repository do módulo Driver
// Queries centralizadas ao Supabase

import { createClient } from '@/lib/supabase/client'
import type { Delivery, DriverProfile, DriverStats, ReferralData, StoreInfo } from './types'

// Buscar lojas onde o usuário é DRIVER
export async function getDriverStores(userId: string): Promise<StoreInfo[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('store_users')
    .select('store_id, role, stores(id, name, slug)')
    .eq('user_id', userId)
    .eq('role', 'DRIVER')

  return (data || [])
    .map((su: { stores: { id: string; name: string; slug: string } | null }) => ({
      id: su.stores?.id || '',
      name: su.stores?.name || '',
      slug: su.stores?.slug || ''
    }))
    .filter((s: StoreInfo) => s.id)
}

// Buscar perfil do driver por telefone
export async function getDriverByPhone(storeId: string, phone: string): Promise<DriverProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('drivers')
    .select('*')
    .eq('store_id', storeId)
    .eq('phone', phone)
    .single()

  return data
}

// Buscar entregas do driver por nome
export async function getDriverDeliveries(storeId: string, driverName: string): Promise<Delivery[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('deliveries')
    .select(`
      *,
      order:orders(order_code, customer_name, total_amount)
    `)
    .eq('store_id', storeId)
    .eq('driver_name', driverName)
    .order('created_at', { ascending: false })

  return data || []
}

// Buscar entregas pendentes (não delivered/cancelled)
export function getPendingDeliveries(deliveries: Delivery[]): Delivery[] {
  return deliveries.filter(d => !['delivered', 'cancelled'].includes(d.status))
}

// Buscar entregas concluídas
export function getCompletedDeliveries(deliveries: Delivery[]): Delivery[] {
  return deliveries.filter(d => d.status === 'delivered')
}

// Atualizar status de uma entrega
export async function updateDeliveryStatus(deliveryId: string, newStatus: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('deliveries')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)
}

// Calcular estatísticas do driver
export function calculateDriverStats(deliveries: Delivery[], commissionPercent: number): DriverStats {
  const today = new Date().toDateString()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayDelivs = deliveries.filter(
    d => new Date(d.created_at).toDateString() === today && d.status === 'delivered'
  )
  const weekDelivs = deliveries.filter(
    d => new Date(d.created_at) >= weekAgo && d.status === 'delivered'
  )
  const allDelivered = deliveries.filter(d => d.status === 'delivered')

  const calcEarnings = (delivs: Delivery[]) =>
    delivs.reduce((acc, d) => acc + ((d.delivery_fee || 0) * commissionPercent / 100), 0)

  return {
    todayDeliveries: todayDelivs.length,
    todayEarnings: calcEarnings(todayDelivs),
    weekDeliveries: weekDelivs.length,
    weekEarnings: calcEarnings(weekDelivs),
    totalDeliveries: allDelivered.length,
    totalEarnings: calcEarnings(allDelivered),
    rating: 4.8 // TODO: calcular média real
  }
}

// Buscar dados de afiliado
export async function getReferralData(userId: string): Promise<ReferralData | null> {
  const supabase = createClient()

  const { data: partner } = await supabase
    .from('referral_partners')
    .select('id, display_name, is_active')
    .eq('user_id', userId)
    .eq('partner_type', 'DRIVER')
    .maybeSingle()

  if (!partner) return null

  const { data: codes } = await supabase
    .from('referral_codes')
    .select('code, is_active')
    .eq('partner_id', partner.id)

  const { data: referrals } = await supabase
    .from('tenant_referrals')
    .select('id, referral_codes!inner(partner_id)')
    .eq('referral_codes.partner_id', partner.id)

  const { data: sales } = await supabase
    .from('referral_sales')
    .select('commission_amount, status')
    .eq('partner_id', partner.id)

  const pending = (sales || [])
    .filter((s: { status: string }) => s.status === 'PENDING')
    .reduce((sum: number, s: { commission_amount: number }) => sum + (s.commission_amount || 0), 0)

  const available = (sales || [])
    .filter((s: { status: string }) => s.status === 'AVAILABLE')
    .reduce((sum: number, s: { commission_amount: number }) => sum + (s.commission_amount || 0), 0)

  return {
    partner: { id: partner.id, display_name: partner.display_name, is_active: partner.is_active },
    codes: codes || [],
    referralsCount: referrals?.length || 0,
    pendingCommission: pending,
    availableCommission: available
  }
}

// Gerar link do Google Maps para navegação
export function getGoogleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
