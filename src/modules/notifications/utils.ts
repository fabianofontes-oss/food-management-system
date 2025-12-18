/**
 * Utilitários para notificações
 */

import type { WhatsAppLink } from './types'

/**
 * Gera link click-to-chat do WhatsApp
 * @param phone Número no formato internacional (ex: 5511999999999)
 * @param message Mensagem pré-preenchida
 */
export function createWhatsAppLink(phone: string, message: string): WhatsAppLink {
  // Limpar número (remover espaços, traços, parênteses)
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Encode da mensagem
  const encodedMessage = encodeURIComponent(message)
  
  // URL do WhatsApp
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  
  return {
    phone: cleanPhone,
    message,
    url,
  }
}

/**
 * Gera mensagem padrão para novo pedido
 */
export function getNewOrderWhatsAppMessage(
  storeName: string,
  orderCode: string,
  customerName: string
): string {
  return `Olá! Seu pedido #${orderCode} foi recebido pela ${storeName}. Em breve você receberá atualizações sobre o status do seu pedido. Obrigado, ${customerName}!`
}

/**
 * Gera mensagem padrão para status do pedido
 */
export function getOrderStatusWhatsAppMessage(
  orderCode: string,
  status: string
): string {
  const statusMessages: Record<string, string> = {
    ACCEPTED: `Seu pedido #${orderCode} foi aceito e está sendo preparado! 🍳`,
    IN_PREPARATION: `Seu pedido #${orderCode} está em preparação! 👨‍🍳`,
    READY: `Seu pedido #${orderCode} está pronto! 🎉`,
    OUT_FOR_DELIVERY: `Seu pedido #${orderCode} saiu para entrega! 🛵`,
    DELIVERED: `Seu pedido #${orderCode} foi entregue! Obrigado pela preferência! 💚`,
  }
  
  return statusMessages[status] || `Atualização do pedido #${orderCode}: ${status}`
}
