import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface StoreDebugInfo {
  id: string
  name: string
  slug: string
  niche_slug: string | null
  logo_url: string | null
  menu_theme: any
  productCount: number
  categoryCount: number
  primaryColor: string
}

export default async function DebugPage() {
  const supabase = await createClient()

  const { data: stores, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-700 mb-4">❌ Erro ao carregar lojas</h1>
          <pre className="bg-red-100 p-4 rounded-lg text-red-800 text-sm">{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    )
  }

  const storesWithDetails: StoreDebugInfo[] = await Promise.all(
    (stores || []).map(async (store: any) => {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
        supabase.from('categories').select('id', { count: 'exact' }).eq('store_id', store.id)
      ])

      const menuTheme = store.menu_theme || {}
      const primaryColor = menuTheme?.colors?.primary || '#8B5CF6'

      return {
        id: store.id,
        name: store.name || 'Sem nome',
        slug: store.slug || 'sem-slug',
        niche_slug: store.niche_slug || null,
        logo_url: store.logo_url || null,
        menu_theme: store.menu_theme,
        productCount: productsResult.count || 0,
        categoryCount: categoriesResult.count || 0,
        primaryColor
      }
    })
  )

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/health" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">🔍 Debug de Lojas</h1>
          <p className="text-slate-600">Visualize todas as lojas e suas configurações.</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-violet-600">{storesWithDetails.length}</div>
            <div className="text-slate-600">Lojas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">
              {storesWithDetails.reduce((acc, s) => acc + s.productCount, 0)}
            </div>
            <div className="text-slate-600">Produtos</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-amber-600">
              {storesWithDetails.reduce((acc, s) => acc + s.categoryCount, 0)}
            </div>
            <div className="text-slate-600">Categorias</div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Loja</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nicho</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Layout</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Prod</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Cat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storesWithDetails.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: store.primaryColor }}
                        >
                          {store.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{store.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{store.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a 
                        href={`/${store.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-mono text-sm bg-violet-50 px-2 py-1 rounded"
                      >
                        /{store.slug}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      {store.niche_slug ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {store.niche_slug}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {store.menu_theme?.layout || 'classic'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: store.primaryColor }}
                        />
                        <span className="font-mono text-xs text-slate-600">{store.primaryColor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        store.productCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {store.productCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        store.categoryCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {store.categoryCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* JSON Debug */}
        <details className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <summary className="px-6 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 font-semibold text-slate-700">
            🛠️ JSON Completo
          </summary>
          <div className="p-4 bg-slate-900 overflow-auto max-h-96">
            <pre className="text-xs text-emerald-400 font-mono">
              {JSON.stringify(storesWithDetails, null, 2)}
            </pre>
          </div>
        </details>

        <div className="mt-8 text-center text-sm text-slate-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
