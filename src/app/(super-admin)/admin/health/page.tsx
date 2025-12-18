'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Activity, Database, Wrench, Wand2, Camera, Printer, 
  Link2, Heart, ArrowRight, Zap, RefreshCw, CheckCircle,
  AlertCircle, XCircle, Clock, Server, Wifi, HardDrive,
  CreditCard, Shield, Globe, Loader2, Settings, Gauge
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

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  latency?: number
  message?: string
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  version: string
  uptime: number
  checks: HealthCheck[]
  metrics: {
    tenantsCount: number
    storesCount: number
    ordersToday: number
    activeUsers: number
  }
}

const tools = [
  {
    category: '🩺 Diagnóstico & Monitoramento',
    items: [
      {
        title: '🚀 Diagnóstico Automático',
        description: 'Verifica TODAS as funcionalidades e mostra o que está funcionando ou quebrado',
        icon: Zap,
        href: '/admin/health/diagnostic',
        color: 'emerald'
      },
      {
        title: 'Auditoria do Banco',
        description: 'Verifica problemas no banco: tenants, lojas, produtos, pedidos, faturas',
        icon: Activity,
        href: '/admin/health/audit',
        color: 'pink'
      },
      {
        title: 'Health Monitor',
        description: 'Dashboard de integridade de dados (crítico, atenção, status)',
        icon: Activity,
        href: '/admin/health/monitor',
        color: 'emerald'
      },
      {
        title: 'Diagnóstico do Banco',
        description: 'Verificar tabelas, registros e inconsistências no banco de dados',
        icon: Database,
        href: '/admin/health/database',
        color: 'violet'
      },
      {
        title: 'Mapa de Páginas',
        description: 'Todas as 107 páginas do sistema organizadas por categoria',
        icon: Globe,
        href: '/admin/health/pages',
        color: 'blue'
      },
      {
        title: 'Debug de Lojas',
        description: 'Lista todas as lojas com URL, nicho, layout, cor e produtos',
        icon: Database,
        href: '/admin/health/debug',
        color: 'emerald'
      },
      {
        title: 'Mocks & Placeholders',
        description: 'Lista todas as funcionalidades incompletas ou com dados mock',
        icon: Activity,
        href: '/admin/health/mocks',
        color: 'amber'
      },
      {
        title: 'Páginas Grandes',
        description: 'Arquivos que violam a regra de 300 linhas e precisam refatorar',
        icon: Database,
        href: '/admin/health/files',
        color: 'pink'
      }
    ]
  },
  {
    category: '🏗️ Ferramentas de Build',
    items: [
      {
        title: 'Kit Preguiçoso Builder',
        description: 'Aplicar templates completos em lojas (cores, layout, produtos)',
        icon: Wand2,
        href: '/admin/health/builder',
        color: 'purple'
      }
    ]
  },
  {
    category: '🔧 Manutenção & Reparo',
    items: [
      {
        title: 'Scanner de Imagens',
        description: 'Encontrar produtos sem foto e fazer upload rápido',
        icon: Camera,
        href: '/admin/health/images',
        color: 'pink'
      },
      {
        title: 'Validador de URLs',
        description: 'Detectar slugs inválidos e corrigir automaticamente',
        icon: Link2,
        href: '/admin/health/slugs',
        color: 'blue'
      },
      {
        title: 'Teste de Impressora',
        description: 'Testar impressão térmica 80mm e 58mm',
        icon: Printer,
        href: '/admin/health/printing',
        color: 'amber'
      }
    ]
  }
]

const colorClasses: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-emerald-400 hover:shadow-emerald-100'
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    hover: 'hover:border-violet-400 hover:shadow-violet-100'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    hover: 'hover:border-purple-400 hover:shadow-purple-100'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: 'bg-pink-100 text-pink-600',
    hover: 'hover:border-pink-400 hover:shadow-pink-100'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    hover: 'hover:border-blue-400 hover:shadow-blue-100'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    hover: 'hover:border-amber-400 hover:shadow-amber-100'
  }
}

