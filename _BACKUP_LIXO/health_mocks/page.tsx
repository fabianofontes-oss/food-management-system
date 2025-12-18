'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, RefreshCw, Loader2, FileQuestion, Clock, Code,
  AlertCircle, CheckCircle, XCircle, ArrowRight, ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MockItem {
  path: string
  name: string
  type: 'placeholder_page' | 'coming_soon' | 'mock_data' | 'incomplete' | 'hardcoded'
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface MocksData {
  stats: {
    total: number
    byType: Record<string, number>
    byPriority: Record<string, number>
  }
  byPriority: {
    high: MockItem[]
    medium: MockItem[]
    low: MockItem[]
  }
  all: MockItem[]
}

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  placeholder_page: { label: 'Página Placeholder', color: 'bg-red-100 text-red-700', icon: FileQuestion },
  coming_soon: { label: 'Em Breve', color: 'bg-amber-100 text-amber-700', icon: Clock },
  incomplete: { label: 'Incompleto', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  hardcoded: { label: 'Hardcoded', color: 'bg-purple-100 text-purple-700', icon: Code },
  mock_data: { label: 'Dados Mock', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  dead_button: { label: 'Botão Morto', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  dead_link: { label: 'Link Quebrado', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
}

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  high: { label: 'Alta', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  medium: { label: 'Média', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  low: { label: 'Baixa', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle }
}

export default function MocksPage() {
  const [data, setData] = useState<MocksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch('/api/health/mocks')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao carregar mocks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredItems = data?.all.filter(item => {
    if (filter === 'all') return true
    return item.priority === filter
  }) || []

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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mocks & Placeholders</h1>
              <p className="text-slate-600">{data?.stats.total} itens identificados que precisam de atenção</p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{data.stats.byPriority.high}</p>
                <p className="text-sm text-gray-500">Prioridade Alta</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{data.stats.byPriority.medium}</p>
                <p className="text-sm text-gray-500">Prioridade Média</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{data.stats.byPriority.low}</p>
                <p className="text-sm text-gray-500">Prioridade Baixa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'high', label: '🔴 Alta' },
            { value: 'medium', label: '🟡 Média' },
            { value: 'low', label: '🟢 Baixa' }
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

        {/* Lista de Mocks */}
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const typeConf = typeConfig[item.type]
            const prioConf = priorityConfig[item.priority]
            const TypeIcon = typeConf.icon
            const PrioIcon = prioConf.icon

            return (
              <Card key={idx} className={`border-l-4 ${
                item.priority === 'high' ? 'border-l-red-500' :
                item.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${prioConf.color}`}>
                          {prioConf.label}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {item.path}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Legenda */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-700 mb-3">Tipos de Mock/Placeholder</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Página Placeholder</span>
                <span>Página existe mas exibe apenas "Em breve"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Em Breve</span>
                <span>Funcionalidade anunciada mas não implementada</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Incompleto</span>
                <span>Funciona parcialmente, falta algo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Hardcoded</span>
                <span>Dados não persistem no banco</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs">Botão Morto</span>
                <span>Botão não faz nada ao clicar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Link Quebrado</span>
                <span>Link leva a página inexistente</span>
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
