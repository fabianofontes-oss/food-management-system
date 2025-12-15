'use client'

import { useRef } from 'react'
import { formatCurrency } from '@/lib/utils'

interface OrderItem {
  name: string
  quantity: number
  unit_price: number
  modifiers?: { name: string; extra_price: number }[]
  notes?: string
}

interface ThermalReceiptProps {
  order: {
    id: string
    code: string
    created_at: string
    customer_name?: string
    customer_phone?: string
    channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
    delivery_address?: string
    items: OrderItem[]
    subtotal: number
    discount?: number
    delivery_fee?: number
    total: number
    payment_method?: string
    notes?: string
  }
  storeName: string
  storePhone?: string
  storeAddress?: string
  onPrint?: () => void
}

export function ThermalReceipt({
  order,
  storeName,
  storePhone,
  storeAddress,
}: ThermalReceiptProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const channelLabel = {
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

  return (
    <div className="thermal-receipt">
      {/* Estilos para impressão térmica 80mm */}
      <style jsx>{`
        .thermal-receipt {
          width: 80mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 5mm;
        }

        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }

        .store-name {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .order-code {
          font-size: 24px;
          font-weight: bold;
          margin: 2mm 0;
        }

        .channel-badge {
          display: inline-block;
          padding: 1mm 3mm;
          border: 1px solid #000;
          font-weight: bold;
          margin-top: 2mm;
        }

        .section {
          border-bottom: 1px dashed #000;
          padding: 3mm 0;
        }

        .section-title {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 2mm;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }

        .item-name {
          flex: 1;
          font-weight: bold;
        }

        .item-qty {
          width: 8mm;
          text-align: center;
        }

        .item-price {
          width: 20mm;
          text-align: right;
        }

        .item-modifiers {
          font-size: 10px;
          padding-left: 3mm;
          color: #333;
        }

        .item-notes {
          font-size: 10px;
          font-style: italic;
          padding-left: 3mm;
          color: #666;
        }

        .totals {
          padding: 3mm 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }

        .total-final {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 2mm;
          margin-top: 2mm;
        }

        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 5mm;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          .thermal-receipt,
          .thermal-receipt * {
            visibility: visible;
          }

          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="header">
        <div className="store-name">{storeName}</div>
        {storePhone && <div>{storePhone}</div>}
        {storeAddress && <div style={{ fontSize: '10px' }}>{storeAddress}</div>}
        <div className="order-code">#{order.code}</div>
        <div>{formatDate(order.created_at)}</div>
        <div className="channel-badge">{channelLabel[order.channel]}</div>
      </div>

      {/* Cliente */}
      {(order.customer_name || order.delivery_address) && (
        <div className="section">
          <div className="section-title">Cliente</div>
          {order.customer_name && <div>{order.customer_name}</div>}
          {order.customer_phone && <div>Tel: {order.customer_phone}</div>}
          {order.delivery_address && (
            <div style={{ marginTop: '2mm' }}>
              <strong>Endereço:</strong>
              <br />
              {order.delivery_address}
            </div>
          )}
        </div>
      )}

      {/* Itens */}
      <div className="section">
        <div className="section-title">Itens do Pedido</div>
        {order.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '2mm' }}>
            <div className="item-row">
              <span className="item-qty">{item.quantity}x</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">
                {formatCurrency(item.unit_price * item.quantity)}
              </span>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="item-modifiers">
                {item.modifiers.map((mod, i) => (
                  <div key={i}>
                    + {mod.name}
                    {mod.extra_price > 0 && ` (${formatCurrency(mod.extra_price)})`}
                  </div>
                ))}
              </div>
            )}
            {item.notes && <div className="item-notes">Obs: {item.notes}</div>}
          </div>
        ))}
      </div>

      {/* Observações do pedido */}
      {order.notes && (
        <div className="section">
          <div className="section-title">Observações</div>
          <div style={{ fontStyle: 'italic' }}>{order.notes}</div>
        </div>
      )}

      {/* Totais */}
      <div className="totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.discount && order.discount > 0 && (
          <div className="total-row">
            <span>Desconto:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        {order.delivery_fee && order.delivery_fee > 0 && (
          <div className="total-row">
            <span>Taxa de Entrega:</span>
            <span>{formatCurrency(order.delivery_fee)}</span>
          </div>
        )}
        <div className="total-row total-final">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        {order.payment_method && (
          <div className="total-row">
            <span>Pagamento:</span>
            <span>{paymentLabel[order.payment_method] || order.payment_method}</span>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="divider" />
      <div className="footer">
        <div>Obrigado pela preferência!</div>
        <div>Volte sempre!</div>
      </div>
    </div>
  )
}

// Componente de botão para impressão
interface PrintButtonProps {
  order: ThermalReceiptProps['order']
  storeName: string
  storePhone?: string
  storeAddress?: string
  className?: string
  children?: React.ReactNode
}

export function PrintOrderButton({
  order,
  storeName,
  storePhone,
  storeAddress,
  className,
  children,
}: PrintButtonProps) {
  const handlePrint = () => {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    if (!printWindow) {
      alert('Permita pop-ups para imprimir')
      return
    }

    // Renderizar o recibo na nova janela
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cupom #${order.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; }
          </style>
        </head>
        <body>
          <div id="receipt"></div>
        </body>
      </html>
    `)

    // Esperar a janela carregar e imprimir
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }

    // Fallback se onload não disparar
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print()
        printWindow.close()
      }
    }, 500)
  }

  return (
    <button onClick={handlePrint} className={className} title="Imprimir Cupom">
      {children}
    </button>
  )
}
