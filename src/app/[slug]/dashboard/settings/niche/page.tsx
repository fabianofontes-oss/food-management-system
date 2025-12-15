'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  IceCream, Beef, Pizza, Beer, Fish, Cake, Leaf, Coffee,
  UtensilsCrossed, Croissant, Apple, ChefHat, Check, AlertTriangle,
  Loader2, Sparkles
} from 'lucide-react'
import { NICHE_OPTIONS } from '@/data/niches'
import { seedStoreAction, reseedStoreAction } from '@/app/actions/seed-store'
import { toast } from 'sonner'

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  IceCream,
  Beef,
  Pizza,
  Beer,
  Fish,
  Cake,
  Leaf,
  Coffee,
  UtensilsCrossed,
  Croissant,
  Apple,
  ChefHat,
}

export default function NicheSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasProducts, setHasProducts] = useState(false) // TODO: verificar se loja já tem produtos
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const handleSelectNiche = async () => {
    if (!selectedNiche) {
      toast.error('Selecione um nicho')
      return
    }

    setIsLoading(true)
    
    try {
      // TODO: pegar storeId real do contexto
      const storeId = 'temp-store-id' // Placeholder - precisa integrar com contexto da loja
      
      const result = hasProducts 
        ? await reseedStoreAction(storeId, selectedNiche)
        : await seedStoreAction(storeId, selectedNiche)

      if (result.success) {
        toast.success(
          `🎉 Loja configurada! ${result.categoriesCreated} categorias e ${result.productsCreated} produtos criados.`
        )
        router.push(`/${slug}/dashboard/products`)
      } else {
        toast.error(result.error || 'Erro ao configurar loja')
      }
    } catch (error) {
      toast.error('Erro ao configurar loja')
      console.error(error)
    } finally {
      setIsLoading(false)
      setShowConfirmReset(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurar Nicho</h1>
        </div>
        <p className="text-gray-600">
          Escolha o tipo do seu negócio e sua loja será configurada automaticamente com produtos, 
          categorias e configurações específicas.
        </p>
      </div>

      {/* Grid de Nichos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {NICHE_OPTIONS.map((niche) => {
          const IconComponent = iconMap[niche.icon] || UtensilsCrossed
          const isSelected = selectedNiche === niche.id
          
          return (
            <button
              key={niche.id}
              onClick={() => setSelectedNiche(niche.id)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                hover:shadow-lg hover:scale-[1.02]
                ${isSelected 
                  ? 'border-violet-500 bg-violet-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Check icon */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${niche.color}20` }}
              >
                <IconComponent 
                  className="w-6 h-6" 
                  style={{ color: niche.color }}
                />
              </div>
              
              {/* Name */}
              <h3 className="font-semibold text-gray-900 mb-1">{niche.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{niche.description}</p>
            </button>
          )
        })}
      </div>

      {/* Info Box */}
      {selectedNiche && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-violet-900 mb-2">
            ✨ O que será configurado:
          </h3>
          <ul className="text-sm text-violet-800 space-y-1">
            <li>• Categorias específicas para o seu tipo de negócio</li>
            <li>• Produtos com preços médios de mercado</li>
            <li>• Configurações de delivery, mesas e módulos</li>
            <li>• Você poderá ajustar tudo depois!</li>
          </ul>
        </div>
      )}

      {/* Warning Box - se já tem produtos */}
      {hasProducts && selectedNiche && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">
                Atenção: Você já tem produtos cadastrados
              </h3>
              <p className="text-sm text-amber-800">
                Ao confirmar, todos os produtos e categorias atuais serão substituídos pelos do template.
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </button>
        
        <button
          onClick={() => hasProducts ? setShowConfirmReset(true) : handleSelectNiche()}
          disabled={!selectedNiche || isLoading}
          className={`
            px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all
            ${selectedNiche 
              ? 'bg-violet-600 text-white hover:bg-violet-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Configurando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Configurar Loja
            </>
          )}
        </button>
      </div>

      {/* Modal de Confirmação - Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirmar Reset</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Todos os seus produtos e categorias atuais serão <strong>excluídos</strong> e 
              substituídos pelos do template. Deseja continuar?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSelectNiche}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sim, Resetar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
