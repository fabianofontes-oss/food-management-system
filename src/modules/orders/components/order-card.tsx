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
  ShoppingBag,
  Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { OrderWithDetails, OrderStatus } from '../types'

interface OrderCardProps {
  order: OrderWithDetails
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  storeName?: string
  storePhone?: string
  storeAddress?: string
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

export function OrderCard({ order, onStatusChange, storeName = 'Loja', storePhone, storeAddress }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status]
  const nextAction = NEXT_STATUS[order.status]
  const StatusIcon = statusConfig.icon

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  // Função de impressão
  const handlePrint = () => {
    const channelLabel: Record<string, string> = {
      COUNTER: 'Balcão',
      DELIVERY: 'Delivery',
      TAKEAWAY: 'Retirada',
    }
    
    const paymentLabel: Record<string, string> = {
      PIX: 'PIX',
      CASH: 'Dinheiro',
      CARD: 'Cartão',
      ONLINE: 'Online',
    }

    const formatCurrencyPrint = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('pt-BR')
    }

    // Montar HTML do cupom
    const itemsHtml = order.items.map(item => `
      <div style="margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between;">
          <span>${item.quantity}x ${item.title_snapshot}</span>
          <span>${formatCurrencyPrint(item.unit_price * item.quantity)}</span>
        </div>
        ${item.modifiers?.length ? `<div style="font-size: 10px; padding-left: 8px; color: #666;">
          ${item.modifiers.map((m: any) => `+ ${m.name_snapshot}${m.extra_price > 0 ? ` (${formatCurrencyPrint(m.extra_price)})` : ''}`).join('<br/>')}
        </div>` : ''}
      </div>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cupom #${order.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 80mm; 
              padding: 5mm;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .store-name { font-size: 16px; font-weight: bold; }
            .order-code { font-size: 22px; font-weight: bold; margin: 4px 0; }
            .section { border-bottom: 1px dashed #000; padding: 8px 0; }
            .total { font-size: 16px; font-weight: bold; margin-top: 8px; display: flex; justify-content: space-between; }
            .footer { text-align: center; font-size: 10px; margin-top: 12px; }
            @media print { @page { size: 80mm auto; margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${storeName}</div>
            ${storePhone ? `<div>${storePhone}</div>` : ''}
            <div class="order-code">#${order.code}</div>
            <div>${formatDate(order.created_at)}</div>
            <div style="border: 1px solid #000; display: inline-block; padding: 2px 8px; margin-top: 4px; font-weight: bold;">
              ${channelLabel[order.channel] || order.channel}
            </div>
          </div>
          
          ${order.customer ? `
          <div class="section">
            <strong>CLIENTE</strong><br/>
            ${order.customer.name}<br/>
            ${order.customer.phone ? `Tel: ${order.customer.phone}` : ''}
          </div>
          ` : ''}
          
          <div class="section">
            <strong>ITENS</strong><br/>
            ${itemsHtml}
          </div>
          
          <div style="padding-top: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>${formatCurrencyPrint(order.subtotal_amount)}</span>
            </div>
            ${order.discount_amount > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Desconto:</span>
              <span>-${formatCurrencyPrint(order.discount_amount)}</span>
            </div>
            ` : ''}
            ${order.delivery_fee && order.delivery_fee > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Entrega:</span>
              <span>${formatCurrencyPrint(order.delivery_fee)}</span>
            </div>
            ` : ''}
            <div class="total">
              <span>TOTAL:</span>
              <span>${formatCurrencyPrint(order.total_amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span>Pagamento:</span>
              <span>${paymentLabel[order.payment_method] || order.payment_method}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>- - - - - - - - - - - - - - - -</div>
            <div>Obrigado pela preferência!</div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=320,height=600')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

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
        {/* Botão de Impressão */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handlePrint()}
          title="Imprimir Cupom"
        >
          <Printer className="w-4 h-4" />
        </Button>
        
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
