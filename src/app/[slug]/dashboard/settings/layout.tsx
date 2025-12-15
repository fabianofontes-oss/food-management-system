'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, ShoppingCart, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const base = `/${slug}/dashboard`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header de Navegação Fixo */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Settings className="w-5 h-5 text-slate-600" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">Configurações</h1>
            </div>

            {/* Botões de Navegação - Sempre Visíveis */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`${base}/pos`)}
                className="hidden sm:flex items-center gap-2 h-10 px-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Voltar ao PDV</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(base)}
                className="hidden sm:flex items-center gap-2 h-10 px-4 text-slate-600 hover:bg-slate-100"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>

              {/* Mobile: Botão compacto */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`${base}/pos`)}
                className="sm:hidden min-w-[44px] min-h-[44px] border-emerald-200 text-emerald-700"
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(base)}
                className="sm:hidden min-w-[44px] min-h-[44px] text-slate-600"
              >
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pb-20">
        {children}
      </div>
    </div>
  )
}
