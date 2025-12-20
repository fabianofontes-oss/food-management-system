'use client'

import { useState, useRef } from 'react'
import { Camera, X, Check, Loader2, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface DeliveryProofCaptureProps {
  deliveryId: string
  storeId: string
  onComplete: (proofUrl: string) => void
  onCancel: () => void
}

export function DeliveryProofCapture({ 
  deliveryId, 
  storeId, 
  onComplete, 
  onCancel 
}: DeliveryProofCaptureProps) {
  const [mode, setMode] = useState<'camera' | 'preview' | 'uploading'>('camera')
  const [imageData, setImageData] = useState<string | null>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Não foi possível acessar a câmera')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setImageData(dataUrl)
      setMode('preview')
      stopCamera()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageData(event.target?.result as string)
        setMode('preview')
      }
      reader.readAsDataURL(file)
    }
  }

  function retake() {
    setImageData(null)
    setMode('camera')
    startCamera()
  }

  async function uploadAndConfirm() {
    if (!imageData) return

    setMode('uploading')
    try {
      const supabase = createClient()
      
      // Converter base64 para blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      
      // Nome do arquivo
      const fileName = `delivery-proofs/${storeId}/${deliveryId}-${Date.now()}.jpg`
      
      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(fileName)
      const proofUrl = urlData.publicUrl

      // Atualizar entrega com URL da prova
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({ 
          proof_photo_url: proofUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (updateError) throw updateError

      onComplete(proofUrl)
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError('Erro ao salvar foto. Tente novamente.')
      setMode('preview')
    }
  }

  // Iniciar câmera ao montar
  useState(() => {
    startCamera()
    return () => stopCamera()
  })

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 p-4 flex items-center justify-between">
        <button onClick={onCancel} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-white font-medium">Foto de Comprovação</h2>
        <div className="w-10" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">OK</button>
          </div>
        )}

        {mode === 'camera' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-lg rounded-lg bg-slate-800"
              onLoadedMetadata={() => videoRef.current?.play()}
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {mode === 'preview' && imageData && (
          <img 
            src={imageData} 
            alt="Preview" 
            className="w-full max-w-lg rounded-lg"
          />
        )}

        {mode === 'uploading' && (
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Salvando foto...</p>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-black/80 p-6">
        {mode === 'camera' && (
          <div className="flex items-center justify-center gap-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <Upload className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/50"
            >
              <Camera className="w-8 h-8 text-slate-800" />
            </button>
            <div className="w-14" />
          </div>
        )}

        {mode === 'preview' && (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={retake}
              variant="outline"
              size="lg"
              className="bg-white/20 border-white/50 text-white hover:bg-white/30"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Tirar outra
            </Button>
            <Button
              onClick={uploadAndConfirm}
              size="lg"
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirmar entrega
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
