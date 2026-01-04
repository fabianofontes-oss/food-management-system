'use client'

import { useState, useMemo } from 'react'
import {
  ShoppingBag, Clock, CheckCircle, Truck, Search,
  Loader2, AlertCircle, Filter, Eye, Phone, MapPin,
  Calendar, DollarSign, User
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStoreId } from '@/modules/store/hooks/use-store'
import { useOrders } from '@/modules/orders/hooks/use-orders'
import { OrderStatus } from '@/modules/orders/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type FilterType = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  IN_PREPARATION: 'Preparando',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado'
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_PREPARATION: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

export default function OrdersPage() {
  const storeId = useStoreId()
  const { orders, loading, updateStatus } = useOrders(storeId || undefined)

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  // Calcular estatísticas REAIS
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    return {
      pending: orders.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED').length,
      preparing: orders.filter(o => o.status === 'IN_PREPARATION').length,
      ready: orders.filter(o => o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY').length,
      deliveredToday: orders.filter(o =>
        o.status === 'DELIVERED' && o.created_at.startsWith(today)
      ).length
    }
  }, [orders])

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filtro por status
    if (filter !== 'all') {
      filtered = filtered.filter(order => {
        switch (filter) {
          case 'pending':
            return order.status === 'PENDING' || order.status === 'ACCEPTED'
          case 'preparing':
            return order.status === 'IN_PREPARATION'
          case 'ready':
            return order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY'
          case 'delivered':
            return order.status === 'DELIVERED'
          case 'cancelled':
            return order.status === 'CANCELLED'
          default:
            return true
        }
      })
    }

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.code?.toLowerCase().includes(search) ||
        order.customer?.name?.toLowerCase().includes(search) ||
        order.customer?.phone?.includes(search)
      )
    }

    return filtered
  }, [orders, filter, searchTerm])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus(orderId, newStatus)
  }

  if (loading && !orders.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">Gerencie os pedidos da sua loja</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.preparing}</p>
              <p className="text-sm text-gray-500">Preparando</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
              <p className="text-sm text-gray-500">Prontos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveredToday}</p>
              <p className="text-sm text-gray-500">Entregues Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por código, cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'preparing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('preparing')}
          >
            Preparando
          </Button>
          <Button
            variant={filter === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('ready')}
          >
            Prontos
          </Button>
          <Button
            variant={filter === 'delivered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('delivered')}
          >
            Entregues
          </Button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== 'all'
              ? 'Nenhum pedido encontrado com os filtros aplicados'
              : 'Nenhum pedido encontrado'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Os pedidos aparecerão aqui quando os clientes fizerem compras pelo cardápio digital.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">#{order.code}</h3>
                      <Badge className={STATUS_COLORS[order.status] || 'bg-gray-100'}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {order.customer && (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{order.customer.name}</span>
                          </div>
                          {order.customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{order.customer.phone}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                      <DollarSign className="w-5 h-5" />
                      {(order.total_amount || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>

                {/* Itens do pedido */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.products?.name || 'Produto'}
                          </span>
                          <span className="text-gray-600">
                            R$ {(item.total_price || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações de mudança de status */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
                    >
                      Aceitar
                    </Button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'IN_PREPARATION')}
                    >
                      Iniciar Preparo
                    </Button>
                  )}
                  {order.status === 'IN_PREPARATION' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'READY')}
                    >
                      Marcar Pronto
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                    >
                      Saiu para Entrega
                    </Button>
                  )}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                  {(order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                {order.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Observações:</span> {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
