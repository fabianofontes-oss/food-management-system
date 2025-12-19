'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, 
  Link2, 
  CheckCircle2, 
  ArrowRight, 
  Store, 
  Utensils, 
  Rocket,
  AlertCircle
} from 'lucide-react'

type Step = 'slug' | 'menu' | 'publish'

interface StoreData {
  id: string
  slug: string
  name: string
  status: 'draft' | 'active'
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentStep, setCurrentStep] = useState<Step>('slug')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dados do usuário e loja
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<StoreData | null>(null)
  
  // Step 1: Slug
  const [slugInput, setSlugInput] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugReason, setSlugReason] = useState<string | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  
  // Step 2: Menu stats
  const [menuStats, setMenuStats] = useState({ categories: 0, products: 0 })

  const normalizedSlug = useMemo(() => {
    return slugInput
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
  }, [slugInput])

  // Verificar autenticação e estado atual
  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login?redirect=/onboarding')
        return
      }
      
      setUser(authUser)
      
      // Verificar se usuário já tem loja
      const { data: storeUser } = await supabase
        .from('store_users')
        .select('store_id, stores(id, slug, name, status)')
        .eq('user_id', authUser.id)
        .eq('role', 'OWNER')
        .maybeSingle()
      
      if (storeUser?.stores) {
        const storeData = storeUser.stores as any
        setStore({
          id: storeData.id,
          slug: storeData.slug,
          name: storeData.name,
          status: storeData.status || 'draft',
        })
        setSlugInput(storeData.slug)
        
        // Se já está publicada, redireciona para dashboard
        if (storeData.status === 'active') {
          router.push(`/${storeData.slug}/dashboard`)
          return
        }
        
        // Se já tem loja draft, verifica stats do menu
        await loadMenuStats(storeData.id)
        
        // Determinar step atual
        setCurrentStep('menu')
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [supabase, router])

  const loadMenuStats = async (storeId: string) => {
    const [catRes, prodRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_active', true),
    ])
    
    setMenuStats({
      categories: catRes.count || 0,
      products: prodRes.count || 0,
    })
  }

  // Debounce para verificar slug
  useEffect(() => {
    if (!normalizedSlug || normalizedSlug.length < 3) {
      setSlugAvailable(null)
      setSlugReason(null)
      return
    }
    
    const timer = setTimeout(async () => {
      setCheckingSlug(true)
      try {
        const res = await fetch('/api/public/slug/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: normalizedSlug }),
        })
        const data = await res.json()
        
        // Se é o slug da própria loja, considerar disponível
        if (store?.slug === data.normalized) {
          setSlugAvailable(true)
          setSlugReason(null)
        } else {
          setSlugAvailable(data.available)
          setSlugReason(data.reason || null)
        }
      } catch {
        setSlugAvailable(null)
      } finally {
        setCheckingSlug(false)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [normalizedSlug, store?.slug])

  const handlePrepareStore = async () => {
    setActionLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/onboarding/store/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: normalizedSlug,
          storeName: slugInput,
        }),
      })
      
      const data = await res.json()
      
      if (!data.ok) {
        throw new Error(data.error || 'Erro ao criar loja')
      }
      
      setStore({
        id: data.storeId,
        slug: data.slug,
        name: slugInput || data.slug,
        status: 'draft',
      })
      
      setCurrentStep('menu')
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar loja')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!store) return
    
    setActionLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/onboarding/store/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      })
      
      const data = await res.json()
      
      if (!data.ok) {
        throw new Error(data.error || 'Erro ao publicar loja')
      }
      
      // Sucesso! Redirecionar para dashboard
      router.push(`/${data.slug}/dashboard`)
    } catch (e: any) {
      setError(e?.message || 'Erro ao publicar loja')
    } finally {
      setActionLoading(false)
    }
  }

  const canPublish = menuStats.categories >= 1 && menuStats.products >= 1

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Configure sua loja</h1>
          <p className="text-slate-600 mt-2">Siga os passos abaixo para publicar seu cardápio</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StepIndicator 
            step={1} 
            label="URL" 
            icon={Link2}
            active={currentStep === 'slug'}
            completed={currentStep !== 'slug'}
          />
          <div className="w-12 h-0.5 bg-slate-200" />
          <StepIndicator 
            step={2} 
            label="Cardápio" 
            icon={Utensils}
            active={currentStep === 'menu'}
            completed={currentStep === 'publish'}
          />
          <div className="w-12 h-0.5 bg-slate-200" />
          <StepIndicator 
            step={3} 
            label="Publicar" 
            icon={Rocket}
            active={currentStep === 'publish'}
            completed={false}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 'slug' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-3 bg-violet-100 rounded-full mb-4">
                  <Link2 className="w-8 h-8 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Escolha sua URL</h2>
                <p className="text-slate-600 mt-1">Este será o endereço do seu cardápio online</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço da sua loja
                </label>
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none text-lg"
                  placeholder="ex: acai-do-joao"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use letras, números e hífen. Sem acentos ou espaços.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Prévia</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">pediu.food/</span>
                  <span className="text-violet-600 font-semibold">
                    {normalizedSlug || 'sua-loja'}
                  </span>
                  {checkingSlug && (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                {slugReason && (
                  <p className="text-sm text-red-600 mt-2">{slugReason}</p>
                )}
                {slugAvailable && (
                  <p className="text-sm text-green-600 mt-2">URL disponível!</p>
                )}
              </div>

              <button
                onClick={handlePrepareStore}
                disabled={actionLoading || !slugAvailable || !normalizedSlug}
                className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === 'menu' && store && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-3 bg-violet-100 rounded-full mb-4">
                  <Utensils className="w-8 h-8 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Monte seu cardápio</h2>
                <p className="text-slate-600 mt-1">
                  Adicione pelo menos 1 categoria e 1 produto para publicar
                </p>
              </div>

              {/* Banner de loja não publicada */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                <Store className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Sua loja ainda não está publicada</p>
                  <p className="text-sm text-amber-600">
                    URL reservada: pediu.food/{store.slug}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-slate-900">{menuStats.categories}</div>
                  <div className="text-sm text-slate-600">Categorias</div>
                  {menuStats.categories === 0 && (
                    <span className="text-xs text-red-500">Mínimo: 1</span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-slate-900">{menuStats.products}</div>
                  <div className="text-sm text-slate-600">Produtos</div>
                  {menuStats.products === 0 && (
                    <span className="text-xs text-red-500">Mínimo: 1</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`/${store.slug}/dashboard/products`}
                  className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Utensils className="w-5 h-5" />
                  Gerenciar Cardápio
                </a>
                
                <button
                  onClick={async () => {
                    await loadMenuStats(store.id)
                    if (canPublish) {
                      setCurrentStep('publish')
                    }
                  }}
                  disabled={!canPublish}
                  className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Continuar para Publicar
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                {!canPublish && (
                  <p className="text-sm text-center text-slate-500">
                    Adicione pelo menos 1 categoria e 1 produto
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 'publish' && store && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                  <Rocket className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pronto para publicar!</h2>
                <p className="text-slate-600 mt-1">
                  Seu cardápio ficará disponível em
                </p>
                <p className="text-violet-600 font-semibold text-lg mt-2">
                  pediu.food/{store.slug}
                </p>
              </div>

              {/* Resumo */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-700 mb-3">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nome da loja</span>
                    <span className="font-medium">{store.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Categorias</span>
                    <span className="font-medium">{menuStats.categories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Produtos</span>
                    <span className="font-medium">{menuStats.products}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-6 h-6" />
                      Publicar Loja
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setCurrentStep('menu')}
                  className="text-slate-500 hover:text-slate-700 text-sm"
                >
                  Voltar e editar cardápio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  step: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  completed: boolean
}

function StepIndicator({ step, label, icon: Icon, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${active ? 'bg-violet-600 text-white' : ''}
          ${completed ? 'bg-green-500 text-white' : ''}
          ${!active && !completed ? 'bg-slate-200 text-slate-500' : ''}
        `}
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-violet-600' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  )
}
