/**
 * Utilitários para envio de mensagens WhatsApp
 */

export interface WhatsAppMessage {
  phone: string
  message: string
}

/**
 * Gera link do WhatsApp Web/App
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
}

/**
 * Mensagens pré-definidas para delivery
 */
export const DELIVERY_MESSAGES = {
  pedidoConfirmado: (orderCode: string, storeName: string, trackingLink: string) =>
    `🍔 *Pedido Confirmado!*\n\n` +
    `Olá! Seu pedido *#${orderCode}* foi recebido pela *${storeName}*.\n\n` +
    `📍 Acompanhe sua entrega:\n${trackingLink}\n\n` +
    `Obrigado pela preferência! 🙏`,

  motoristaAtribuido: (orderCode: string, driverName: string, driverPhone: string, trackingLink: string) =>
    `🚗 *Motorista a caminho!*\n\n` +
    `Seu pedido *#${orderCode}* está com o motorista *${driverName}*.\n\n` +
    `📞 Telefone: ${driverPhone}\n` +
    `📍 Rastreio: ${trackingLink}\n\n` +
    `Em breve seu pedido chega! 🏃‍♂️`,

  pedidoColetado: (orderCode: string, estimatedTime: number) =>
    `📦 *Pedido Coletado!*\n\n` +
    `Seu pedido *#${orderCode}* foi coletado e está a caminho!\n\n` +
    `⏱️ Tempo estimado: ${estimatedTime} minutos\n\n` +
    `Já já chega! 🚀`,

  pedidoSaiu: (orderCode: string, trackingLink: string) =>
    `🛵 *Saiu para entrega!*\n\n` +
    `Seu pedido *#${orderCode}* está a caminho do seu endereço!\n\n` +
    `📍 Acompanhe em tempo real:\n${trackingLink}\n\n` +
    `Fique atento! 🔔`,

  pedidoEntregue: (orderCode: string, ratingLink: string) =>
    `✅ *Pedido Entregue!*\n\n` +
    `Seu pedido *#${orderCode}* foi entregue com sucesso!\n\n` +
    `⭐ Avalie sua experiência:\n${ratingLink}\n\n` +
    `Obrigado por pedir conosco! Volte sempre! 💚`,
}

/**
 * Abre WhatsApp com mensagem pré-definida
 */
export function openWhatsApp(phone: string, message: string): void {
  const link = getWhatsAppLink(phone, message)
  window.open(link, '_blank')
}

/**
 * Formata telefone para exibição
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}
