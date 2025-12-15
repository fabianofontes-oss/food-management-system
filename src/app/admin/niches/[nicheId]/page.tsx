'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Check, X, Package, Settings, Truck, Users, ChefHat,
  CreditCard, BarChart3, Megaphone, Heart, Clock, Scale, Utensils
} from 'lucide-react'
import { getNicheTemplateById } from '@/data/niches'

const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  menu: Utensils,
  orders: Package,
  delivery: Truck,
  pos: CreditCard,
  kitchen: ChefHat,
  tables: Users,
  tabs: CreditCard,
  rodizio: Clock,
  custom_orders: Package,
  nutritional: Heart,
  weight: Scale,
  loyalty: Heart,
  reports: BarChart3,
  inventory: Package,
  crm: Users,
  marketing: Megaphone,
  mimo: Heart,
}

export default function NicheDetailPage() {
  const params = useParams()
  const nicheId = params.nicheId as string
  
  const template = getNicheTemplateById(nicheId)
  
  if (!template) {
    return (
      <div className="p-6">
        <p className="text-red-500">Nicho não encontrado</p>
        <Link href="/admin/niches" className="text-violet-600 hover:underline">Voltar</Link>
      </div>
    )
  }

  const enabledModules = template.modules.filter(m => m.enabled)
  const disabledModules = template.modules.filter(m => !m.enabled)

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
            {template.categories[0]?.icon || '🏪'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-500">{template.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Módulos Habilitados */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Módulos Habilitados ({enabledModules.length})
          </h2>
          <div className="space-y-2">
            {enabledModules.map((mod) => {
              const Icon = moduleIconMap[mod.id] || Settings
              return (
                <div key={mod.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <Icon className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">{mod.name}</span>
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Módulos Desabilitados */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-gray-400" />
            Módulos Desabilitados ({disabledModules.length})
          </h2>
          <div className="space-y-2">
            {disabledModules.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum módulo desabilitado</p>
            ) : (
              disabledModules.map((mod) => {
                const Icon = moduleIconMap[mod.id] || Settings
                return (
                  <div key={mod.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">{mod.name}</span>
                    <X className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Configurações */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">⚙️ Configurações</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ConfigItem label="Delivery" value={template.config.has_delivery} />
            <ConfigItem label="Retirada" value={template.config.has_pickup} />
            <ConfigItem label="Mesas" value={template.config.has_table_service} />
            <ConfigItem label="Balcão" value={template.config.has_counter_pickup} />
            <ConfigItem label="MIMO" value={template.config.mimo_enabled} />
            <ConfigItem label="Comanda Aberta" value={template.config.tab_system_enabled} />
            <ConfigItem label="Rodízio" value={template.config.rodizio_enabled} />
            <ConfigItem label="Encomendas" value={template.config.custom_orders_enabled} />
            <ConfigItem label="Info Nutricional" value={template.config.nutritional_info_enabled} />
            <ConfigItem label="Venda por Peso" value={template.config.weight_based_enabled} />
          </div>
          {template.config.loyalty_type && (
            <div className="mt-4 p-3 bg-violet-50 rounded-lg">
              <span className="text-sm text-violet-700">
                Fidelidade: <strong>{template.config.loyalty_type}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">📂 Categorias ({template.categories.length})</h2>
          <div className="flex flex-wrap gap-2">
            {template.categories.map((cat, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">📦 Produtos ({template.products.length})</h2>
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
              {template.products.slice(0, 20).map((prod, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-900">{prod.name}</td>
                  <td className="py-2 text-gray-500">{prod.category}</td>
                  <td className="py-2 text-right text-emerald-600">R$ {prod.price.toFixed(2)}</td>
                  <td className="py-2 text-right text-gray-400">
                    {prod.cost ? `R$ ${prod.cost.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 text-gray-500">{prod.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {template.products.length > 20 && (
            <p className="text-sm text-gray-400 mt-4 text-center">
              ... e mais {template.products.length - 20} produtos
            </p>
          )}
        </div>
      </div>

      {/* Kits Sugeridos */}
      {template.suggested_kit_ids.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">🎁 Kits Sugeridos</h2>
          <div className="flex flex-wrap gap-2">
            {template.suggested_kit_ids.map((kitId) => (
              <span key={kitId} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm">
                {kitId}
              </span>
            ))}
          </div>
        </div>
      )}
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
