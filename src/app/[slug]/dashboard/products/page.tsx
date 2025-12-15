'use client'

import { useStoreId } from '@/hooks/useStore'
import { MenuManager } from '@/modules/menu/components/menu-manager'
import { Loader2, Package } from 'lucide-react'

export default function ProductsPage() {
  const storeId = useStoreId()

  if (!storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <Loader2 className="w-14 h-14 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <MenuManager storeId={storeId} />
      </div>
    </div>
  )
}
