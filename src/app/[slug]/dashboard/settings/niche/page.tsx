'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  IceCream, Beef, Pizza, UtensilsCrossed, Loader2, Sparkles, 
  Check, ArrowRight, Package, Settings, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { NICHE_LIST } from '@/lib/templates/niche-data'
import { applyNicheAction } from '@/modules/store/actions'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  IceCream,
  Beef,
  Pizza,
  UtensilsCrossed
}

export default function NicheSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [currentNiche, setCurrentNiche] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStore, setIsLoadingStore] = useState(true)
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [hasProducts, setHasProducts] = useState(false)
  const [productsCount, setProductsCount] = useState(0)

  useEffect(() => {
    async function loadStore() {
      const { data: store } = await supabase
        .from('stores')
        .select('id, niche')
        .eq('slug', slug)
        .single()

      if (store) {
        setStoreId(store.id)
        setCurrentNiche(store.niche)

        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('is_active', true)

        setProductsCount(count || 0)
        setHasProducts((count || 0) > 0)
      }

      setIsLoadingStore(false)
    }

    loadStore()
  }, [slug, supabase])

  const handleApplyNiche = async (nicheId: string) => {
    if (!storeId) return
    
    setSelectedNiche(nicheId)
    setIsLoading(true)
    
    try {
      const result = await applyNicheAction(storeId, nicheId, slug)

      if (result.success) {
        toast.success(
          `🎉 Loja configurada! ${result.categoriesCreated} categorias e ${result.productsCreated} produtos criados.`,
          { duration: 5000 }
        )
        
        // Aguarda um pouco para o toast aparecer, depois redireciona
        setTimeout(() => {
          router.push(`/${slug}/dashboard/products`)
        }, 1500)
      } else {
        toast.error(result.error || 'Erro ao configurar loja')
        setIsLoading(false)
        setSelectedNiche(null)
      }
    } catch (error) {
      toast.error('Erro ao configurar loja')
      console.error(error)
      setIsLoading(false)
      setSelectedNiche(null)
    }
  }

  if (isLoadingStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Grande e Claro */}
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-2xl shadow-violet-500/30 mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-4">
            Configure sua Loja em 1 Clique
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto">
            Escolha o tipo do seu negócio e nós configuramos tudo pra você!
          </p>
          
          {currentNiche && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full">
              <Check className="w-5 h-5" />
              <span className="font-medium">
                Nicho atual: {NICHE_LIST.find(n => n.id === currentNiche)?.name || currentNiche}
              </span>
              {productsCount > 0 && (
                <span className="text-violet-500">• {productsCount} produtos</span>
              )}
            </div>
          )}
        </div>

        {/* Aviso se já tem produtos */}
        {hasProducts && (
          <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-800 mb-2">
                  Você já tem {productsCount} produtos cadastrados
                </h3>
                <p className="text-lg text-amber-700">
                  Ao escolher um novo kit, seus produtos atuais serão <strong>arquivados</strong> (não deletados). 
                  Você pode reativá-los depois em Produtos → Arquivados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Cards Grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {NICHE_LIST.map((niche) => {
            const IconComponent = iconMap[niche.icon] || UtensilsCrossed
            const isSelected = selectedNiche === niche.id
            const isApplying = isLoading && isSelected
            
            return (
              <div
                key={niche.id}
                className={`
                  relative overflow-hidden rounded-3xl border-4 transition-all duration-300
                  ${isSelected 
                    ? 'border-violet-500 shadow-2xl shadow-violet-500/20 scale-[1.02]' 
                    : 'border-transparent shadow-xl hover:shadow-2xl hover:scale-[1.01]'
                  }
                `}
                style={{ backgroundColor: niche.bgColor }}
              >
                {/* Fundo decorativo */}
                <div 
                  className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 -translate-y-10 translate-x-10"
                  style={{ backgroundColor: niche.color }}
                />
                
                <div className="relative p-8">
                  {/* Ícone Grande */}
                  <div 
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: niche.color }}
                  >
                    <IconComponent className="w-14 h-14 text-white" />
                  </div>
                  
                  {/* Título e Descrição */}
                  <h2 className="text-3xl font-black text-slate-800 mb-3">
                    {niche.name}
                  </h2>
                  <p className="text-lg text-slate-600 mb-6">
                    {niche.description}
                  </p>
                  
                  {/* Info dos produtos */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl">
                      <Package className="w-5 h-5 text-slate-500" />
                      <span className="font-bold text-slate-700">{niche.categoriesCount} categorias</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl">
                      <UtensilsCrossed className="w-5 h-5 text-slate-500" />
                      <span className="font-bold text-slate-700">{niche.productsCount} produtos</span>
                    </div>
                  </div>
                  
                  {/* Botão Grande */}
                  <button
                    onClick={() => handleApplyNiche(niche.id)}
                    disabled={isLoading}
                    className={`
                      w-full py-5 px-8 rounded-2xl font-bold text-xl
                      flex items-center justify-center gap-3
                      transition-all duration-300 transform
                      ${isApplying 
                        ? 'bg-violet-500 text-white' 
                        : 'bg-white text-slate-800 hover:bg-slate-800 hover:text-white'
                      }
                      disabled:opacity-70 disabled:cursor-not-allowed
                      shadow-lg hover:shadow-xl
                    `}
                    style={!isApplying ? { borderColor: niche.color } : {}}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span>Configurando sua loja...</span>
                      </>
                    ) : (
                      <>
                        <span>Quero Este!</span>
                        <ArrowRight className="w-7 h-7" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Card "Começar do Zero" - Menos destacado */}
        <div className="bg-white/80 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
          <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-4">
            <Settings className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-600 mb-2">
            Prefere Configurar na Mão?
          </h3>
          <p className="text-lg text-slate-500 mb-6 max-w-md mx-auto">
            Se você tem um negócio diferente ou quer criar tudo do zero, vá direto para produtos.
          </p>
          <button
            onClick={() => router.push(`/${slug}/dashboard/products`)}
            className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-lg"
          >
            Começar do Zero →
          </button>
        </div>

        {/* Dica no rodapé */}
        <div className="mt-8 text-center text-slate-500">
          <p className="text-lg">
            💡 <strong>Dica:</strong> Você pode personalizar os produtos e preços depois de escolher um kit!
          </p>
        </div>
      </div>
    </div>
  )
}
