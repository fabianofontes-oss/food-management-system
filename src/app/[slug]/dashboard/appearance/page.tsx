'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Palette, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardStoreId } from '../DashboardClient'
import { SiteBuilder } from '@/modules/store/components/site-builder/site-builder'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { MenuTheme, StoreWithSettings } from '@/modules/store/types'

const DEFAULT_THEME: MenuTheme = {
  layout: 'modern',
  colors: {
    primary: '#ea1d2c',
    background: '#f4f4f5',
    header: '#ffffff'
  },
  display: {
    showBanner: true,
    showLogo: true,
    showSearch: true,
    showAddress: true,
    showSocial: true
  }
}

export default function AppearancePage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreWithSettings | null>(null)
  const [initialTheme, setInitialTheme] = useState<MenuTheme>(DEFAULT_THEME)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicMenuUrl = `${origin}/${slug}`

  useEffect(() => {
    if (!storeId) return

    const loadStore = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()

        if (error) throw error

        if (data) {
          setStore(data as StoreWithSettings)
          // CORRIGIDO: Ler de menu_theme (não theme)
          const savedTheme = (data as any).menu_theme
          if (savedTheme) {
            setInitialTheme({
              ...DEFAULT_THEME,
              ...savedTheme,
              colors: { ...DEFAULT_THEME.colors, ...(savedTheme?.colors || {}) },
              display: { ...DEFAULT_THEME.display, ...(savedTheme?.display || {}) }
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar loja:', error)
        toast.error('Erro ao carregar dados da loja')
      } finally {
        setLoading(false)
      }
    }

    loadStore()
  }, [storeId])

  if (!storeId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loja inválida</div>
          <div className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-7 h-7" />
            Aparência do Cardápio
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize cores, layout e elementos visuais do seu cardápio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={publicMenuUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Cardápio
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(publicMenuUrl)
                toast.success('URL copiada!')
              } catch {
                toast.error('Erro ao copiar URL')
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar URL
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          <strong>Nota:</strong> Para editar dados cadastrais (endereço, telefone, redes sociais, horários), 
          acesse <strong>Configurações → Dados da Loja</strong>.
        </p>
      </div>

      <SiteBuilder 
        storeId={storeId} 
        store={store} 
        initialTheme={initialTheme} 
      />
    </div>
  )
}
