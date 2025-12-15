'use client'

import Link from 'next/link'
import { 
  IceCream, Beef, Pizza, Beer, Fish, Cake, Leaf, Coffee,
  UtensilsCrossed, Croissant, Apple, ChefHat, ArrowRight, Package, Settings
} from 'lucide-react'
import { ALL_NICHE_TEMPLATES, getNicheStats } from '@/data/niches'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  IceCream, Beef, Pizza, Beer, Fish, Cake, Leaf, Coffee,
  UtensilsCrossed, Croissant, Apple, ChefHat,
}

export default function AdminNichesPage() {
  const stats = getNicheStats()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nichos do Sistema</h1>
        <p className="text-gray-600">
          Gerencie os nichos, módulos e produtos pré-configurados
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full">
            {stats.totalNiches} nichos
          </span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
            {stats.totalProducts} produtos
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            {stats.totalCategories} categorias
          </span>
        </div>
      </div>

      {/* Grid de Nichos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_NICHE_TEMPLATES.map((niche) => {
          const IconComponent = iconMap[niche.icon] || UtensilsCrossed
          const enabledModules = niche.modules.filter(m => m.enabled).length
          
          return (
            <Link
              key={niche.id}
              href={`/admin/niches/${niche.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${niche.color}20` }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: niche.color }} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{niche.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{niche.description}</p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  <Settings className="w-3 h-3" />
                  {enabledModules} módulos
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  <Package className="w-3 h-3" />
                  {niche.products.length} produtos
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {niche.categories.length} categorias
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
