'use client'

import { useState, useEffect } from 'react'
import { 
  Wand2, Trash2, Store, ArrowLeft, Loader2, Check, 
  AlertTriangle, Palette, Layout, Sparkles, Zap, 
  Database, Package, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { NICHE_TEMPLATES, NICHE_LIST } from '@/lib/templates/niche-data'

interface StoreOption {
  id: string
  name: string
  slug: string
  niche_slug?: string
  menu_theme?: any
}

interface LogEntry {
  id: number
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  timestamp: Date
}

// Imagens do Unsplash para cada nicho
const NICHE_IMAGES: Record<string, string[]> = {
  acai: [
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553530666-ba11a90a0868?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1588710929895-6aa5a7322923?auto=format&fit=crop&w=800&q=80'
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80'
  ],
  pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80'
  ],
  marmita: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80'
  ]
}

// Fallback images
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80'
]

export default function BuilderPage() {
  const [stores, setStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [selectedNicheId, setSelectedNicheId] = useState<string>('acai')
  const [loading, setLoading] = useState(true)
  const [clearBeforeApply, setClearBeforeApply] = useState(true)
  
  // Estados das ações
  const [applying, setApplying] = useState(false)
  const [fixingLayout, setFixingLayout] = useState(false)
  const [fixingColors, setFixingColors] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  
  // Log de ações
  const [logs, setLogs] = useState<LogEntry[]>([])
  let logCounter = 0

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [{
      id: ++logCounter,
      type,
      message,
      timestamp: new Date()
    }, ...prev].slice(0, 50))
  }

  useEffect(() => {
    loadStores()
  }, [])

  async function loadStores() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug, niche_slug, menu_theme')
      .order('name')

    if (!error && data) {
      setStores(data)
      if (data.length > 0) {
        setSelectedStoreId(data[0].id)
      }
    }
    setLoading(false)
  }

  // ============================================
  // 🪄 APLICAR KIT PREGUIÇOSO COMPLETO
  // ============================================
  async function handleApplyKit() {
    if (!selectedStoreId || !selectedNicheId) {
      toast.error('Selecione uma loja e um kit')
      return
    }

    const template = NICHE_TEMPLATES[selectedNicheId]
    if (!template) {
      toast.error('Template não encontrado')
      return
    }

    setApplying(true)
    addLog('info', `🚀 Iniciando aplicação do Kit ${template.name}...`)

    try {
      const supabase = createClient()

      // 1. Limpar dados existentes (se marcado)
      if (clearBeforeApply) {
        addLog('info', '🧹 Limpando dados existentes...')
        
        // Deletar produtos
        await supabase.from('products').delete().eq('store_id', selectedStoreId)
        // Deletar categorias
        await supabase.from('categories').delete().eq('store_id', selectedStoreId)
        
        addLog('success', '✓ Dados antigos removidos')
      }

      // 2. Atualizar configurações da loja
      addLog('info', '🎨 Aplicando configurações visuais...')
      
      const menuTheme = {
        layout: 'modern',
        colors: {
          primary: template.colors.primary,
          background: template.colors.background,
          header: '#ffffff'
        },
        display: {
          showBanner: true,
          showLogo: true,
          showSearch: true,
          showAddress: true,
          showSocial: true
        }
      }

      await supabase
        .from('stores')
        .update({ 
          menu_theme: menuTheme,
          niche_slug: template.id
        })
        .eq('id', selectedStoreId)

      addLog('success', `✓ Layout moderno aplicado com cor ${template.colors.primary}`)

      // 3. Criar categorias e produtos
      addLog('info', '📦 Criando categorias e produtos...')
      
      const images = NICHE_IMAGES[selectedNicheId] || DEFAULT_IMAGES
      let totalProducts = 0
      let categoryCount = 0

      for (const category of template.categories) {
        // Criar categoria
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .insert({
            store_id: selectedStoreId,
            name: category.name,
            description: category.description,
            sort_order: category.sortOrder,
            is_active: true,
            color: getCategoryColor(category.sortOrder)
          })
          .select('id')
          .single()

        if (catError) {
          addLog('error', `❌ Erro ao criar categoria: ${catError.message}`)
          continue
        }

        categoryCount++

        // Criar produtos da categoria
        for (let i = 0; i < category.products.length; i++) {
          const product = category.products[i]
          const imageUrl = images[i % images.length]

          const { error: prodError } = await supabase
            .from('products')
            .insert({
              store_id: selectedStoreId,
              category_id: catData.id,
              name: product.name,
              description: product.description,
              base_price: product.price,
              image_url: imageUrl,
              is_active: true,
              sort_order: product.sortOrder
            })

          if (!prodError) {
            totalProducts++
          }
        }
      }

      addLog('success', `✓ ${categoryCount} categorias e ${totalProducts} produtos criados!`)
      addLog('success', `🎉 Kit ${template.name} aplicado com sucesso!`)
      
      toast.success(`Kit ${template.name} aplicado! ${totalProducts} produtos criados.`)
      
      // Recarregar lojas
      loadStores()

    } catch (error: any) {
      console.error('Erro ao aplicar kit:', error)
      addLog('error', `❌ Erro: ${error.message}`)
      toast.error(error.message || 'Erro ao aplicar kit')
    } finally {
      setApplying(false)
    }
  }

  // ============================================
  // 🛠️ FORÇAR LAYOUT MODERNO
  // ============================================
  async function handleFixLayout() {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja')
      return
    }

    setFixingLayout(true)
    addLog('info', '🔧 Forçando layout moderno...')

    try {
      const supabase = createClient()
      const store = stores.find(s => s.id === selectedStoreId)
      const currentTheme = store?.menu_theme || {}

      const newTheme = {
        ...currentTheme,
        layout: 'modern',
        display: {
          showBanner: true,
          showLogo: true,
          showSearch: true,
          showAddress: true,
          showSocial: true,
          ...(currentTheme.display || {})
        }
      }

      await supabase
        .from('stores')
        .update({ menu_theme: newTheme })
        .eq('id', selectedStoreId)

      addLog('success', '✓ Layout atualizado para "modern"')
      toast.success('Layout atualizado!')
      loadStores()

    } catch (error: any) {
      addLog('error', `❌ Erro: ${error.message}`)
      toast.error(error.message)
    } finally {
      setFixingLayout(false)
    }
  }

  // ============================================
  // 🎨 CORRIGIR CORES
  // ============================================
  async function handleFixColors() {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja')
      return
    }

    setFixingColors(true)
    addLog('info', '🎨 Corrigindo cores...')

    try {
      const supabase = createClient()
      const store = stores.find(s => s.id === selectedStoreId)
      const currentTheme = store?.menu_theme || {}

      const newTheme = {
        ...currentTheme,
        colors: {
          primary: currentTheme.colors?.primary || '#8B5CF6',
          background: currentTheme.colors?.background || '#f4f4f5',
          header: currentTheme.colors?.header || '#ffffff'
        }
      }

      await supabase
        .from('stores')
        .update({ menu_theme: newTheme })
        .eq('id', selectedStoreId)

      addLog('success', `✓ Cores definidas: ${newTheme.colors.primary}`)
      toast.success('Cores corrigidas!')
      loadStores()

    } catch (error: any) {
      addLog('error', `❌ Erro: ${error.message}`)
      toast.error(error.message)
    } finally {
      setFixingColors(false)
    }
  }

  // ============================================
  // 🧹 LIMPAR LOJA
  // ============================================
  async function handleClearStore() {
    if (!selectedStoreId || deleteConfirm !== 'DELETAR') {
      toast.error('Digite DELETAR para confirmar')
      return
    }

    setDeleting(true)
    addLog('info', '🧹 Iniciando limpeza da loja...')

    try {
      const supabase = createClient()

      // Deletar order_items via orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', selectedStoreId)

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o: any) => o.id)
        await supabase.from('order_items').delete().in('order_id', orderIds)
        addLog('info', `✓ ${orders.length} pedidos limpos`)
      }

      await supabase.from('orders').delete().eq('store_id', selectedStoreId)
      await supabase.from('products').delete().eq('store_id', selectedStoreId)
      await supabase.from('categories').delete().eq('store_id', selectedStoreId)

      setDeleteConfirm('')
      addLog('success', '✓ Loja limpa com sucesso!')
      toast.success('Loja limpa!')
      loadStores()

    } catch (error: any) {
      addLog('error', `❌ Erro: ${error.message}`)
      toast.error(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId)
  const selectedNiche = NICHE_LIST.find(n => n.id === selectedNicheId)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/diagnostics"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Diagnósticos
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🧠 Kit Preguiçoso Builder</h1>
          </div>
          <p className="text-slate-600">
            Aplique templates completos em segundos. Escolha a loja, o nicho, e clique em aplicar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seletores */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-violet-500" />
                Selecionar Alvo
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seletor de Loja */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loja
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} (/{store.slug})
                      </option>
                    ))}
                  </select>
                  {selectedStore && (
                    <p className="mt-2 text-xs text-slate-500">
                      Nicho atual: <span className="font-medium">{selectedStore.niche_slug || 'Nenhum'}</span>
                      {' | '}
                      Layout: <span className="font-medium">{selectedStore.menu_theme?.layout || 'classic'}</span>
                    </p>
                  )}
                </div>

                {/* Seletor de Nicho */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kit/Nicho
                  </label>
                  <select
                    value={selectedNicheId}
                    onChange={(e) => setSelectedNicheId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {NICHE_LIST.map(niche => (
                      <option key={niche.id} value={niche.id}>
                        {niche.icon} {niche.name} ({niche.productsCount} produtos)
                      </option>
                    ))}
                  </select>
                  {selectedNiche && (
                    <p className="mt-2 text-xs text-slate-500">
                      {selectedNiche.categoriesCount} categorias, {selectedNiche.productsCount} produtos
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ação Principal */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border-2 border-violet-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    🧨 Aplicar Kit Preguiçoso Completo
                  </h2>
                  <p className="text-slate-600 text-sm mb-4">
                    Aplica configurações visuais, cria categorias e produtos com imagens reais.
                  </p>

                  {/* Checkbox */}
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearBeforeApply}
                      onChange={(e) => setClearBeforeApply(e.target.checked)}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-700">
                      🧹 Zerar produtos/categorias antes de aplicar
                    </span>
                  </label>

                  <button
                    onClick={handleApplyKit}
                    disabled={applying || !selectedStoreId}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                      applying
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Aplicando Kit...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6" />
                        Aplicar Kit {selectedNiche?.name || ''}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Ações de Reparo */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                🛠️ Ações de Reparo (Manutenção)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Forçar Layout */}
                <button
                  onClick={handleFixLayout}
                  disabled={fixingLayout || !selectedStoreId}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                    fixingLayout
                      ? 'bg-slate-100 border-slate-200 text-slate-400'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {fixingLayout ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Layout className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-semibold">Forçar Layout Moderno</div>
                    <div className="text-xs opacity-75">Corrige lojas com layout antigo</div>
                  </div>
                </button>

                {/* Corrigir Cores */}
                <button
                  onClick={handleFixColors}
                  disabled={fixingColors || !selectedStoreId}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                    fixingColors
                      ? 'bg-slate-100 border-slate-200 text-slate-400'
                      : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
                  }`}
                >
                  {fixingColors ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Palette className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <div className="font-semibold">Corrigir Cores</div>
                    <div className="text-xs opacity-75">Define cores padrão se null</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Limpar Loja */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h2 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                🧹 Limpar Loja (Reset)
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Apaga TODOS os dados da loja (produtos, categorias, pedidos). Mantém configurações.
              </p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  placeholder='Digite "DELETAR"'
                  className="flex-1 px-4 py-3 border border-red-300 rounded-xl text-center font-mono focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleClearStore}
                  disabled={deleting || deleteConfirm !== 'DELETAR'}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                    deleteConfirm === 'DELETAR' && !deleting
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {deleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Coluna de Log */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-4 shadow-lg sticky top-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Log de Execução
              </h3>
              <div className="h-[500px] overflow-y-auto font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Nenhuma ação executada ainda...
                  </p>
                ) : (
                  logs.map(log => (
                    <div 
                      key={log.id}
                      className={`p-2 rounded ${
                        log.type === 'success' ? 'text-emerald-400 bg-emerald-500/10' :
                        log.type === 'error' ? 'text-red-400 bg-red-500/10' :
                        log.type === 'warning' ? 'text-amber-400 bg-amber-500/10' :
                        'text-slate-400'
                      }`}
                    >
                      <span className="text-slate-600">
                        {log.timestamp.toLocaleTimeString('pt-BR')}
                      </span>
                      {' '}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Atenção:</strong> Estas são ferramentas de desenvolvimento. 
              O Kit Preguiçoso cria dados reais no banco. Use com cuidado em produção.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper para cores de categoria
function getCategoryColor(sortOrder: number): string {
  const colors = ['purple', 'blue', 'green', 'amber', 'red', 'pink', 'cyan', 'orange']
  return colors[sortOrder % colors.length]
}