export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  async function checkHealth() {
    setLoading(true)
    try {
      // Carregar ambos em paralelo
      const [healthRes, diagnosticRes] = await Promise.all([
        fetch('/api/health/status'),
        fetch('/api/health/diagnostic')
      ])
      
      const healthData = await healthRes.json()
      const diagnosticData = await diagnosticRes.json()
      
      setHealth(healthData)
      setDiagnostic(diagnosticData)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Erro ao verificar saúde:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    healthy: { label: 'Saudável', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    degraded: { label: 'Degradado', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertCircle },
    down: { label: 'Fora do Ar', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
    unknown: { label: 'Desconhecido', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock }
  }

  const diagnosticStatusConfig = {
    working: { label: 'OK', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
    broken: { label: 'Erro', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
    incomplete: { label: 'Incompleto', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertCircle },
    not_configured: { label: 'Não Config.', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Settings }
  }

  // Problemas que precisam de atenção
  const brokenFeatures = diagnostic?.features.filter(f => f.status === 'broken') || []
  const incompleteFeatures = diagnostic?.features.filter(f => f.status === 'incomplete') || []
  const hasProblems = brokenFeatures.length > 0 || incompleteFeatures.length > 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header com Status Geral */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                health?.status === 'healthy' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                health?.status === 'degraded' ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                'bg-gradient-to-br from-red-500 to-rose-600'
              }`}>
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Saúde do Sistema</h1>
                <p className="text-slate-600">Monitoramento em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastCheck && (
                <span className="text-sm text-slate-500">
                  Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
                </span>
              )}
              <Button onClick={checkHealth} disabled={loading} variant="outline" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Status Cards */}
          {health && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className={`border-l-4 ${
                health.status === 'healthy' ? 'border-l-green-500' :
                health.status === 'degraded' ? 'border-l-yellow-500' : 'border-l-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const config = statusConfig[health.status]
                      const Icon = config.icon
                      return (
                        <>
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className={`font-bold ${config.color}`}>{config.label}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Uptime</p>
                      <p className="font-bold text-gray-900">{formatUptime(health.uptime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Server className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Versão</p>
                      <p className="font-bold text-gray-900">{health.version}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pedidos Hoje</p>
                      <p className="font-bold text-gray-900">{health.metrics.ordersToday}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DIAGNÓSTICO AUTOMÁTICO - Score e Problemas */}
          {diagnostic && (
            <Card className={`mb-6 border-2 ${
              diagnostic.summary.healthScore >= 80 ? 'border-green-300 bg-green-50' :
              diagnostic.summary.healthScore >= 60 ? 'border-yellow-300 bg-yellow-50' :
              'border-red-300 bg-red-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Gauge className={`w-8 h-8 ${getScoreColor(diagnostic.summary.healthScore)}`} />
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Diagnóstico Automático</h3>
                      <p className="text-sm text-slate-600">
                        {diagnostic.summary.working} de {diagnostic.summary.total} funcionando
                      </p>
                    </div>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(diagnostic.summary.healthScore)}`}>
                    {diagnostic.summary.healthScore}%
                  </div>
                </div>

                {/* Resumo de Status */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-xl font-bold text-green-600">{diagnostic.summary.working}</div>
                    <div className="text-xs text-gray-500">OK</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-xl font-bold text-red-600">{diagnostic.summary.broken}</div>
                    <div className="text-xs text-gray-500">Erro</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-xl font-bold text-yellow-600">{diagnostic.summary.incomplete}</div>
                    <div className="text-xs text-gray-500">Incompleto</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-xl font-bold text-gray-500">{diagnostic.summary.notConfigured}</div>
                    <div className="text-xs text-gray-500">Opcional</div>
                  </div>
                </div>

                {/* Problemas Detectados */}
                {hasProblems && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Problemas Detectados ({brokenFeatures.length + incompleteFeatures.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {brokenFeatures.map((feature, idx) => (
                        <div key={`broken-${idx}`} className="flex items-center justify-between p-2 bg-red-100 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-800">{feature.name}</span>
                          </div>
                          <span className="text-xs text-red-600">{feature.message}</span>
                        </div>
                      ))}
                      {incompleteFeatures.map((feature, idx) => (
                        <div key={`incomplete-${idx}`} className="flex items-center justify-between p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">{feature.name}</span>
                          </div>
                          <span className="text-xs text-yellow-600">{feature.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasProblems && (
                  <div className="border-t pt-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">Nenhum problema crítico detectado!</p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Link 
                    href="/admin/health/diagnostic" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver diagnóstico detalhado →
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checks Detalhados da Infraestrutura */}
          {health && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Infraestrutura
                </h3>
                <div className="space-y-3">
                  {health.checks.map((check, index) => {
                    const config = statusConfig[check.status]
                    const Icon = config.icon
                    return (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <p className={`font-medium ${config.color}`}>{check.name}</p>
                            <p className="text-sm text-gray-600">{check.message}</p>
                          </div>
                        </div>
                        {check.latency !== undefined && (
                          <span className="text-sm text-gray-500">{check.latency}ms</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {loading && !health && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        {/* Categorias */}
        <div className="space-y-8">
          {tools.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-xl font-bold text-slate-700 mb-4">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((tool, toolIndex) => {
                  const colors = colorClasses[tool.color]
                  const Icon = tool.icon
                  
                  return (
                    <Link
                      key={toolIndex}
                      href={tool.href}
                      className={`group block p-5 rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 hover:shadow-lg`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 mb-1 group-hover:text-slate-900">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Loja Demo */}
        <div className="mt-10 p-6 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                🎪 Loja Demonstração
              </h3>
              <p className="text-violet-100 text-sm">
                Acesso público ao dashboard sem login (para clientes testarem)
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/demo"
                className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
              >
                Ver Cardápio
              </Link>
              <Link 
                href="/demo/dashboard"
                className="px-5 py-2 bg-white text-purple-600 rounded-lg text-sm font-bold hover:bg-violet-50 transition-colors"
              >
                Abrir Dashboard Demo →
              </Link>
            </div>
          </div>
        </div>

        {/* Atalhos */}
        <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Atalhos Rápidos
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/health/diagnostic"
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              🚀 Diagnóstico
            </Link>
            <Link 
              href="/admin/health/builder"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Aplicar Kit
            </Link>
            <Link 
              href="/admin/health/debug"
              className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors"
            >
              Ver Lojas
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          Sistema de Saúde v1.0
        </div>
      </div>
    </div>
  )
}
