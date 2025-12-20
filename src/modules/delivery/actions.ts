'use server'

import { createClient } from '@/lib/supabase/server'
import {
  completeDeliveryInputSchema,
  toggleShiftInputSchema,
  updateDeliverySettingsSchema,
  validateDeliveryTokenSchema,
  autoAssignDriverSchema,
  type DeliverySettings,
  type UpdateDeliverySettingsInput,
  type DriverShift,
  type AvailableDriver,
  type DeliveryWithToken
} from './types'
import {
  completeDriverShift,
  getActiveDriverShift,
  getDeliverySettingsByStore,
  markOrderDelivered,
  saveDeliveryProofPhoto,
  startDriverShift,
  updateDeliverySettingsByStore,
  getDeliveryByIdWithToken,
  getAvailableDrivers,
  assignDeliveryToDriver,
  confirmDeliveryReceiptByToken,
  saveDeliveryRatingByToken
} from './repository'

/**
 * Gestão de turnos (Online/Offline)
 * 
 * Verifica se o motorista tem turno ativo. Se tiver, finaliza (end_at = now, status = completed).
 * Se não tiver, cria um novo turno (start_at = now, status = active).
 * 
 * @returns { online: boolean, shift: DriverShift | null, error?: string }
 */
export async function toggleDriverShift(storeId: string): Promise<{
  online: boolean
  shift: DriverShift | null
  error?: string
}> {
  const parsed = toggleShiftInputSchema.safeParse({ storeId })
  if (!parsed.success) {
    return { online: false, shift: null, error: 'storeId inválido' }
  }

  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return { online: false, shift: null, error: 'Usuário não autenticado' }
    }

    const userId = authData.user.id

    // Verificar se já tem turno ativo
    const active = await getActiveDriverShift(storeId, userId)

    if (active) {
      // Finalizar turno
      const completed = await completeDriverShift(active.id)
      return { online: false, shift: completed }
    }

    // Iniciar novo turno
    const started = await startDriverShift(storeId, userId)
    return { online: true, shift: started }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao alternar turno'
    return { online: false, shift: null, error: message }
  }
}

export async function confirmDeliveryReceipt(storeId: string, deliveryId: string, token: string): Promise<{
  success: boolean
  error?: string
}> {
  const parsed = validateDeliveryTokenSchema.safeParse({ storeId, deliveryId, token })
  if (!parsed.success) {
    return { success: false, error: 'Parâmetros inválidos' }
  }

  try {
    const ok = await confirmDeliveryReceiptByToken({ storeId, deliveryId, token })
    if (!ok) {
      return { success: false, error: 'Falha ao confirmar recebimento' }
    }
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao confirmar recebimento'
    return { success: false, error: message }
  }
}

