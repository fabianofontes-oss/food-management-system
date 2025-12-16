'use client'

import { useState, useEffect } from 'react'
import { Wand2, Trash2, Store, ArrowLeft, Loader2, Check, AlertTriangle, Palette, Layout, Sparkles, Zap, Database, ChevronRight } from 'lucide-react'
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

const NICHE_IMAGES: Record<string, string[]> = {
  acai: [
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80'
  ],
  pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
  ],
  marmita: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
  ]
}

const DEFAULT_IMAGES = ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80']

export default function BuilderPage() {
  const [stores, setStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [selectedNicheId, setSelectedNicheId] = useState<string>('acai')
  const [loading, setLoading] = useState(true)
  const [clearBeforeApply, setClearBeforeApply] = useState(true)
  const [applying, setApplying] = useState(false)
  const [fixingLayout, setFixingLayout] = useState(false)
  const [fixingColors, setFixingColors] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  let logCounter = 0

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [{ id: ++logCounter, type, message, timestamp: new Date() }, ...prev].slice(0, 50))
  }

  useEffect(() => { loadStores() }, [])

  async function loadStores() {
    const supabase = createClient()
    const { data } = await supabase.from('stores').select('id, name, slug, niche_slug, menu_theme').order('name')
    if (data) {
      setStores(data)
      if (data.length > 0) setSelectedStoreId(data[0].id)
    }
    setLoading(false)
  }

  async function handleApplyKit() {
    if (!selectedStoreId || !selectedNicheId) return toast.error('Selecione uma loja e um kit')
    const template = NICHE_TEMPLATES[selectedNicheId]
    if (!template) return toast.error('Template não encontrado')

    setApplying(true)
    addLog('info', `🚀 Iniciando Kit ${template.name}...`)

    try {
      const supabase = createClient()

      if (clearBeforeApply) {
        addLog('info', '🧹 Limpando dados...')
        await supabase.from('products').delete().eq('store_id', selectedStoreId)
        await supabase.from('categories').delete().eq('store_id', selectedStoreId)
        addLog('success', '✓ Dados removidos')
      }

      addLog('info', '🎨 Aplicando configurações...')
      await supabase.from('stores').update({ 
        menu_theme: {
          layout: 'modern',
          colors: { primary: template.colors.primary, background: template.colors.background, header: '#ffffff' },
          display: { showBanner: true, showLogo: true, showSearch: true, showAddress: true, showSocial: true }
        },
        niche_slug: template.id
      }).eq('id', selectedStoreId)
      addLog('success', `✓ Layout moderno com cor ${template.colors.primary}`)

      addLog('info', '📦 Criando produtos...')
      const images = NICHE_IMAGES[selectedNicheId] || DEFAULT_IMAGES
      let totalProducts = 0, categoryCount = 0

      for (const category of template.categories) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .insert({ store_id: selectedStoreId, name: category.name, description: category.description, sort_order: category.sortOrder, is_active: true })
          .select('id').single()

        if (catError) continue
        categoryCount++

        for (let i = 0; i < category.products.length; i++) {
          const product = category.products[i]
          const { error } = await supabase.from('products').insert({
            store_id: selectedStoreId, category_id: catData.id, name: product.name, description: product.description,
            base_price: product.price, image_url: images[i % images.length], is_active: true, sort_order: product.sortOrder
          })
          if (!error) totalProducts++
        }
      }

      addLog('success', `✓ ${categoryCount} categorias, ${totalProducts} produtos!`)
      addLog('success', `🎉 Kit ${template.name} aplicado!`)
      toast.success(`Kit aplicado! ${totalProducts} produtos criados.`)
      loadStores()
    } catch (error: any) {
      addLog('error', `❌ ${error.message}`)
      toast.error(error.message)
    } finally {
      setApplying(false)
    }
  }

  async function handleFixLayout() {
    if (!selectedStoreId) return
    setFixingLayout(true)
    addLog('info', '🔧 Forçando layout moderno...')
    try {
      const supabase = createClient()
      const store = stores.find(s => s.id === selectedStoreId)
      await supabase.from('stores').update({ 
        menu_theme: { ...store?.menu_theme, layout: 'modern', display: { showBanner: true, showLogo: true, showSearch: true, showAddress: true, showSocial: true } }
      }).eq('id', selectedStoreId)
      addLog('success', '✓ Layout atualizado')
      toast.success('Layout atualizado!')
      loadStores()
    } catch (error: any) {
      addLog('error', `❌ ${error.message}`)
    } finally {
      setFixingLayout(false)
    }
  }

  async function handleFixColors() {
    if (!selectedStoreId) return
    setFixingColors(true)
    addLog('info', '🎨 Corrigindo cores...')
    try {
      const supabase = createClient()
      const store = stores.find(s => s.id === selectedStoreId)
      await supabase.from('stores').update({ 
        menu_theme: { ...store?.menu_theme, colors: { primary: store?.menu_theme?.colors?.primary || '#8B5CF6', background: '#f4f4f5', header: '#ffffff' } }
      }).eq('id', selectedStoreId)
      addLog('success', '✓ Cores definidas')
      toast.success('Cores corrigidas!')
      loadStores()
    } catch (error: any) {
      addLog('error', `❌ ${error.message}`)
    } finally {
      setFixingColors(false)
    }
  }

  async function handleClearStore() {
    if (!selectedStoreId || deleteConfirm !== 'DELETAR') return toast.error('Digite DELETAR')
    setDeleting(true)
    addLog('info', '🧹 Limpando loja...')
    try {
      const supabase = createClient()
      const { data: orders } = await supabase.from('orders').select('id').eq('store_id', selectedStoreId)
      if (orders?.length) await supabase.from('order_items').delete().in('order_id', orders.map((o: any) => o.id))
      await supabase.from('orders').delete().eq('store_id', selectedStoreId)
      await supabase.from('products').delete().eq('store_id', selectedStoreId)
      await supabase.from('categories').delete().eq('store_id', selectedStoreId)
      setDeleteConfirm('')
      addLog('success', '✓ Loja limpa!')
      toast.success('Loja limpa!')
      loadStores()
    } catch (error: any) {
      addLog('error', `❌ ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId)
  const selectedNiche = NICHE_LIST.find(n => n.id === selectedNicheId)

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/health" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">🧠 Kit Preguiçoso Builder</h1>
          <p className="text-slate-600">Aplique templates completos em segundos.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Seletores */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-violet-500" />Selecionar Alvo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Loja</label>
                  <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                    {stores.map(store => <option key={store.id} value={store.id}>{store.name} (/{store.slug})</option>)}
                  </select>
                  {selectedStore && <p className="mt-2 text-xs text-slate-500">Layout: {selectedStore.menu_theme?.layout || 'classic'}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Kit/Nicho</label>
                  <select value={selectedNicheId} onChange={(e) => setSelectedNicheId(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                    {NICHE_LIST.map(niche => <option key={niche.id} value={niche.id}>{niche.name} ({niche.productsCount} produtos)</option>)}
                  </select>
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
                  <h2 className="text-xl font-bold text-slate-800 mb-1">🧨 Aplicar Kit Completo</h2>
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input type="checkbox" checked={clearBeforeApply} onChange={(e) => setClearBeforeApply(e.target.checked)} className="w-4 h-4 text-violet-600 rounded" />
                    <span className="text-sm text-slate-700">🧹 Zerar antes</span>
                  </label>
                  <button onClick={handleApplyKit} disabled={applying} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 ${applying ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'}`}>
                    {applying ? <><Loader2 className="w-6 h-6 animate-spin" />Aplicando...</> : <><Wand2 className="w-6 h-6" />Aplicar Kit {selectedNiche?.name}<ChevronRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            </div>

            {/* Ações de Reparo */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />🛠️ Ações de Reparo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleFixLayout} disabled={fixingLayout} className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-3">
                  {fixingLayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layout className="w-5 h-5" />}
                  <div className="text-left"><div className="font-semibold">Forçar Layout Moderno</div></div>
                </button>
                <button onClick={handleFixColors} disabled={fixingColors} className="p-4 rounded-xl border-2 bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 flex items-center gap-3">
                  {fixingColors ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
                  <div className="text-left"><div className="font-semibold">Corrigir Cores</div></div>
                </button>
              </div>
            </div>

            {/* Limpar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
              <h2 className="font-bold text-red-700 mb-4 flex items-center gap-2"><Trash2 className="w-5 h-5" />🧹 Limpar Loja</h2>
              <div className="flex gap-3">
                <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())} placeholder='Digite "DELETAR"' className="flex-1 px-4 py-3 border border-red-300 rounded-xl text-center font-mono" />
                <button onClick={handleClearStore} disabled={deleting || deleteConfirm !== 'DELETAR'} className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${deleteConfirm === 'DELETAR' && !deleting ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200 text-slate-400'}`}>
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Log */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-4 shadow-lg sticky top-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-400" />Log</h3>
              <div className="h-[500px] overflow-y-auto font-mono text-xs space-y-1">
                {logs.length === 0 ? <p className="text-slate-500 text-center py-8">Nenhuma ação...</p> : logs.map(log => (
                  <div key={log.id} className={`p-2 rounded ${log.type === 'success' ? 'text-emerald-400 bg-emerald-500/10' : log.type === 'error' ? 'text-red-400 bg-red-500/10' : 'text-slate-400'}`}>
                    <span className="text-slate-600">{log.timestamp.toLocaleTimeString('pt-BR')}</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800"><strong>Atenção:</strong> Ferramentas de desenvolvimento. As ações são irreversíveis.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
