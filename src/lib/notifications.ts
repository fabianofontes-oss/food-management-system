// Sistema de Notificações
// Suporta: Push Browser, WhatsApp (via API), Som

export interface Notification {
  id: string
  type: 'order' | 'stock' | 'payment' | 'schedule' | 'general'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  created_at: string
  data?: Record<string, any>
}

// Sons de notificação
const NOTIFICATION_SOUNDS = {
  order: '/sounds/new-order.mp3',
  stock: '/sounds/alert.mp3',
  payment: '/sounds/success.mp3',
  general: '/sounds/notification.mp3'
}

// Tocar som de notificação
export function playNotificationSound(type: keyof typeof NOTIFICATION_SOUNDS = 'general') {
  if (typeof window === 'undefined') return
  
  try {
    const audio = new Audio(NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.general)
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignorar erro se autoplay bloqueado
    })
  } catch (e) {
    console.warn('Erro ao tocar som:', e)
  }
}

// Solicitar permissão para notificações push
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Enviar notificação push no browser
export function sendPushNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return notification
  }
}

// Formatar mensagem para WhatsApp
export function formatWhatsAppMessage(template: string, data: Record<string, any>): string {
  let message = template
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  })
  return message
}

// Gerar link do WhatsApp
export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`
}

// Templates de mensagens WhatsApp
export const WHATSAPP_TEMPLATES = {
  NEW_ORDER: `🎉 *Novo Pedido #{{order_number}}*

📦 Itens:
{{items}}

💰 Total: R$ {{total}}

📍 {{delivery_type}}
{{address}}

Obrigado pela preferência!`,

  ORDER_READY: `✅ *Pedido #{{order_number}} Pronto!*

Seu pedido está pronto para {{delivery_type}}.

{{message}}

Obrigado pela preferência! 🙏`,

  ORDER_DELIVERED: `📦 *Pedido #{{order_number}} Entregue!*

Esperamos que aproveite! 

Avalie nossa loja: {{review_link}}

Obrigado! 🙏`,

  SCHEDULE_REMINDER: `📅 *Lembrete de Encomenda*

Olá {{customer_name}}!

Sua encomenda #{{order_number}} está agendada para:
📆 {{date}} às {{time}}

{{items}}

💰 Total: R$ {{total}}

Qualquer dúvida, estamos à disposição!`,

  LOW_STOCK: `⚠️ *Alerta de Estoque Baixo*

Os seguintes itens estão com estoque baixo:

{{items}}

Acesse o sistema para criar pedido de compra.`
}

// Classe gerenciadora de notificações
export class NotificationManager {
  private supabase: any
  private storeId: string
  private callbacks: ((notification: Notification) => void)[] = []

  constructor(supabase: any, storeId: string) {
    this.supabase = supabase
    this.storeId = storeId
  }

  // Inscrever para receber notificações
  subscribe(callback: (notification: Notification) => void) {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  // Iniciar escuta de notificações em tempo real
  async startListening() {
    // Escutar novos pedidos
    this.supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${this.storeId}`
      }, (payload: any) => {
        this.handleNewOrder(payload.new)
      })
      .subscribe()

    // Escutar mudanças de status
    this.supabase
      .channel('order_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${this.storeId}`
      }, (payload: any) => {
        if (payload.new.status !== payload.old.status) {
          this.handleOrderStatusChange(payload.new, payload.old.status)
        }
      })
      .subscribe()
  }

  // Tratar novo pedido
  private async handleNewOrder(order: any) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'order',
      title: `Novo Pedido #${order.order_number || order.id.slice(0, 8)}`,
      message: `Mesa ${order.table_number || 'Delivery'} - R$ ${order.total_amount?.toFixed(2)}`,
      priority: 'high',
      read: false,
      created_at: new Date().toISOString(),
      data: order
    }

    // Tocar som
    playNotificationSound('order')

    // Enviar push
    sendPushNotification(notification.title, {
      body: notification.message,
      tag: `order-${order.id}`
    })

    // Notificar callbacks
    this.callbacks.forEach(cb => cb(notification))

    // Salvar no banco
    await this.saveNotification(notification)
  }

  // Tratar mudança de status
  private async handleOrderStatusChange(order: any, oldStatus: string) {
    const statusMessages: Record<string, string> = {
      'preparing': 'Pedido em preparo',
      'ready': 'Pedido pronto!',
      'delivered': 'Pedido entregue',
      'cancelled': 'Pedido cancelado'
    }

    const message = statusMessages[order.status]
    if (!message) return

    const notification: Notification = {
      id: crypto.randomUUID(),
      type: 'order',
      title: `Pedido #${order.order_number || order.id.slice(0, 8)}`,
      message,
      priority: order.status === 'ready' ? 'high' : 'medium',
      read: false,
      created_at: new Date().toISOString(),
      data: order
    }

    if (order.status === 'ready') {
      playNotificationSound('order')
    }

    this.callbacks.forEach(cb => cb(notification))
  }

  // Salvar notificação no banco
  private async saveNotification(notification: Notification) {
    await this.supabase.from('notifications').insert({
      store_id: this.storeId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data
    })
  }

  // Buscar notificações não lidas
  async getUnreadNotifications(): Promise<Notification[]> {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('store_id', this.storeId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50)

    return data || []
  }

  // Marcar como lida
  async markAsRead(id: string) {
    await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
  }

  // Marcar todas como lidas
  async markAllAsRead() {
    await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('store_id', this.storeId)
      .eq('read', false)
  }
}