export async function submitDeliveryRating(
  storeId: string,
  deliveryId: string,
  token: string,
  rating: number,
  comment: string | null
): Promise<{ success: boolean; error?: string }> {
  const parsedToken = validateDeliveryTokenSchema.safeParse({ storeId, deliveryId, token })
  if (!parsedToken.success) {
    return { success: false, error: 'Parâmetros inválidos' }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Avaliação inválida' }
  }

  try {
    const delivery = await getDeliveryByIdWithToken(storeId, deliveryId, token)
    if (!delivery) {
      return { success: false, error: 'Link inválido ou expirado' }
    }

    if (delivery.rated_at) {
      return { success: false, error: 'Entrega já foi avaliada' }
    }

    const ok = await saveDeliveryRatingByToken({
      storeId,
      deliveryId,
      token,
      rating,
      comment,
    })

    if (!ok) {
      return { success: false, error: 'Falha ao salvar avaliação' }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar avaliação'
    return { success: false, error: message }
  }
}

/**
 * Finaliza a entrega com foto de comprovação
 * 
 * Importante: 
 * 1. Salva a foto em `deliveries.proof_photo_url`
 * 2. Atualiza `orders.status` para 'DELIVERED'
 * 3. O trigger do banco valida se a foto existe (se require_proof_photo = true)
 * 
 * @param orderId - ID da encomenda (orders.id)
 * @param photoUrl - URL pública da foto no Supabase Storage
 * @returns { success: boolean, error?: string }
 */
export async function completeDelivery(
  orderId: string,
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = completeDeliveryInputSchema.safeParse({ orderId, photoUrl })
  if (!parsed.success) {
    return { success: false, error: 'Dados inválidos' }
  }

  try {
    // 1. Salvar foto na entrega (deliveries.proof_photo_url)
    await saveDeliveryProofPhoto(orderId, photoUrl)

    // 2. Marcar pedido como entregue (orders.status = DELIVERED)
    // O trigger do banco vai validar se a foto existe
    await markOrderDelivered(orderId)

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao finalizar entrega'
    return { success: false, error: message }
  }
}

/**
 * Busca as configurações de delivery da loja
 * 
 * @param storeId - ID da loja
 * @returns DeliverySettings | null
 */
export async function getDeliverySettings(storeId: string): Promise<{
  settings: DeliverySettings | null
  error?: string
}> {
  try {
    const settings = await getDeliverySettingsByStore(storeId)
    return { settings }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar configurações'
    return { settings: null, error: message }
  }
}

/**
 * Atualiza as configurações de delivery da loja
 * 
 * @param storeId - ID da loja
 * @param data - Dados a atualizar (parcial)
 * @returns { settings: DeliverySettings | null, error?: string }
 */
export async function updateDeliverySettings(
  storeId: string,
  data: UpdateDeliverySettingsInput
): Promise<{ settings: DeliverySettings | null; error?: string }> {
  const parsed = updateDeliverySettingsSchema.safeParse(data)
  if (!parsed.success) {
    return { settings: null, error: 'Dados inválidos' }
  }

  try {
    const settings = await updateDeliverySettingsByStore(storeId, parsed.data)
    return { settings }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar configurações'
    return { settings: null, error: message }
  }
}

/**
 * Valida o token de acesso de uma entrega (segurança de links públicos)
 * 
 * Usado nas páginas de confirmação e avaliação para garantir que apenas
 * quem tem o link correto pode acessar.
 * 
 * @param deliveryId - ID da entrega
 * @param token - Token UUID da URL
 * @returns { valid: boolean, delivery?: DeliveryWithToken, error?: string }
 */
export async function validateDeliveryToken(
  storeId: string,
  deliveryId: string,
  token: string
): Promise<{ valid: boolean; delivery?: DeliveryWithToken; error?: string }> {
  const parsed = validateDeliveryTokenSchema.safeParse({ storeId, deliveryId, token })
  if (!parsed.success) {
    return { valid: false, error: 'Parâmetros inválidos' }
  }

  try {
    const delivery = await getDeliveryByIdWithToken(storeId, deliveryId, token)
    
    if (!delivery) {
      return { valid: false, error: 'Link inválido ou expirado' }
    }

    return { valid: true, delivery }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao validar token'
    return { valid: false, error: message }
  }
}

/**
 * Auto-atribuição de motorista (P1)
 * 
 * Busca motoristas disponíveis (online + is_available) e atribui automaticamente
 * a entrega ao motorista com menos entregas em andamento.
 * 
 * @param storeId - ID da loja
 * @param orderId - ID do pedido
 * @returns { success: boolean, driverName?: string, error?: string }
 */
export async function autoAssignDriver(
  storeId: string,
  orderId: string
): Promise<{ success: boolean; driverName?: string; error?: string }> {
  const parsed = autoAssignDriverSchema.safeParse({ storeId, orderId })
  if (!parsed.success) {
    return { success: false, error: 'Parâmetros inválidos' }
  }

  try {
    // 1. Buscar motoristas disponíveis (função SQL)
    const drivers = await getAvailableDrivers(storeId) as AvailableDriver[]

    if (drivers.length === 0) {
      return { success: false, error: 'Nenhum motorista disponível no momento' }
    }

    // 2. Selecionar o primeiro (já vem ordenado por menos entregas)
    const selectedDriver = drivers[0]

    // 3. Buscar delivery_id pelo order_id
    const supabase = await createClient()
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (!delivery) {
      return { success: false, error: 'Entrega não encontrada' }
    }

    // 4. Atribuir motorista
    await assignDeliveryToDriver(
      delivery.id,
      storeId,
      selectedDriver.driver_id,
      selectedDriver.driver_name,
      selectedDriver.driver_phone
    )

    return { success: true, driverName: selectedDriver.driver_name }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atribuir motorista'
    return { success: false, error: message }
  }
}
