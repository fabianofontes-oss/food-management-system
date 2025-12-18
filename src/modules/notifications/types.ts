/**
 * Tipos para o módulo de notificações
 */

export interface Notification {
  id: string
  storeId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: string
}

export type NotificationType = 
  | 'NEW_ORDER'
  | 'ORDER_STATUS_CHANGED'
  | 'LOW_STOCK'
  | 'REVIEW_RECEIVED'
  | 'SYSTEM'

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
}

export interface WhatsAppLink {
  phone: string
  message: string
  url: string
}
