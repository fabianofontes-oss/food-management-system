'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, RefreshCw, Loader2, AlertTriangle, XCircle, CheckCircle,
  Info, Building2, Store, Package, ShoppingCart, FileText, Users, Tag,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AuditItem {
  category: string
  name: string
  description: string
  count: number
  severity: 'critical' | 'warning' | 'info'
  action?: string
}

interface AuditData {
  stats: {
    total: number
    critical: number
    warning: number
    info: number
    totalIssues: number
  }
  byCategory: {
    category: string
    items: AuditItem[]
    totalIssues: number
  }[]
  all: AuditItem[]
}

const severityConfig = {
  critical: { label: 'Crítico', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
  warning: { label: 'Atenção', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  info: { label: 'Info', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Info }
}

const categoryIcons: Record<string, any> = {
  'Tenants': Building2,
  'Lojas': Store,
  'Produtos': Package,
  'Pedidos': ShoppingCart,
  'Faturas': FileText,
  'Usuários': Users,
  'Categorias': Tag
}

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch('/api/health/audit')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredItems = data?.all.filter(item => {
    if (filter === 'all') return true
    return item.severity === filter
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Auditando sistema...</p>
          <p className="text-sm text-gray-400 mt-2">Verificando todas as tabelas...</p>
        </div>
      </div>
    )
  }

  const hasIssues = (data?.stats.totalIssues || 0) > 0
  const hasCritical = (data?.stats.critical || 0) > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              hasCritical ? 'bg-gradient-to-br from-red-500 to-rose-600' :
              hasIssues ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
              'bg-gradient-to-br from-green-500 to-emerald-600'
            }`}>
              <Search className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Auditoria Completa</h1>
              <p className="text-slate-600">
                {hasIssues 
                  ? `${data?.stats.totalIssues} problemas encontrados` 
                  : 'Nenhum problema encontrado!'}
              </p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Auditar Novamente
          </Button>
        </div>

        {/* Status Geral */}
        {!hasIssues ? (
          <Card className="mb-6 border-2 border-green-300 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">Sistema Saudável!</h2>
              <p className="text-green-600">Nenhum problema foi encontrado na auditoria.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{data?.stats.critical || 0}</p>
                  <p className="text-sm text-gray-500">Críticos</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{data?.stats.warning || 0}</p>
                  <p className="text-sm text-gray-500">Atenção</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{data?.stats.info || 0}</p>
                  <p className="text-sm text-gray-500">Info</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{data?.stats.total || 0}</p>
                  <p className="text-sm text-gray-500">Tipos de Problema</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{data?.stats.totalIssues || 0}</p>
                  <p className="text-sm text-gray-500">Total Ocorrências</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-6">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'critical', label: `🔴 Críticos (${data?.stats.critical || 0})` },
                { value: 'warning', label: `🟡 Atenção (${data?.stats.warning || 0})` },
                { value: 'info', label: `🔵 Info (${data?.stats.info || 0})` }
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

            {/* Lista de Problemas */}
            <div className="space-y-4">
              {filteredItems.map((item, idx) => {
                const config = severityConfig[item.severity]
                const Icon = config.icon
                const CatIcon = categoryIcons[item.category] || Package

                return (
                  <Card key={idx} className={`border-l-4 ${
                    item.severity === 'critical' ? 'border-l-red-500' :
                    item.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-1.5 rounded ${config.bg}`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded flex items-center gap-1">
                              <CatIcon className="w-3 h-3" />
                              {item.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.bg} ${config.color}`}>
                              {item.count} {item.count === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                          {item.action && (
                            <p className="text-xs text-blue-600">
                              💡 {item.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* O que foi verificado */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-700 mb-3">🔍 O Que Foi Verificado</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-800 mb-1">Tenants</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Sem email</li>
                  <li>• Sem plano</li>
                  <li>• Suspensos</li>
                  <li>• Trial expirando</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Lojas & Produtos</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Lojas órfãs/inativas</li>
                  <li>• Sem produtos/categorias</li>
                  <li>• Produtos sem preço/imagem</li>
                  <li>• Categorias vazias</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">Pedidos & Faturas</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Pedidos pendentes +24h</li>
                  <li>• Pedidos órfãos</li>
                  <li>• Faturas vencidas</li>
                  <li>• Usuários sem loja</li>
                </ul>
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
