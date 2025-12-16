'use client'

import { useState } from 'react'
import { Wrench, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SlugFixButtonProps {
  storeId: string
  currentSlug: string
  suggestedSlug: string
}

export function SlugFixButton({ storeId, currentSlug, suggestedSlug }: SlugFixButtonProps) {
  const [fixing, setFixing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleFix = async () => {
    setFixing(true)

    try {
      const supabase = createClient()

      // Verificar se o slug sugerido já existe
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', suggestedSlug)
        .neq('id', storeId)
        .single()

      if (existing) {
        // Se já existe, adicionar número
        let counter = 1
        let newSlug = `${suggestedSlug}-${counter}`
        
        while (true) {
          const { data: check } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', newSlug)
            .single()
          
          if (!check) break
          counter++
          newSlug = `${suggestedSlug}-${counter}`
        }

        // Atualizar com o novo slug único
        const { error } = await supabase
          .from('stores')
          .update({ slug: newSlug })
          .eq('id', storeId)

        if (error) throw error

        setSuccess(true)
        toast.success(`Slug atualizado para: ${newSlug}`)
      } else {
        // Atualizar diretamente
        const { error } = await supabase
          .from('stores')
          .update({ slug: suggestedSlug })
          .eq('id', storeId)

        if (error) throw error

        setSuccess(true)
        toast.success(`Slug atualizado para: ${suggestedSlug}`)
      }

      // Recarregar página após 1.5s
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      console.error('Erro ao corrigir slug:', error)
      toast.error(error.message || 'Erro ao corrigir slug')
    } finally {
      setFixing(false)
    }
  }

  return (
    <button
      onClick={handleFix}
      disabled={fixing || success}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        success
          ? 'bg-emerald-100 text-emerald-700'
          : fixing
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
      }`}
    >
      {success ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Corrigido!
        </>
      ) : fixing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Corrigindo...
        </>
      ) : (
        <>
          <Wrench className="w-3.5 h-3.5" />
          Corrigir Auto
        </>
      )}
    </button>
  )
}
