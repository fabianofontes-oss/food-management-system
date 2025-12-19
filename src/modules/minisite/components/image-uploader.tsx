'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadType = 'logo' | 'banner'

type AspectRatio = 'square' | 'banner'

interface ImageUploaderProps {
  storeId: string
  type: UploadType
  label: string
  description?: string
  value: string | null
  aspectRatio: AspectRatio
  onChange?: (url: string | null) => void
}

export function ImageUploader({
  storeId,
  type,
  label,
  description,
  value,
  aspectRatio,
  onChange,
}: ImageUploaderProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSelectFile = () => {
    inputRef.current?.click()
  }

  const handleRemove = async () => {
    setIsUploading(true)
    try {
      const endpoint = type === 'logo' ? '/api/upload/logo' : '/api/upload/banner'
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Falha ao remover imagem')
      }

      onChange?.(null)
      toast.success('Imagem removida')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao remover imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo inválido. Use JPG, PNG ou WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storeId', storeId)

      const endpoint = type === 'logo' ? '/api/upload/logo' : '/api/upload/banner'
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Falha no upload')
      }

      onChange?.(json.url)
      toast.success('Imagem enviada com sucesso')

      // Garante refetch de dados server-side e atualização do minisite
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {!!value && (
          <Button type="button" size="sm" variant="ghost" onClick={handleRemove}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          'border border-slate-200 rounded-xl overflow-hidden bg-slate-50',
          aspectRatio === 'square' ? 'aspect-square w-32' : 'aspect-[3/1] w-full'
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Sem imagem
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleUpload(file)
        }}
      />

      <Button type="button" variant="outline" size="sm" onClick={handleSelectFile} disabled={isUploading}>
        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {type === 'logo' ? 'Enviar logo' : 'Enviar banner'}
      </Button>
    </div>
  )
}
