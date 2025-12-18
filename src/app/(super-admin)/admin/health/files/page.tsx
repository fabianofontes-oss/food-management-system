'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileCode, RefreshCw, Loader2, AlertTriangle, XCircle, CheckCircle,
  TrendingUp, ArrowDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FileInfo {
  path: string
  name: string
  lines: number
  size: number
  category: string
  violation: 'critical' | 'warning' | 'ok'
}

interface FilesData {
  limits: { critical: number; warning: number }
  stats: {
    total: number
    critical: number
    warning: number
    totalLines: number
    avgLines: number
  }
  top10: FileInfo[]
  byCategory: {
    category: string
    files: FileInfo[]
    totalLines: number
  }[]
  all: FileInfo[]
}

const violationConfig = {
  critical: { label: 'Crítico', color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle },
  warning: { label: 'Atenção', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  ok: { label: 'OK', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle }
}

export default function FilesPage() {
  const [data, setData] = useState<FilesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all')

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch('/api/health/files')
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredFiles = data?.all.filter(f => {
    if (filter === 'all') return true
    return f.violation === filter
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <FileCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Páginas Grandes</h1>
              <p className="text-slate-600">{data?.stats.total} arquivos acima de {data?.limits.warning} linhas</p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Regra */}
        <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-blue-800">
              <strong>📏 Regra de Arquitetura:</strong> Páginas não devem ultrapassar <strong>300 linhas</strong>. 
              Acima de 500 linhas é crítico e deve ser refatorado imediatamente.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{data.stats.critical}</p>
                <p className="text-sm text-gray-500">Críticos (&gt;500)</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{data.stats.warning}</p>
                <p className="text-sm text-gray-500">Atenção (&gt;300)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{data.stats.total}</p>
                <p className="text-sm text-gray-500">Total Arquivos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{data.stats.totalLines.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Linhas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{data.stats.avgLines}</p>
                <p className="text-sm text-gray-500">Média/Arquivo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'critical', label: '🔴 Críticos' },
            { value: 'warning', label: '🟡 Atenção' }
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

        {/* Top 10 */}
        {data && filter === 'all' && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top 10 Maiores Arquivos
              </h2>
              <div className="space-y-2">
                {data.top10.map((file, idx) => {
                  const config = violationConfig[file.violation]
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <code className="text-xs text-gray-500">{file.path}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${config.color}`}>
                          {file.lines} linhas
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Arquivos */}
        <div className="space-y-4">
          {filteredFiles.map((file, idx) => {
            const config = violationConfig[file.violation]
            const Icon = config.icon
            const percentage = Math.round((file.lines / 300) * 100)

            return (
              <Card key={idx} className={`border-l-4 ${
                file.violation === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${file.violation === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                        <h3 className="font-bold text-gray-900">{file.name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {file.category}
                        </span>
                      </div>
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded block mb-3">
                        {file.path}
                      </code>
                      
                      {/* Barra de progresso */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              file.violation === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {file.lines} linhas ({percentage}% do limite)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Dica */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-700 mb-2">💡 Como Refatorar</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Extrair componentes:</strong> Cada seção do formulário pode virar um componente</li>
              <li>• <strong>Custom hooks:</strong> Lógica de estado e efeitos em hooks separados</li>
              <li>• <strong>Separar modais:</strong> Modais de criar/editar em arquivos próprios</li>
              <li>• <strong>Usar composição:</strong> Componentes genéricos reutilizáveis</li>
            </ul>
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
