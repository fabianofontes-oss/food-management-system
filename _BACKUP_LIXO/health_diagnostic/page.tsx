'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle, Settings,
  Database, Zap, CreditCard, Building2, Smartphone, Globe, Printer,
  Truck, ShoppingCart, ChefHat, Users, Gauge, ArrowLeft, Wrench
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FeatureStatus {
  id: string
  name: string
  category: string
  status: 'working' | 'broken' | 'incomplete' | 'not_configured'
  message: string
  details?: string[]
  fixAction?: string
}

interface DiagnosticResult {
  timestamp: string
  summary: {
    total: number
    working: number
    broken: number
    incomplete: number
    notConfigured: number
    healthScore: number
  }
  features: FeatureStatus[]
  byCategory: {
    category: string
    features: FeatureStatus[]
    score: number
  }[]
}

const statusConfig = {
  working: { 
    label: 'Funcionando', 
    color: 'text-green-600', 
    bg: 'bg-green-50 border-green-200',
    badgeBg: 'bg-green-100 text-green-700',
    icon: CheckCircle 
  },
  broken: { 
    label: 'Quebrado', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    badgeBg: 'bg-red-100 text-red-700',
    icon: XCircle 
  },
  incomplete: { 
    label: 'Incompleto', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50 border-yellow-200',
    badgeBg: 'bg-yellow-100 text-yellow-700',
    icon: AlertTriangle 
  },
  not_configured: { 
    label: 'Não Configurado', 
    color: 'text-gray-500', 
    bg: 'bg-gray-50 border-gray-200',
    badgeBg: 'bg-gray-100 text-gray-600',
    icon: Settings 
  }
}

const categoryIcons: Record<string, any> = {
  'Infraestrutura': Database,
  'Banco de Dados': Database,
  'Funcionalidades': Zap,
  'Integrações': Globe,
  'Super Admin': Building2
}

export default function DiagnosticPage() {
  const [data, setData] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'working' | 'broken' | 'incomplete' | 'not_configured'>('all')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch('/api/health/diagnostic')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao carregar diagnóstico:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Diagnosticando Sistema...</p>
          <p className="text-slate-400 text-sm mt-2">Verificando todas as funcionalidades</p>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-amber-600'
    if (score >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-rose-600'
  }

  const filteredFeatures = data?.features.filter(f => {
    if (filter === 'all') return true
    return f.status === filter
  }) || []

  // Separar features problemáticas
  const brokenFeatures = data?.features.filter(f => f.status === 'broken') || []
  const incompleteFeatures = data?.features.filter(f => f.status === 'incomplete') || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header com Score */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/health" className="p-2 rounded-lg hover:bg-slate-700 text-slate-400">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Gauge className="w-7 h-7 text-blue-400" />
                  Diagnóstico do Sistema
                </h1>
                <p className="text-slate-400 text-sm">Verificação automática de todas as funcionalidades</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {data && (
                <div className={`text-4xl font-bold ${getScoreColor(data.summary.healthScore)}`}>
                  {data.summary.healthScore}%
                </div>
              )}
              <Button 
                onClick={loadData} 
                disabled={loading} 
                variant="outline" 
                className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {data && (
          <>
            {/* Score Visual Grande */}
            <div className={`mb-8 p-8 rounded-3xl bg-gradient-to-r ${getScoreBg(data.summary.healthScore)} shadow-2xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {data.summary.healthScore >= 80 ? '🚀 Sistema Saudável' :
                     data.summary.healthScore >= 60 ? '⚠️ Precisa de Atenção' :
                     data.summary.healthScore >= 40 ? '🔧 Vários Problemas' :
                     '🚨 Sistema Crítico'}
                  </h2>
                  <p className="text-white/80">
                    {data.summary.working} de {data.summary.total} funcionalidades operando normalmente
                  </p>
                </div>
                <div className="text-8xl font-bold text-white/30">
                  {data.summary.healthScore}%
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-3xl font-bold text-green-400">{data.summary.working}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Funcionando</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-3xl font-bold text-red-400">{data.summary.broken}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Quebrados</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-3xl font-bold text-yellow-400">{data.summary.incomplete}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Incompletos</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span className="text-3xl font-bold text-slate-400">{data.summary.notConfigured}</span>
                  </div>
                  <p className="text-slate-400 text-sm">Não Configurados</p>
                </CardContent>
              </Card>
            </div>

            {/* Problemas a Resolver (se houver) */}
            {(brokenFeatures.length > 0 || incompleteFeatures.length > 0) && (
              <Card className="bg-slate-800 border-red-500/50 mb-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <Wrench className="w-6 h-6" />
                    Problemas a Resolver ({brokenFeatures.length + incompleteFeatures.length})
                  </h3>
                  <div className="space-y-3">
                    {brokenFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-900/30 rounded-lg border border-red-700/50">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="font-medium text-white">{feature.name}</p>
                            <p className="text-sm text-red-300">{feature.message}</p>
                          </div>
                        </div>
                        {feature.fixAction && (
                          <span className="text-xs bg-red-800 text-red-200 px-3 py-1 rounded-full">
                            {feature.fixAction}
                          </span>
                        )}
                      </div>
                    ))}
                    {incompleteFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium text-white">{feature.name}</p>
                            <p className="text-sm text-yellow-300">{feature.message}</p>
                          </div>
                        </div>
                        {feature.fixAction && (
                          <span className="text-xs bg-yellow-800 text-yellow-200 px-3 py-1 rounded-full">
                            {feature.fixAction}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Por Categoria */}
            <div className="space-y-4">
              {data.byCategory.map((cat, catIdx) => {
                const CatIcon = categoryIcons[cat.category] || Zap
                const isExpanded = expandedCategory === cat.category

                return (
                  <Card key={catIdx} className="bg-slate-800 border-slate-700 overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${cat.score >= 80 ? 'bg-green-900/50' : cat.score >= 50 ? 'bg-yellow-900/50' : 'bg-red-900/50'}`}>
                          <CatIcon className={`w-5 h-5 ${cat.score >= 80 ? 'text-green-400' : cat.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-white">{cat.category}</h3>
                          <p className="text-sm text-slate-400">{cat.features.length} itens verificados</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {cat.features.map((f, i) => (
                            <div
                              key={i}
                              className={`w-2 h-8 rounded-full ${
                                f.status === 'working' ? 'bg-green-500' :
                                f.status === 'broken' ? 'bg-red-500' :
                                f.status === 'incomplete' ? 'bg-yellow-500' : 'bg-slate-600'
                              }`}
                              title={f.name}
                            />
                          ))}
                        </div>
                        <span className={`text-2xl font-bold ${getScoreColor(cat.score)}`}>
                          {cat.score}%
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-700 p-4 space-y-2">
                        {cat.features.map((feature, fIdx) => {
                          const config = statusConfig[feature.status]
                          const Icon = config.icon
                          return (
                            <div key={fIdx} className={`flex items-center justify-between p-3 rounded-lg ${config.bg} border`}>
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <div>
                                  <p className="font-medium text-slate-800">{feature.name}</p>
                                  <p className="text-sm text-slate-600">{feature.message}</p>
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${config.badgeBg}`}>
                                {config.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Timestamp */}
            <div className="mt-8 text-center text-slate-500 text-sm">
              Última verificação: {new Date(data.timestamp).toLocaleString('pt-BR')}
              <br />
              Auto-refresh a cada 60 segundos
            </div>
          </>
        )}
      </div>
    </div>
  )
}
