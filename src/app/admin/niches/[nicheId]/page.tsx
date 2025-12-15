'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Check, X, Package, Settings, Truck, Users, ChefHat,
  CreditCard, BarChart3, Megaphone, Heart, Clock, Scale, Utensils,
  Loader2, Save, Pencil, Trash2
} from 'lucide-react'
import { toast } from 'sonner'

const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  menu: Utensils, orders: Package, delivery: Truck, pos: CreditCard,
  kitchen: ChefHat, tables: Users, tabs: CreditCard, rodizio: Clock,
  custom_orders: Package, nutritional: Heart, weight: Scale, loyalty: Heart,
  reports: BarChart3, inventory: Package, crm: Users, marketing: Megaphone, mimo: Heart,
}

interface NicheTemplate {
  id: string; name: string; description: string; icon: string; color: string;
  has_delivery: boolean; has_pickup: boolean; has_table_service: boolean;
  has_counter_pickup: boolean; mimo_enabled: boolean; tab_system_enabled: boolean;
  rodizio_enabled: boolean; custom_orders_enabled: boolean;
  nutritional_info_enabled: boolean; weight_based_enabled: boolean; loyalty_type: string;
}
interface NicheModule { id: string; module_id: string; module_name: string; is_enabled: boolean }
interface NicheCategory { id: string; name: string; icon: string }
interface NicheProduct { id: string; name: string; category_name: string; price: number; cost: number; unit: string }
interface NicheKit { id: string; kit_id: string }

export default function NicheDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nicheId = params.nicheId as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<NicheTemplate | null>(null)
  const [modules, setModules] = useState<NicheModule[]>([])
  const [categories, setCategories] = useState<NicheCategory[]>([])
  const [products, setProducts] = useState<NicheProduct[]>([])
  const [kits, setKits] = useState<NicheKit[]>([])

  useEffect(() => {
    async function loadNiche() {
      const [templateRes, modulesRes, categoriesRes, productsRes, kitsRes] = await Promise.all([
        supabase.from('niche_templates').select('*').eq('id', nicheId).single(),
        supabase.from('niche_modules').select('*').eq('niche_id', nicheId).order('sort_order'),
        supabase.from('niche_categories').select('*').eq('niche_id', nicheId).order('sort_order'),
        supabase.from('niche_products').select('*').eq('niche_id', nicheId).order('sort_order').limit(50),
        supabase.from('niche_suggested_kits').select('*').eq('niche_id', nicheId),
      ])
      if (templateRes.data) setTemplate(templateRes.data)
      if (modulesRes.data) setModules(modulesRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      if (kitsRes.data) setKits(kitsRes.data)
      setLoading(false)
    }
    loadNiche()
  }, [nicheId, supabase])

  const toggleModule = async (moduleId: string, currentState: boolean) => {
    const { error } = await supabase
      .from('niche_modules')
      .update({ is_enabled: !currentState })
      .eq('id', moduleId)
    if (!error) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, is_enabled: !currentState } : m))
      toast.success(`Módulo ${!currentState ? 'ativado' : 'desativado'}`)
    }
  }

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
  }
  
  if (!template) {
    return (
      <div className="p-6">
        <p className="text-red-500">Nicho não encontrado</p>
        <Link href="/admin/niches" className="text-violet-600 hover:underline">Voltar</Link>
      </div>
    )
  }

  const enabledModules = modules.filter(m => m.is_enabled)
  const disabledModules = modules.filter(m => !m.is_enabled)

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/niches" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Nichos
        </Link>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${template.color}20` }}
          >
            {categories[0]?.icon || '🏪'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-500">{template.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Módulos - Clicáveis para toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Módulos ({enabledModules.length} ativos)
          </h2>
          <div className="space-y-2">
            {modules.map((mod) => {
              const Icon = moduleIconMap[mod.module_id] || Settings
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id, mod.is_enabled)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    mod.is_enabled ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-50 hover:bg-gray-100 opacity-60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${mod.is_enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${mod.is_enabled ? 'text-gray-700' : 'text-gray-500'}`}>
                    {mod.module_name}
                  </span>
                  {mod.is_enabled ? (
                    <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400 ml-auto" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Configurações */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">⚙️ Configurações</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ConfigItem label="Delivery" value={template.has_delivery} />
            <ConfigItem label="Retirada" value={template.has_pickup} />
            <ConfigItem label="Mesas" value={template.has_table_service} />
            <ConfigItem label="Balcão" value={template.has_counter_pickup} />
            <ConfigItem label="MIMO" value={template.mimo_enabled} />
            <ConfigItem label="Comanda Aberta" value={template.tab_system_enabled} />
            <ConfigItem label="Rodízio" value={template.rodizio_enabled} />
            <ConfigItem label="Encomendas" value={template.custom_orders_enabled} />
            <ConfigItem label="Info Nutricional" value={template.nutritional_info_enabled} />
            <ConfigItem label="Venda por Peso" value={template.weight_based_enabled} />
          </div>
          {template.loyalty_type && (
            <div className="mt-4 p-3 bg-violet-50 rounded-lg">
              <span className="text-sm text-violet-700">
                Fidelidade: <strong>{template.loyalty_type}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">📂 Categorias ({categories.length})</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat.id} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Kits Sugeridos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">🎁 Kits Sugeridos ({kits.length})</h2>
          <div className="flex flex-wrap gap-2">
            {kits.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum kit configurado</p>
            ) : (
              kits.map((kit) => (
                <span key={kit.id} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm">
                  {kit.kit_id}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">📦 Produtos ({products.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Produto</th>
                <th className="pb-3 font-medium">Categoria</th>
                <th className="pb-3 font-medium text-right">Preço</th>
                <th className="pb-3 font-medium text-right">Custo</th>
                <th className="pb-3 font-medium">Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-900">{prod.name}</td>
                  <td className="py-2 text-gray-500">{prod.category_name}</td>
                  <td className="py-2 text-right text-emerald-600">R$ {Number(prod.price).toFixed(2)}</td>
                  <td className="py-2 text-right text-gray-400">
                    {prod.cost ? `R$ ${Number(prod.cost).toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 text-gray-500">{prod.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ConfigItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-gray-600">{label}</span>
      {value ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <X className="w-4 h-4 text-gray-300" />
      )}
    </div>
  )
}
