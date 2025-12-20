'use server'

import { createClient } from '@/lib/supabase/server'
import { DELIVERY_MESSAGES, getWhatsAppLink } from './utils/whatsapp'

interface NotifyCustomerParams {
  deliveryId: string
  storeSlug: string
  storeName: string
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered'
}

interface DeliveryData {
  id: string
  access_token: string | null
  driver_name: string | null
  driver_phone: string | null
  estimated_time: number
  order: {
    order_code: string
    customer_name: string
    customer_phone: string | null
  } | null
}

// Helper functions (não são server actions, movidas para utils)
function generateTrackingUrl(storeSlug: string, deliveryId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pediu.food'
  return `${baseUrl}/${storeSlug}/rastreio/${deliveryId}`
}

function generateRatingUrl(storeSlug: string, deliveryId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pediu.food'
  return `${baseUrl}/${storeSlug}/avaliar/${deliveryId}`
}

function generateRatingUrlWithToken(storeSlug: string, deliveryId: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pediu.food'
  return `${baseUrl}/${storeSlug}/avaliar/${deliveryId}?token=${token}`
}

/**
 * Busca dados da entrega para notificação
 */
async function getDeliveryData(deliveryId: string): Promise<DeliveryData | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      access_token,
      driver_name,
      driver_phone,
      estimated_time,
      order:orders(order_code, customer_name, customer_phone)
    `)
    .eq('id', deliveryId)
    .single()

  if (error || !data) return null
  return data as DeliveryData
}

/**
 * Gera mensagem de WhatsApp baseada no status
 */
export async function getCustomerNotificationMessage(
  params: NotifyCustomerParams
): Promise<{ phone: string; message: string; whatsappLink: string } | null> {
  const delivery = await getDeliveryData(params.deliveryId)
  if (!delivery || !delivery.order?.customer_phone) return null

  const trackingLink = generateTrackingUrl(params.storeSlug, params.deliveryId)
  const ratingLink = delivery.access_token
    ? generateRatingUrlWithToken(params.storeSlug, params.deliveryId, delivery.access_token)
    : generateRatingUrl(params.storeSlug, params.deliveryId)
  const orderCode = delivery.order.order_code

  let message = ''

  switch (params.status) {
    case 'assigned':
      message = DELIVERY_MESSAGES.motoristaAtribuido(
        orderCode,
        delivery.driver_name || 'Motorista',
        delivery.driver_phone || '',
        trackingLink
      )
      break
    case 'picked_up':
      message = DELIVERY_MESSAGES.pedidoColetado(orderCode, delivery.estimated_time)
      break
    case 'in_transit':
      message = DELIVERY_MESSAGES.pedidoSaiu(orderCode, trackingLink)
      break
    case 'delivered':
      message = DELIVERY_MESSAGES.pedidoEntregue(orderCode, ratingLink)
      break
  }

  const customerPhone = delivery.order.customer_phone
  const whatsappLink = getWhatsAppLink(customerPhone, message)

  return {
    phone: customerPhone,
    message,
    whatsappLink
  }
}

/**
 * Atualiza status da entrega e retorna dados para notificação
 */
export async function updateDeliveryStatusAction(
  deliveryId: string,
  newStatus: string,
  storeSlug: string,
  storeName: string
): Promise<{
  success: boolean
  notification?: { phone: string; message: string; whatsappLink: string }
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Atualizar status
    const { error } = await supabase
      .from('deliveries')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', deliveryId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Gerar notificação se for um status relevante
    const notifiableStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered']
    if (notifiableStatuses.includes(newStatus)) {
      const notification = await getCustomerNotificationMessage({
        deliveryId,
        storeSlug,
        storeName,
        status: newStatus as 'assigned' | 'picked_up' | 'in_transit' | 'delivered'
      })

      return { success: true, notification: notification || undefined }
    }

    return { success: true }
  } catch (err) {
    console.error('Erro ao atualizar status:', err)
    return { success: false, error: 'Erro ao atualizar status da entrega' }
  }
}

/**
 * Salva avaliação do motorista
 */
export async function saveDeliveryRating(
  deliveryId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('deliveries')
      .update({
        driver_rating: rating,
        rating_comment: comment || null,
        rated_at: new Date().toISOString()
      })
      .eq('id', deliveryId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Buscar motorista para atualizar média de rating
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('driver_name, store_id')
      .eq('id', deliveryId)
      .single()

    if (delivery?.driver_name && delivery?.store_id) {
      // Calcular nova média de rating do motorista
      const { data: allRatings } = await supabase
        .from('deliveries')
        .select('driver_rating')
        .eq('store_id', delivery.store_id)
        .eq('driver_name', delivery.driver_name)
        .not('driver_rating', 'is', null)

      if (allRatings && allRatings.length > 0) {
        const avgRating = allRatings.reduce((sum: number, d: { driver_rating: number | null }) => sum + (d.driver_rating || 0), 0) / allRatings.length

        // Atualizar rating médio do motorista
        await supabase
          .from('drivers')
          .update({ rating: Math.round(avgRating * 10) / 10 })
          .eq('store_id', delivery.store_id)
          .eq('name', delivery.driver_name)
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err)
    return { success: false, error: 'Erro ao salvar avaliação' }
  }
}
