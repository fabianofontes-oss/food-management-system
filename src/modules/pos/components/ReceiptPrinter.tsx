'use client'

import { useRef } from 'react'
import { Printer, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ReceiptData } from '../types'

interface ReceiptPrinterProps {
  data: ReceiptData
  onClose: () => void
  storeName?: string
}

export function ReceiptPrinter({ data, onClose, storeName }: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Cupom - ${data.orderCode}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .total { font-size: 16px; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = () => {
    const content = receiptRef.current
    if (!content) return

    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cupom - ${data.orderCode}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `], { type: 'text/html' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cupom-${data.orderCode}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentMethodLabel = {
    cash: 'DINHEIRO',
    card: 'CARTÃO',
    pix: 'PIX'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Cupom da Venda</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cupom */}
        <div className="flex-1 overflow-y-auto p-4">
          <div ref={receiptRef} className="bg-white p-4 font-mono text-xs border rounded-lg">
            {/* Cabeçalho */}
            <div className="center bold" style={{ fontSize: '14px' }}>
              {storeName || data.storeName || 'LOJA'}
            </div>
            {data.storeAddress && <div className="center">{data.storeAddress}</div>}
            {data.storePhone && <div className="center">Tel: {data.storePhone}</div>}
            
            <div className="line"></div>
            
            <div className="center bold">CUPOM NÃO FISCAL</div>
            <div className="center">{data.orderCode}</div>
            <div className="center">{data.createdAt.toLocaleString('pt-BR')}</div>
            
            {data.attendant && <div className="center">Atendente: {data.attendant}</div>}
            {data.customerName && data.customerName !== 'Cliente PDV' && (
              <div className="center">Cliente: {data.customerName}</div>
            )}
            {data.tableNumber && <div className="center bold">MESA {data.tableNumber}</div>}
            
            <div className="line"></div>
            
            {/* Itens */}
            <div className="bold">ITENS:</div>
            {data.items.map((item, idx) => (
              <div key={idx}>
                <div className="row">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
                {item.addons?.map((addon, i) => (
                  <div key={i} className="row" style={{ paddingLeft: '10px', color: '#666' }}>
                    <span>+ {addon.name}</span>
                    <span>{formatCurrency(addon.price)}</span>
                  </div>
                ))}
                {item.obs && <div style={{ paddingLeft: '10px', color: '#666' }}>📝 {item.obs}</div>}
              </div>
            ))}
            
            <div className="line"></div>
            
            {/* Totais */}
            <div className="row"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
            {data.discount > 0 && (
              <div className="row" style={{ color: 'green' }}><span>Desconto</span><span>-{formatCurrency(data.discount)}</span></div>
            )}
            {data.serviceFee > 0 && (
              <div className="row"><span>Taxa Serviço</span><span>+{formatCurrency(data.serviceFee)}</span></div>
            )}
            {data.tip > 0 && (
              <div className="row"><span>Gorjeta</span><span>+{formatCurrency(data.tip)}</span></div>
            )}
            
            <div className="line"></div>
            
            <div className="row total">
              <span>TOTAL</span>
              <span>{formatCurrency(data.total)}</span>
            </div>
            
            <div className="line"></div>
            
            {/* Pagamento */}
            <div className="row"><span>Forma Pagamento</span><span>{paymentMethodLabel[data.paymentMethod]}</span></div>
            {data.paymentMethod === 'cash' && data.cashReceived && (
              <>
                <div className="row"><span>Valor Recebido</span><span>{formatCurrency(data.cashReceived)}</span></div>
                <div className="row bold"><span>Troco</span><span>{formatCurrency(data.change || 0)}</span></div>
              </>
            )}
            
            <div className="line"></div>
            
            <div className="center" style={{ marginTop: '10px' }}>
              Obrigado pela preferência!
            </div>
            <div className="center" style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
              Powered by Pediu
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="p-4 border-t flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          <Button onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  )
}
