'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Check, 
  ChefHat, 
  Package, 
  Truck,
  X,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { OrderWithDetails, OrderStatus } from '../types'

interface OrderCardProps {
  order: OrderWithDetails
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  ACCEPTED: { label: 'Aceito', color: 'bg-blue-500', icon: Check },
  IN_PREPARATION: { label: 'Preparando', color: 'bg-orange-500', icon: ChefHat },
  READY: { label: 'Pronto', color: 'bg-green-500', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Em Entrega', color: 'bg-purple-500', icon: Truck },
  DELIVERED: { label: 'Entregue', color: 'bg-gray-500', icon: Check },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500', icon: X },
}

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PENDING: { status: 'ACCEPTED', label: 'Aceitar' },
  ACCEPTED: { status: 'IN_PREPARATION', label: 'Iniciar Preparo' },
  IN_PREPARATION: { status: 'READY', label: 'Pronto' },
  READY: { status: 'OUT_FOR_DELIVERY', label: 'Saiu p/ Entrega' },
  OUT_FOR_DELIVERY: { status: 'DELIVERED', label: 'Entregue' },
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status]
  const nextAction = NEXT_STATUS[order.status]
  const StatusIcon = statusConfig.icon

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  const itemsSummary = order.items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.title_snapshot}`)
    .join(', ')
  
  const hasMoreItems = order.items.length > 3

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">#{order.code}</span>
            <Badge className={cn('text-white', statusConfig.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            {timeAgo}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cliente */}
        {order.customer && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{order.customer.name}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-4 h-4" />
              {order.customer.phone}
            </div>
          </div>
        )}

        {/* Canal */}
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {order.channel === 'DELIVERY' && <Truck className="w-3 h-3 mr-1" />}
            {order.channel === 'TAKEAWAY' && <ShoppingBag className="w-3 h-3 mr-1" />}
            {order.channel === 'COUNTER' && <MapPin className="w-3 h-3 mr-1" />}
            {order.channel}
          </Badge>
          <Badge variant="secondary">{order.payment_method}</Badge>
        </div>

        {/* Itens */}
        <div className="text-sm text-muted-foreground">
          <p className="truncate">
            {itemsSummary}
            {hasMoreItems && ` +${order.items.length - 3} mais`}
          </p>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {nextAction && (
          <Button 
            className="flex-1"
            onClick={() => onStatusChange(order.id, nextAction.status)}
          >
            {nextAction.label}
          </Button>
        )}
        {order.status === 'PENDING' && (
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => onStatusChange(order.id, 'CANCELLED')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
