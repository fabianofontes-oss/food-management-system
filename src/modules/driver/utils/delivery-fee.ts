/**
 * Utilitários para cálculo de taxa de entrega
 */

export interface DeliveryFeeConfig {
  baseFee: number           // Taxa base em reais
  pricePerKm: number        // Preço por km
  minFee: number            // Taxa mínima
  maxFee: number            // Taxa máxima (0 = sem limite)
  freeDeliveryRadius: number // Raio em km para entrega grátis (0 = sem raio grátis)
  freeDeliveryMinOrder: number // Valor mínimo do pedido para entrega grátis (0 = desativado)
}

export const DEFAULT_FEE_CONFIG: DeliveryFeeConfig = {
  baseFee: 5.00,
  pricePerKm: 1.50,
  minFee: 5.00,
  maxFee: 25.00,
  freeDeliveryRadius: 0,
  freeDeliveryMinOrder: 0
}

/**
 * Calcula a taxa de entrega baseada na distância
 */
export function calculateDeliveryFee(
  distanceKm: number,
  config: Partial<DeliveryFeeConfig> = {},
  orderTotal: number = 0
): number {
  const cfg = { ...DEFAULT_FEE_CONFIG, ...config }

  // Verificar se tem entrega grátis por valor do pedido
  if (cfg.freeDeliveryMinOrder > 0 && orderTotal >= cfg.freeDeliveryMinOrder) {
    return 0
  }

  // Verificar se está dentro do raio de entrega grátis
  if (cfg.freeDeliveryRadius > 0 && distanceKm <= cfg.freeDeliveryRadius) {
    return 0
  }

  // Calcular taxa
  let fee = cfg.baseFee + (distanceKm * cfg.pricePerKm)

  // Aplicar mínimo
  if (fee < cfg.minFee) {
    fee = cfg.minFee
  }

  // Aplicar máximo
  if (cfg.maxFee > 0 && fee > cfg.maxFee) {
    fee = cfg.maxFee
  }

  return Math.round(fee * 100) / 100 // Arredondar para 2 casas decimais
}

/**
 * Formata a distância para exibição
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

/**
 * Estima tempo de entrega baseado na distância
 * Considera velocidade média de 25km/h em áreas urbanas
 */
export function estimateDeliveryTime(distanceKm: number, baseMinutes: number = 15): number {
  const avgSpeedKmh = 25
  const travelMinutes = (distanceKm / avgSpeedKmh) * 60
  return Math.round(baseMinutes + travelMinutes)
}

/**
 * Calcula distância entre dois pontos usando fórmula de Haversine
 * Retorna distância em km
 */
export function calculateDistanceHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 100) / 100
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Gera texto descritivo da política de entrega
 */
export function generateDeliveryPolicyText(config: DeliveryFeeConfig): string {
  const parts: string[] = []

  if (config.freeDeliveryRadius > 0) {
    parts.push(`Entrega grátis até ${config.freeDeliveryRadius}km`)
  }

  if (config.freeDeliveryMinOrder > 0) {
    parts.push(`Grátis em pedidos acima de R$ ${config.freeDeliveryMinOrder.toFixed(2)}`)
  }

  parts.push(`Taxa base: R$ ${config.baseFee.toFixed(2)}`)
  parts.push(`+ R$ ${config.pricePerKm.toFixed(2)}/km`)

  if (config.maxFee > 0) {
    parts.push(`Máximo: R$ ${config.maxFee.toFixed(2)}`)
  }

  return parts.join(' • ')
}
