'use client'

import { useState, useEffect } from 'react'
import { Camera, ArrowLeft, AlertTriangle, CheckCircle, Upload, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ProductWithoutImage {
  id: string
  name: string
  store_name: string
}

export default function ImagesPage() {
  const [products, setProducts] = useState<ProductWithoutImage[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    
    const [productsResult, totalResult] = await Promise.all([
      supabase.from('products').select('id, name, store_id, stores!inner(name)').or('image_url.is.null,image_url.eq.').order('name'),
      supabase.from('products').select('id', { count: 'exact', head: true })
    ])

    setProducts((productsResult.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      store_name: p.stores?.name || 'Loja'
    })))
    setTotalProducts(totalResult.count || 0)
    setLoading(false)
  }

  async function handleUpload(productId: string, file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Selecione uma imagem')
    if (file.size > 5 * 1024 * 1024) return toast.error('Máximo 5MB')

    setUploading(productId)
    try {
      const supabase = createClient()
      const fileName = `${productId}-${Date.now()}.${file.name.split('.').pop()}`
      
      const { error: uploadError } = await supabase.storage.from('images').upload(`products/${fileName}`, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`products/${fileName}`)
      
      const { error: updateError } = await supabase.from('products').update({ image_url: publicUrl }).eq('id', productId)
      if (updateError) throw updateError

      toast.success('Imagem enviada!')
      loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(null)
    }
  }

  const percentage = totalProducts > 0 ? Math.round(((totalProducts - products.length) / totalProducts) * 100) : 100

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/health" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">📸 Scanner de Imagens</h1>
          <p className="text-slate-600">Produtos sem foto.</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-slate-800">{totalProducts}</div>
            <div className="text-slate-600">Total</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className={`text-3xl font-bold ${products.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{products.length}</div>
            <div className="text-slate-600">Sem Imagem</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{percentage}%</div>
            <div className="text-slate-600">Com Imagem</div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Tudo certo!</h3>
            <p className="text-emerald-600">Todos os produtos possuem imagem.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-red-700">{products.length} produto(s) sem imagem</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.store_name}</div>
                    </div>
                  </div>
                  <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${uploading === product.id ? 'bg-slate-100 text-slate-400' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                    {uploading === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading === product.id ? 'Enviando...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading === product.id} onChange={(e) => e.target.files?.[0] && handleUpload(product.id, e.target.files[0])} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-500">Última verificação: {new Date().toLocaleString('pt-BR')}</div>
      </div>
    </div>
  )
}
