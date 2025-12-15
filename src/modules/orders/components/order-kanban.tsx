'use client'

import { Clock, ChefHat, Package, Truck } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { OrderWithDetails, OrderStatus } from '../types'
import { OrderCard } from './order-card'

interface OrderKanbanProps {
  orders: OrderWithDetails[]
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
}

interface KanbanColumn {
  id: string
  title: string
  statuses: OrderStatus[]
  icon: React.ElementType
  color: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'Pendentes',
    statuses: ['PENDING'],
    icon: Clock,
    color: 'border-yellow-500',
  },
  {
    id: 'preparing',
    title: 'Em Preparo',
    statuses: ['ACCEPTED', 'IN_PREPARATION'],
    icon: ChefHat,
    color: 'border-orange-500',
  },
  {
    id: 'ready',
    title: 'Pronto',
    statuses: ['READY'],
    icon: Package,
    color: 'border-green-500',
  },
  {
    id: 'delivery',
    title: 'Em Entrega',
    statuses: ['OUT_FOR_DELIVERY'],
    icon: Truck,
    color: 'border-purple-500',
  },
]

export function OrderKanban({ orders, onStatusChange }: OrderKanbanProps) {
  const getOrdersForColumn = (statuses: OrderStatus[]) => {
    return orders.filter((order) => statuses.includes(order.status))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {COLUMNS.map((column) => {
        const columnOrders = getOrdersForColumn(column.statuses)
        const Icon = column.icon

        return (
          <div
            key={column.id}
            className={cn(
              'flex flex-col bg-muted/30 rounded-lg border-t-4',
              column.color
            )}
          >
            {/* Header da Coluna */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                <h3 className="font-semibold">{column.title}</h3>
              </div>
              <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded-full">
                {columnOrders.length}
              </span>
            </div>

            {/* Lista de Pedidos */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {columnOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Icon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhum pedido</p>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={onStatusChange}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
