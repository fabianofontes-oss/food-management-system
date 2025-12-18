'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Database, RefreshCw, Loader2, AlertCircle, AlertTriangle, Info,
  Table, CheckCircle, XCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TableInfo {
  name: string
  rows: number
}

interface Inconsistency {
  name: string
  count: number
  severity: 'critical' | 'warning' | 'info'
}

interface DatabaseHealth {
  totalRecords: number
  tables: TableInfo[]
  inconsistencies: Inconsistency[]
}

const severityConfig = {
  critical: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    label: 'Crítico'
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50 border-yellow-200',
    label: 'Atenção'
  },
  info: { 
    icon: Info, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    label: 'Info'
  }
}

export default function DatabaseHealthPage() {
  const [data, setData] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/health/database')
      if (!response.ok) {
        throw new Error('Erro ao carregar dados')
      }
      const json = await response.json()
      setData(json)
    } catch (err: any) {
      console.error('Erro:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const criticalCount = data?.inconsistencies.filter(i => i.severity === 'critical').length || 0
  const warningCount = data?.inconsistencies.filter(i => i.severity === 'warning').length || 0
  const infoCount = data?.inconsistencies.filter(i => i.severity === 'info').length || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analisando banco de dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Diagnóstico do Banco</h1>
              <p className="text-slate-600">{data?.totalRecords.toLocaleString()} registros em {data?.tables.length} tabelas</p>
            </div>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={criticalCount > 0 ? 'border-l-4 border-l-red-500' : ''}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{data?.totalRecords.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-sm text-gray-500">Problemas Críticos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              <p className="text-sm text-gray-500">Avisos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{infoCount}</p>
              <p className="text-sm text-gray-500">Informações</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Inconsistências */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Inconsistências Encontradas
              </h2>
              
              {data?.inconsistencies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">Nenhuma inconsistência encontrada!</p>
                  <p className="text-gray-500 text-sm">O banco de dados está saudável.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.inconsistencies.map((item, idx) => {
                    const config = severityConfig[item.severity]
                    const Icon = config.icon
                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${config.bg}`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium ${config.color}`}>{item.name}</p>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.color}`}>
                                {item.count}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{config.label}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabelas */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Table className="w-5 h-5" />
                Tabelas do Banco
              </h2>
              
              <div className="space-y-2">
                {data?.tables.map((table, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <code className="text-sm font-medium text-gray-700">{table.name}</code>
                    </div>
                    <span className="text-sm text-gray-500">
                      {table.rows.toLocaleString()} registros
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legenda */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h3 className="font-bold text-gray-700 mb-3">Níveis de Severidade</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span><strong>Crítico:</strong> Dados corrompidos, requer ação imediata</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span><strong>Atenção:</strong> Dados incompletos, pode causar problemas</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span><strong>Info:</strong> Apenas informativo, sem ação necessária</span>
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
