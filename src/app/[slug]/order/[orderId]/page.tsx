'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, Clock, ChefHat, Truck, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderEvent {
  id: string
  type: string
  message: string | null
  created_at: string
}

interface Order {
  id: string
  code: string
  status: string
  total_amount: number
  channel: string
  payment_method: string
  created_at: string
  customer: {
    name: string
    phone: string
  }
  items: Array<{
    title_snapshot: string
    quantity: number
    unit_price: number
    subtotal: number
    modifiers: Array<{
      name_snapshot: string
      extra_price: number
    }>
  }>
  events: OrderEvent[]
}

const STATUS_CONFIG = {
  PENDING: { label: 'Aguardando confirmação', icon: Clock, color: 'text-yellow-600' },
  ACCEPTED: { label: 'Pedido aceito', icon: CheckCircle2, color: 'text-green-600' },
  IN_PREPARATION: { label: 'Em preparação', icon: ChefHat, color: 'text-blue-600' },
  READY: { label: 'Pronto', icon: Package, color: 'text-purple-600' },
  OUT_FOR_DELIVERY: { label: 'Saiu para entrega', icon: Truck, color: 'text-indigo-600' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle2, color: 'text-green-600' },
  CANCELLED: { label: 'Cancelado', icon: CheckCircle2, color: 'text-red-600' },
}

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderId: string }
}) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrder()
    
    const channel = supabase
      .channel(`order-${params.orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.orderId}`,
        },
        () => {
          loadOrder()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_events',
          filter: `order_id=eq.${params.orderId}`,
        },
        () => {
          loadOrder()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.orderId])

  async function loadOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            modifiers:order_item_modifiers(*)
          ),
          events:order_events(*)
        `)
        .eq('id', params.orderId)
        .single()

      if (error) throw error
      if (!data) return
      
      const sortedEvents = Array.isArray(data.events) 
        ? [...data.events].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : []
      
      setOrder({ ...data, events: sortedEvents } as Order)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
          <p className="text-gray-600 mb-6">Verifique o código do pedido</p>
          <Button onClick={() => router.push(`/${params.slug}`)}>
            Voltar ao Cardápio
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
  const StatusIcon = statusConfig?.icon || Clock

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Pedido #{order.code}</h1>
          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${statusConfig?.color}`}>
            <StatusIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {statusConfig?.label || order.status}
          </h2>
          {order.status === 'PENDING' && (
            <p className="text-gray-600">
              Aguardando a loja confirmar seu pedido
            </p>
          )}
          {order.status === 'ACCEPTED' && (
            <p className="text-gray-600">
              Seu pedido foi confirmado e será preparado em breve
            </p>
          )}
          {order.status === 'IN_PREPARATION' && (
            <p className="text-gray-600">
              Estamos preparando seu pedido com carinho
            </p>
          )}
          {order.status === 'READY' && (
            <p className="text-gray-600">
              {order.channel === 'DELIVERY' 
                ? 'Seu pedido está pronto e logo sairá para entrega'
                : 'Seu pedido está pronto para retirada'}
            </p>
          )}
          {order.status === 'OUT_FOR_DELIVERY' && (
            <p className="text-gray-600">
              Seu pedido está a caminho!
            </p>
          )}
          {order.status === 'DELIVERED' && (
            <p className="text-gray-600">
              Pedido entregue com sucesso. Bom apetite!
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Itens do pedido</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">
                    {item.quantity}x {item.title_snapshot}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-sm text-gray-600 ml-6">
                    {item.modifiers.map((mod, modIdx) => (
                      <div key={modIdx}>
                        - {mod.name_snapshot}
                        {mod.extra_price > 0 && ` (+${formatCurrency(mod.extra_price)})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.total_amount - (order.channel === 'DELIVERY' ? 5 : 0))}</span>
            </div>
            {order.channel === 'DELIVERY' && (
              <div className="flex justify-between text-gray-600">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(5)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Informações do pedido</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente</span>
              <span className="font-medium">{order.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone</span>
              <span className="font-medium">{order.customer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo</span>
              <span className="font-medium">
                {order.channel === 'DELIVERY' && 'Delivery'}
                {order.channel === 'TAKEAWAY' && 'Retirada'}
                {order.channel === 'COUNTER' && 'Balcão'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pagamento</span>
              <span className="font-medium">
                {order.payment_method === 'PIX' && 'PIX'}
                {order.payment_method === 'CASH' && 'Dinheiro'}
                {order.payment_method === 'CARD' && 'Cartão'}
                {order.payment_method === 'ONLINE' && 'Online'}
              </span>
            </div>
          </div>
        </div>

        {order.events && order.events.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Histórico do pedido</h3>
            <div className="space-y-4">
              {order.events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {event.message || event.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push(`/${params.slug}`)}
          variant="outline"
          className="w-full"
        >
          Fazer Novo Pedido
        </Button>
      </main>
    </div>
  )
}