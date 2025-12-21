/**
 * Página de Aparência do Minisite
 * Página compacta que usa o módulo minisite
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, Loader2, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useDashboardStoreId } from '../DashboardClient'

import { ThemeEditor, DEFAULT_THEME, type MinisiteTheme } from '@/modules/minisite'

export default function AppearancePage() {
  const params = useParams()
  const slug = params.slug as string
  const storeId = useDashboardStoreId()
  
  logger.debug('[AppearancePage] storeId', { storeId, slug })

  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<MinisiteTheme>(DEFAULT_THEME)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${slug}` 
    : ''

  useEffect(() => {
    if (!storeId) return

    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('stores')
          .select('menu_theme, logo_url, banner_url')
          .eq('id', storeId)
          .single()

        if (data?.menu_theme) {
          setTheme({ ...DEFAULT_THEME, ...data.menu_theme })
        }

        setLogoUrl((data as any)?.logo_url || null)
        setBannerUrl((data as any)?.banner_url || null)
      } catch (error) {
        logger.error('Erro ao carregar tema', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [storeId])

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Loja não encontrada</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Palette className="w-6 h-6 text-violet-600" />
            Aparência do Cardápio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Personalize cores, layout e elementos visuais
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver Cardápio
          </a>
        </Button>
      </div>

      {/* Editor */}
      <ThemeEditor storeId={storeId} initialTheme={theme} logoUrl={logoUrl} bannerUrl={bannerUrl} />

      {/* Dica */}
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
        <p className="text-sm text-violet-700">
          <strong>Dica:</strong> As alterações são aplicadas instantaneamente no cardápio público após salvar.
        </p>
      </div>
    </div>
  )
}
