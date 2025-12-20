'use client'

import { useState, useRef } from 'react'
import { Camera, User, Upload, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface DriverPhotoUploadProps {
  driverId: string
  storeId: string
  currentPhotoUrl?: string | null
  onUpload: (url: string) => void
}

/**
 * Componente para upload de foto do motorista
 */
export function DriverPhotoUpload({
  driverId,
  storeId,
  currentPhotoUrl,
  onUpload
}: DriverPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (max 5MB)')
      return
    }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const fileName = `driver-photos/${storeId}/${driverId}-${Date.now()}.jpg`

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, file, { contentType: file.type, upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage.from('public').getPublicUrl(fileName)
      const newPhotoUrl = urlData.publicUrl

      // Atualizar motorista
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ photo_url: newPhotoUrl, updated_at: new Date().toISOString() })
        .eq('id', driverId)

      if (updateError) throw updateError

      setPhotoUrl(newPhotoUrl)
      onUpload(newPhotoUrl)
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError('Erro ao salvar foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Foto do motorista" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          disabled={uploading}
        >
          {photoUrl ? (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Trocar foto
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Adicionar foto
            </>
          )}
        </Button>

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}

        {photoUrl && !error && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Foto salva
          </p>
        )}
      </div>
    </div>
  )
}
