import { createClient } from '@/lib/supabase/client'
import { OrderWithDetails, OrderStatus } from './types'

const supabase = createClient()

export const OrderRepository = {
  // Busca pedidos ativos com todos os relacionamentos necessários
  async getActiveOrders(storeId: string): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(name, phone, email),
        items:order_items(
          *,
          products(name, image_url),
          modifiers:order_item_modifiers(name_snapshot, extra_price)
        ),
        events:order_events(type, created_at)
      `)
      .eq('store_id', storeId)
      .neq('status', 'CANCELLED')
      .neq('status', 'DELIVERED') 
      .order('created_at', { ascending: false })

    if (error) throw error
    // Casting seguro pois a query garante a estrutura
    return data as any as OrderWithDetails[]
  },

  // Atualiza status do pedido
  async updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    
    if (error) throw error
  }
}
