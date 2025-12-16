'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ImageUploadButtonProps {
  productId: string
  productName: string
}

export function ImageUploadButton({ productId, productName }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Atualizar produto com a nova URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      toast.success(`Imagem de "${productName}" atualizada!`)
      
      // Recarregar página após 1.5s
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={uploading || success}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          success
            ? 'bg-emerald-100 text-emerald-700'
            : uploading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
        }`}
      >
        {success ? (
          <>
            <Check className="w-4 h-4" />
            Enviado!
          </>
        ) : uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Rápido
          </>
        )}
      </button>
    </>
  )
}
