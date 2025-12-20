'use client'

import { useRef, useState, useEffect } from 'react'
import { Pen, RotateCcw, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface SignatureCaptureProps {
  deliveryId: string
  storeId: string
  customerName: string
  onComplete: (signatureUrl: string) => void
  onCancel: () => void
}

/**
 * Componente para captura de assinatura digital do cliente
 */
export function SignatureCapture({
  deliveryId,
  storeId,
  customerName,
  onComplete,
  onCancel
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const saveSignature = async () => {
    if (!hasSignature) return

    setUploading(true)
    setError('')

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas não encontrado')

      // Converter canvas para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Erro ao gerar imagem')),
          'image/png',
          0.9
        )
      })

      // Upload para Supabase Storage
      const supabase = createClient()
      const fileName = `signatures/${storeId}/${deliveryId}-${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, blob, { contentType: 'image/png', upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(fileName)
      const signatureUrl = urlData.publicUrl

      // Salvar URL na entrega
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          customer_signature_url: signatureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (updateError) throw updateError

      onComplete(signatureUrl)
    } catch (err) {
      console.error('Erro ao salvar assinatura:', err)
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pen className="w-5 h-5" />
              <span className="font-bold">Assinatura do Cliente</span>
            </div>
            <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">{customerName}</p>
        </div>

        {/* Canvas */}
        <div className="p-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={350}
              height={200}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          
          <p className="text-center text-sm text-slate-400 mt-2">
            {hasSignature ? 'Assinatura capturada' : 'Desenhe sua assinatura acima'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mt-2 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 flex gap-3">
          <Button
            onClick={clearSignature}
            variant="outline"
            className="flex-1"
            disabled={uploading}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button
            onClick={saveSignature}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!hasSignature || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
