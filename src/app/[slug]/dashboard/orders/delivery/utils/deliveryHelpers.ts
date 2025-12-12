export const getElapsedTime = (dateString: string): string => {
  const date = new Date(dateString)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  return `${minutes} min`
}

export const getTimerColor = (minutes: number): string => {
  if (minutes < 20) return 'text-green-600'
  if (minutes < 30) return 'text-yellow-600'
  return 'text-red-600'
}

export const getProgressPercentage = (dateString: string, maxMinutes: number = 45): number => {
  const date = new Date(dateString)
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  return Math.min((minutes / maxMinutes) * 100, 100)
}

export const copyAddress = (address: string): void => {
  navigator.clipboard.writeText(address)
  alert('✅ Endereço copiado!')
}

export const openInMaps = (address: string): void => {
  const encoded = encodeURIComponent(address)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
}

export const printDeliveryLabel = (order: any, orderItems: Record<string, any[]>, deliveryNotes: Record<string, string>): void => {
  const printWindow = window.open('', '', 'width=300,height=600')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta #${order.order_code}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; }
            h2 { text-align: center; margin: 5px 0; }
            .section { margin: 10px 0; padding: 5px; border: 1px solid #000; }
            hr { border: 1px dashed #000; }
          </style>
        </head>
        <body>
          <h2>🚚 ENTREGA #${order.order_code}</h2>
          <hr>
          <div class="section">
            <strong>CLIENTE:</strong><br>
            ${order.customer_name}<br>
            ${order.customer_phone || ''}
          </div>
          <div class="section">
            <strong>ENDEREÇO:</strong><br>
            ${order.delivery_address || 'Não informado'}
          </div>
          <hr>
          <strong>ITENS:</strong><br>
          ${orderItems[order.id]?.map(item => `
            ${item.quantity}x ${item.products?.name || 'Produto'}<br>
          `).join('') || ''}
          <hr>
          ${order.notes ? `<strong>OBS:</strong> ${order.notes}<hr>` : ''}
          ${deliveryNotes[order.id] ? `<strong>NOTA ENTREGA:</strong> ${deliveryNotes[order.id]}<hr>` : ''}
          <p style="text-align: center; margin-top: 20px;">*** BOA ENTREGA ***</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}
