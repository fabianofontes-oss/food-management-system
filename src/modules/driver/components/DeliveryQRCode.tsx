'use client'

import { useEffect, useRef } from 'react'
import { QrCode, CheckCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface DeliveryQRCodeProps {
  deliveryId: string
  orderCode: string
  storeSlug: string
  size?: number
}

/**
 * Gera QR Code para confirmação de entrega
 * O cliente escaneia para confirmar recebimento
 */
export function DeliveryQRCode({ 
  deliveryId, 
  orderCode, 
  storeSlug,
  size = 200 
}: DeliveryQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  // URL de confirmação
  const confirmUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${storeSlug}/confirmar/${deliveryId}`

  useEffect(() => {
    generateQRCode()
  }, [deliveryId])

  async function generateQRCode() {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpar canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Usar biblioteca simples de QR ou gerar pattern
    // Por enquanto, vamos usar um pattern visual simples
    // Em produção, usar qrcode.js ou similar
    
    const data = confirmUrl
    const moduleSize = Math.floor(size / 25)
    
    // Gerar módulos baseados no hash da URL
    ctx.fillStyle = '#000000'
    
    // Border
    ctx.fillRect(0, 0, size, moduleSize * 2)
    ctx.fillRect(0, size - moduleSize * 2, size, moduleSize * 2)
    ctx.fillRect(0, 0, moduleSize * 2, size)
    ctx.fillRect(size - moduleSize * 2, 0, moduleSize * 2, size)
    
    // Finder patterns (cantos)
    drawFinderPattern(ctx, moduleSize, moduleSize, moduleSize)
    drawFinderPattern(ctx, size - moduleSize * 8, moduleSize, moduleSize)
    drawFinderPattern(ctx, moduleSize, size - moduleSize * 8, moduleSize)
    
    // Data modules (simplificado)
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i)
      const x = ((i * 7) % 15 + 5) * moduleSize
      const y = (Math.floor((i * 7) / 15) % 10 + 8) * moduleSize
      
      if (charCode % 2 === 0) {
        ctx.fillRect(x, y, moduleSize, moduleSize)
      }
    }
  }

  function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
    // Outer square
    ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7)
    // Inner white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5)
    // Center black
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3)
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(deliveryId.slice(0, 8).toUpperCase())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">QR Code de Confirmação</h3>
      </div>

      <div className="bg-white p-4 rounded-xl inline-block border-2 border-slate-100 mb-4">
        <canvas 
          ref={canvasRef} 
          width={size} 
          height={size}
          className="mx-auto"
        />
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Peça ao cliente escanear para confirmar recebimento
      </p>

      <div className="flex items-center justify-center gap-2">
        <div className="bg-slate-100 px-4 py-2 rounded-lg font-mono text-lg tracking-wider">
          {deliveryId.slice(0, 8).toUpperCase()}
        </div>
        <button
          onClick={copyCode}
          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Código de confirmação do pedido #{orderCode}
      </p>
    </div>
  )
}

/**
 * Modal de confirmação que aparece quando cliente escaneia QR
 */
export function DeliveryConfirmationView({ 
  deliveryId,
  orderCode,
  onConfirm 
}: { 
  deliveryId: string
  orderCode: string
  onConfirm: () => void 
}) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm()
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Entrega Confirmada!</h1>
          <p className="text-slate-500">
            Pedido #{orderCode} recebido com sucesso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
          <QrCode className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirmar Recebimento</h1>
        <p className="text-slate-500 mb-6">
          Você recebeu o pedido #{orderCode}?
        </p>
        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
        >
          Sim, recebi meu pedido!
        </button>
      </div>
    </div>
  )
}
