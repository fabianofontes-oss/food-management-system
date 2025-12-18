/**
 * Módulo de Impressão MVP
 * Usa browser print com CSS para impressoras térmicas
 */

export * from './types'
export { generatePrintHTML } from './printTemplate'

import { generatePrintHTML } from './printTemplate'
import type { PrintOrder, PrintConfig } from './types'
import { defaultPrintConfig } from './types'

/**
 * Abre janela de impressão do browser
 */
export function printOrder(
  order: PrintOrder,
  config: PrintConfig = defaultPrintConfig
): void {
  const html = generatePrintHTML(order, config)
  
  // Criar janela de impressão
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.')
    return
  }
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    // Fechar após impressão (opcional)
    // printWindow.close()
  }
}

/**
 * Gera PDF para download (fallback)
 */
export function downloadOrderPDF(
  order: PrintOrder,
  config: PrintConfig = defaultPrintConfig
): void {
  const html = generatePrintHTML(order, config)
  
  // Criar blob HTML
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  // Download
  const a = document.createElement('a')
  a.href = url
  a.download = `pedido-${order.code}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
