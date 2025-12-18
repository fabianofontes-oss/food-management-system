'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, CheckCircle, XCircle, AlertCircle, Lock, Globe,
  RefreshCw, Loader2, ChevronDown, ChevronUp, ExternalLink,
  Building2, Store, Users, ShoppingCart, Settings, LayoutDashboard
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PageInfo {
  path: string
  name: string
  category: string
  requiresAuth: boolean
  requiresSlug: boolean
}

interface CategoryGroup {
  category: string
  pages: PageInfo[]
  count: number
}

interface PagesData {
  stats: {
    total: number
    public: number
    protected: number
    withSlug: number
    categories: number
  }
  categories: CategoryGroup[]
}

const categoryIcons: Record<string, any> = {
  'Autenticação': Lock,
  'Público': Globe,
  'Super Admin': Building2,
  'Loja Cliente': ShoppingCart,
  'Dashboard Lojista': LayoutDashboard,
  'Configurações Loja': Settings
}

const categoryColors: Record<string, string> = {
  'Autenticação': 'bg-blue-100 text-blue-700 border-blue-200',
  'Público': 'bg-green-100 text-green-700 border-green-200',
  'Super Admin': 'bg-purple-100 text-purple-700 border-purple-200',
  'Loja Cliente': 'bg-amber-100 text-amber-700 border-amber-200',
  'Dashboard Lojista': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Configurações Loja': 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function PagesHealthPage() {
  const [data, setData] = useState<PagesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'public' | 'protected'>('all')

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch('/api/health/pages')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao carregar páginas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function toggleCategory(category: string) {
    const newSet = new Set(expandedCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    setExpandedCategories(newSet)
  }

  function expandAll() {
    if (data) {
      setExpandedCategories(new Set(data.categories.map(c => c.category)))
    }
  }

  function collapseAll() {
    setExpandedCategories(new Set())
  }

  const filteredCategories = data?.categories.map(cat => ({
    ...cat,
    pages: cat.pages.filter(p => {
      if (filter === 'all') return true
      if (filter === 'public') return !p.requiresAuth
      if (filter === 'protected') return p.requiresAuth
      return true
    })
  })).filter(cat => cat.pages.length > 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mapa de Páginas</h1>
              <p className="text-slate-600">Todas as {data?.stats.total} páginas do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={expandAll} variant="outline" size="sm">
              Expandir Tudo
            </Button>
            <Button onClick={collapseAll} variant="outline" size="sm">
              Recolher Tudo
            </Button>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
                <p className="text-sm text-gray-500">Total de Páginas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{data.stats.public}</p>
                <p className="text-sm text-gray-500">Públicas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{data.stats.protected}</p>
                <p className="text-sm text-gray-500">Protegidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{data.stats.withSlug}</p>
                <p className="text-sm text-gray-500">Com Slug</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-indigo-600">{data.stats.categories}</p>
                <p className="text-sm text-gray-500">Categorias</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'public', label: 'Públicas' },
            { value: 'protected', label: 'Protegidas' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Categorias */}
        <div className="space-y-4">
          {filteredCategories?.map((cat) => {
            const Icon = categoryIcons[cat.category] || FileText
            const colorClass = categoryColors[cat.category] || 'bg-gray-100 text-gray-700 border-gray-200'
            const isExpanded = expandedCategories.has(cat.category)

            return (
              <Card key={cat.category} className="overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${colorClass}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-bold">{cat.category}</span>
                    <span className="text-sm opacity-75">({cat.pages.length} páginas)</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {isExpanded && (
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {cat.pages.map((page, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            {page.requiresAuth ? (
                              <Lock className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Globe className="w-4 h-4 text-green-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{page.name}</p>
                              <code className="text-xs text-gray-500">{page.path}</code>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {page.requiresSlug && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                Dinâmica
                              </span>
                            )}
                            {!page.requiresAuth && !page.requiresSlug && (
                              <Link 
                                href={page.path} 
                                target="_blank"
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Legenda */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-700 mb-3">Legenda</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-500" />
                <span>Página Pública</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Requer Login</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Dinâmica</span>
                <span>Precisa de slug (ex: /loja-demo/...)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/admin/health" className="text-blue-600 hover:underline">
            ← Voltar para Saúde do Sistema
          </Link>
        </div>
      </div>
    </div>
  )
}
