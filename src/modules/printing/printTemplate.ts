/**
 * Template de impressão para pedidos
 * Usa CSS para formatação térmica (80mm/58mm)
 */

import type { PrintOrder, PrintConfig, PrintOrderItem } from './types'

const channelLabels: Record<string, string> = {
  COUNTER: 'BALCÃO',
  DELIVERY: 'DELIVERY',
  TAKEAWAY: 'RETIRADA',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderItem(item: PrintOrderItem): string {
  const modifiersHtml = item.modifiers?.length
    ? `<div class="item-modifiers">${item.modifiers.map(m => `+ ${m}`).join('<br>')}</div>`
    : ''
  
  const notesHtml = item.notes
    ? `<div class="item-notes">Obs: ${item.notes}</div>`
    : ''

  return `
    <div class="item">
      <div class="item-row">
        <span class="item-qty">${item.quantity}x</span>
        <span class="item-name">${item.name}</span>
        <span class="item-price">${formatCurrency(item.total)}</span>
      </div>
      ${modifiersHtml}
      ${notesHtml}
    </div>
  `
}

export function generatePrintHTML(order: PrintOrder, config: PrintConfig): string {
  const width = config.paperWidth === '58mm' ? '58mm' : '80mm'
  const fontSize = config.fontSize === 'small' ? '10px' : config.fontSize === 'large' ? '14px' : '12px'

  const addressHtml = order.address
    ? `
      <div class="section address">
        <strong>Endereço:</strong><br>
        ${order.address.street}, ${order.address.number}
        ${order.address.complement ? ` - ${order.address.complement}` : ''}<br>
        ${order.address.district}
      </div>
    `
    : ''

  const notesHtml = order.notes
    ? `<div class="section notes"><strong>Obs:</strong> ${order.notes}</div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pedido #${order.code}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      width: ${width};
      padding: 8px;
      line-height: 1.4;
    }
    
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .header h1 {
      font-size: 1.5em;
      margin-bottom: 4px;
    }
    
    .channel {
      font-size: 1.2em;
      font-weight: bold;
      background: #000;
      color: #fff;
      padding: 4px;
      text-align: center;
      margin: 8px 0;
    }
    
    .section {
      margin: 8px 0;
      padding: 4px 0;
    }
    
    .customer {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
    }
    
    .items {
      border-bottom: 1px dashed #000;
    }
    
    .item {
      margin: 8px 0;
    }
    
    .item-row {
      display: flex;
      justify-content: space-between;
    }
    
    .item-qty {
      width: 30px;
    }
    
    .item-name {
      flex: 1;
      padding: 0 4px;
    }
    
    .item-price {
      text-align: right;
    }
    
    .item-modifiers {
      padding-left: 30px;
      font-size: 0.9em;
      color: #333;
    }
    
    .item-notes {
      padding-left: 30px;
      font-size: 0.9em;
      font-style: italic;
    }
    
    .totals {
      margin-top: 8px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    
    .total-final {
      font-size: 1.3em;
      font-weight: bold;
      border-top: 2px solid #000;
      padding-top: 4px;
      margin-top: 4px;
    }
    
    .footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px dashed #000;
      font-size: 0.9em;
    }
    
    .notes {
      font-style: italic;
      background: #f5f5f5;
      padding: 4px;
    }
    
    @media print {
      body {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PEDIDO #${order.code}</h1>
    <div>${formatDate(order.createdAt)}</div>
  </div>
  
  <div class="channel">${channelLabels[order.channel] || order.channel}</div>
  
  ${order.customer.name || order.customer.phone ? `
  <div class="section customer">
    ${order.customer.name ? `<strong>${order.customer.name}</strong><br>` : ''}
    ${order.customer.phone ? `Tel: ${order.customer.phone}` : ''}
  </div>
  ` : ''}
  
  ${addressHtml}
  
  <div class="section items">
    <strong>ITENS:</strong>
    ${order.items.map(renderItem).join('')}
  </div>
  
  <div class="section totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(order.subtotal)}</span>
    </div>
    ${order.deliveryFee > 0 ? `
    <div class="total-row">
      <span>Taxa de entrega:</span>
      <span>${formatCurrency(order.deliveryFee)}</span>
    </div>
    ` : ''}
    ${order.discount > 0 ? `
    <div class="total-row">
      <span>Desconto:</span>
      <span>-${formatCurrency(order.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>${formatCurrency(order.total)}</span>
    </div>
  </div>
  
  <div class="section">
    <strong>Pagamento:</strong> ${order.paymentMethod}
  </div>
  
  ${notesHtml}
  
  <div class="footer">
    Obrigado pela preferência!
  </div>
</body>
</html>
  `
}
