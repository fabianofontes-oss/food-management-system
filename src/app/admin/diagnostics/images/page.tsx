import { createClient } from '@/lib/supabase/server'
import { Camera, AlertTriangle, CheckCircle, ArrowLeft, Upload, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ImageUploadButton } from './image-upload-button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Scanner de Imagens | Diagnósticos',
  description: 'Verificar produtos sem imagem'
}

interface ProductWithoutImage {
  id: string
  name: string
  image_url: string | null
  store_id: string
  store_name: string
  store_slug: string
}

async function getProductsWithoutImages() {
  const supabase = await createClient()

  // Buscar produtos sem imagem ou com imagem vazia
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      image_url,
      store_id,
      stores!inner (
        name,
        slug
      )
    `)
    .or('image_url.is.null,image_url.eq.')
    .order('name')

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return { products: [], error: error.message }
  }

  // Formatar dados
  const formattedProducts: ProductWithoutImage[] = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    store_id: p.store_id,
    store_name: p.stores?.name || 'Loja desconhecida',
    store_slug: p.stores?.slug || ''
  }))

  return { products: formattedProducts, error: null }
}

async function getTotalProducts() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
  return count || 0
}

export default async function ImagesPage() {
  const [{ products, error }, totalProducts] = await Promise.all([
    getProductsWithoutImages(),
    getTotalProducts()
  ])

  const productsWithImages = totalProducts - products.length
  const percentage = totalProducts > 0 
    ? Math.round((productsWithImages / totalProducts) * 100) 
    : 100

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
            <div className="p-2 bg-violet-100 rounded-xl">
              <Camera className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">📸 Scanner de Imagens</h1>
          </div>
          <p className="text-slate-600">
            Produtos sem foto ou com links quebrados.
          </p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-slate-800">{totalProducts}</div>
            <div className="text-slate-600">Total de Produtos</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className={`text-3xl font-bold ${products.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {products.length}
            </div>
            <div className="text-slate-600">Sem Imagem</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">{percentage}%</div>
            <div className="text-slate-600">Com Imagem</div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Erro ao carregar dados</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Tudo certo!</h3>
            <p className="text-emerald-600">Todos os produtos possuem imagem cadastrada.</p>
          </div>
        ) : (
          /* Tabela de Produtos */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-red-700">
                  {products.length} produto{products.length > 1 ? 's' : ''} sem imagem
                </h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Loja
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Sem Foto
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{product.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{product.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700">{product.store_name}</span>
                          {product.store_slug && (
                            <Link 
                              href={`/${product.store_slug}`}
                              target="_blank"
                              className="text-violet-500 hover:text-violet-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ImageUploadButton productId={product.id} productName={product.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Última verificação: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
