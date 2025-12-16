import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface StoreDebugInfo {
  id: string
  name: string
  slug: string
  niche_slug: string | null
  logo_url: string | null
  settings: any
  menu_theme: any
  productCount: number
  categoryCount: number
  primaryColor: string
}

export default async function DebugPage() {
  const supabase = await createClient()

  // Buscar todas as lojas
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })

  if (storesError) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-700 mb-4">❌ Erro ao carregar lojas</h1>
          <pre className="bg-red-100 p-4 rounded-lg text-red-800 text-sm overflow-auto">
            {JSON.stringify(storesError, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  // Para cada loja, buscar contagem de produtos e categorias
  const storesWithDetails: StoreDebugInfo[] = await Promise.all(
    (stores || []).map(async (store: any) => {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id),
        supabase
          .from('categories')
          .select('id, color', { count: 'exact' })
          .eq('store_id', store.id)
      ])

      // Extrair cor principal de várias fontes possíveis
      const settings = store.settings || {}
      const menuTheme = store.menu_theme || {}
      
      const primaryColor = 
        menuTheme?.colors?.primary ||
        settings?.info?.primaryColor ||
        settings?.primaryColor ||
        '#8B5CF6' // default roxo

      return {
        id: store.id,
        name: store.name || 'Sem nome',
        slug: store.slug || 'sem-slug',
        niche_slug: store.niche_slug || null,
        logo_url: store.logo_url || null,
        settings: store.settings,
        menu_theme: store.menu_theme,
        productCount: productsResult.count || 0,
        categoryCount: categoriesResult.count || 0,
        primaryColor
      }
    })
  )

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">🔍 Diagnóstico do Sistema</h1>
          <p className="text-slate-600">
            Visualize todas as lojas cadastradas e suas configurações salvas.
          </p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-violet-600">{storesWithDetails.length}</div>
            <div className="text-slate-600">Lojas Cadastradas</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-emerald-600">
              {storesWithDetails.reduce((acc, s) => acc + s.productCount, 0)}
            </div>
            <div className="text-slate-600">Total de Produtos</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-amber-600">
              {storesWithDetails.reduce((acc, s) => acc + s.categoryCount, 0)}
            </div>
            <div className="text-slate-600">Total de Categorias</div>
          </div>
        </div>

        {/* Tabela de Lojas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">📋 Lista de Lojas</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    URL (Slug)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nicho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Layout
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Cor Principal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Categorias
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storesWithDetails.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                    {/* Nome da Loja */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {store.logo_url ? (
                          <img 
                            src={store.logo_url} 
                            alt={store.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: store.primaryColor }}
                          >
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">{store.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{store.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* URL/Slug */}
                    <td className="px-4 py-4">
                      <a 
                        href={`${baseUrl}/${store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-mono text-sm bg-violet-50 px-2 py-1 rounded"
                      >
                        /{store.slug}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="mt-1">
                        <a 
                          href={`${baseUrl}/${store.slug}/dashboard`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          → Dashboard
                        </a>
                      </div>
                    </td>
                    
                    {/* Nicho */}
                    <td className="px-4 py-4">
                      {store.niche_slug ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {store.niche_slug}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    
                    {/* Layout */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {store.menu_theme?.layout || 'classic'}
                      </span>
                    </td>
                    
                    {/* Cor Principal */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: store.primaryColor }}
                          title={store.primaryColor}
                        />
                        <span className="font-mono text-xs text-slate-600">
                          {store.primaryColor}
                        </span>
                      </div>
                    </td>
                    
                    {/* Produtos */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        store.productCount > 0 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {store.productCount}
                      </span>
                    </td>
                    
                    {/* Categorias */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        store.categoryCount > 0 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {store.categoryCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {storesWithDetails.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              Nenhuma loja cadastrada ainda.
            </div>
          )}
        </div>

        {/* Detalhes JSON (para debug avançado) */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <details className="group">
            <summary className="px-6 py-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
              <span className="font-semibold text-slate-700">🛠️ JSON Completo (Debug Avançado)</span>
              <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 bg-slate-900 overflow-auto max-h-96">
              <pre className="text-xs text-emerald-400 font-mono">
                {JSON.stringify(storesWithDetails, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  )
}
