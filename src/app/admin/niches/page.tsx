'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  IceCream, Beef, Pizza, Beer, Fish, Cake, Leaf, Coffee,
  UtensilsCrossed, Croissant, Apple, ChefHat, ArrowRight, Package, Settings,
  Loader2, Plus
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  IceCream, Beef, Pizza, Beer, Fish, Cake, Leaf, Coffee,
  UtensilsCrossed, Croissant, Apple, ChefHat,
}

interface NicheTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  modules_count?: number
  products_count?: number
  categories_count?: number
}

export default function AdminNichesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [niches, setNiches] = useState<NicheTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalNiches: 0, totalProducts: 0, totalCategories: 0 })

  useEffect(() => {
    async function loadNiches() {
      // Buscar nichos
      const { data: nichesData } = await supabase
        .from('niche_templates')
        .select('*')
        .order('sort_order')

      if (nichesData) {
        // Buscar contagens
        const nichesWithCounts = await Promise.all(
          nichesData.map(async (n: NicheTemplate) => {
            const [modulesRes, productsRes, categoriesRes] = await Promise.all([
              supabase.from('niche_modules').select('id', { count: 'exact', head: true }).eq('niche_id', n.id).eq('is_enabled', true),
              supabase.from('niche_products').select('id', { count: 'exact', head: true }).eq('niche_id', n.id),
              supabase.from('niche_categories').select('id', { count: 'exact', head: true }).eq('niche_id', n.id),
            ])
            return {
              ...n,
              modules_count: modulesRes.count || 0,
              products_count: productsRes.count || 0,
              categories_count: categoriesRes.count || 0,
            }
          })
        )
        setNiches(nichesWithCounts)
        
        // Calcular totais
        setStats({
          totalNiches: nichesWithCounts.length,
          totalProducts: nichesWithCounts.reduce((acc, n) => acc + (n.products_count || 0), 0),
          totalCategories: nichesWithCounts.reduce((acc, n) => acc + (n.categories_count || 0), 0),
        })
      }
      setLoading(false)
    }
    loadNiches()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
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
        <Link
          href="/admin/niches/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Novo Nicho
        </Link>
      </div>

      {/* Grid de Nichos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {niches.map((niche) => {
          const IconComponent = iconMap[niche.icon] || UtensilsCrossed
          
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
                  {niche.modules_count || 0} módulos
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  <Package className="w-3 h-3" />
                  {niche.products_count || 0} produtos
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {niche.categories_count || 0} categorias
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
