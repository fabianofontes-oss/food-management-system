'use client'

import { useEffect, useState } from 'react'
import { 
  Activity, FileCode, AlertTriangle, Bug, Ghost, FileText, 
  Globe, RefreshCw, CheckCircle, XCircle, Code2, Terminal,
  Search, Wrench, AlertOctagon, Loader2, Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuditError {
  file: string
  line: number
  type: string
  category: string
  message: string
  emoji: string
}

interface AuditReport {
  timestamp: string
  generated_at: string
  errors: AuditError[]
  summary: {
    total_errors: number
    files_scanned: number
    files_with_problems: number
    broken_buttons: number
    todos_pending: number
    console_logs: number
    mock_data: number
    localhost_urls: number
  }
}

const BADGE_COLORS: Record<string, string> = {
  '👻': 'bg-purple-100 text-purple-700 border-purple-200',
  '🐛': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '🤡': 'bg-orange-100 text-orange-700 border-orange-200',
  '📝': 'bg-blue-100 text-blue-700 border-blue-200',
  '🔀': 'bg-red-100 text-red-700 border-red-200',
  '🏠': 'bg-pink-100 text-pink-700 border-pink-200',
}

export default function AuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupedErrors, setGroupedErrors] = useState<Record<string, AuditError[]>>({})
  const [runningAudit, setRunningAudit] = useState(false)
  const [runningFix, setRunningFix] = useState(false)
  const [actionLog, setActionLog] = useState<string | null>(null)
  const [showConfirmFix, setShowConfirmFix] = useState(false)

  useEffect(() => {
    loadReport()
  }, [])

  async function runAudit() {
    try {
      setRunningAudit(true)
      setActionLog(null)
      
      const response = await fetch('/api/admin/audit/run', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setActionLog('✅ Auditoria concluída! Atualizando relatório...')
        await loadReport()
      } else {
        setActionLog('❌ Erro: ' + (data.error || 'Falha desconhecida'))
      }
    } catch (err) {
      setActionLog('❌ Erro ao executar auditoria')
    } finally {
      setRunningAudit(false)
    }
  }

  async function runFix() {
    try {
      setRunningFix(true)
      setShowConfirmFix(false)
      setActionLog('🧹 Executando faxina... Isso pode demorar alguns segundos.')
      
      const response = await fetch('/api/admin/audit/fix', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setActionLog('✅ Faxina concluída! Executando nova auditoria...')
        await runAudit()
      } else {
        setActionLog('❌ Erro: ' + (data.error || 'Falha desconhecida'))
      }
    } catch (err) {
      setActionLog('❌ Erro ao executar faxina')
    } finally {
      setRunningFix(false)
    }
  }

  async function loadReport() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/audit-report.json?' + Date.now())
      
      if (!response.ok) {
        throw new Error('not_found')
      }
      
      const data: AuditReport = await response.json()
      setReport(data)
      
      // Agrupar erros por arquivo
      const grouped: Record<string, AuditError[]> = {}
      data.errors.forEach(err => {
        if (!grouped[err.file]) {
          grouped[err.file] = []
        }
        grouped[err.file].push(err)
      })
      setGroupedErrors(grouped)
      
    } catch (err) {
      setError('not_found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-10 h-10 text-indigo-600" />
              Raio-X do Código
            </h1>
            <p className="text-gray-600 mt-1">Auditoria funcional do projeto</p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <Terminal className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-800 mb-2">
              Nenhum relatório encontrado
            </h2>
            <p className="text-amber-700 mb-6">
              Clique no botão abaixo para executar a primeira auditoria:
            </p>
            
            <Button 
              onClick={runAudit}
              disabled={runningAudit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
            >
              {runningAudit ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              {runningAudit ? 'Analisando código...' : '🔍 Rodar Primeira Auditoria'}
            </Button>

            {actionLog && (
              <div className={`mt-6 p-4 rounded-xl ${
                actionLog.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
                actionLog.startsWith('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <p className="font-medium">{actionLog}</p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              <p>Ou execute manualmente no terminal:</p>
              <code className="bg-gray-200 px-2 py-1 rounded text-gray-700">python scripts/auditor_funcional.py</code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) return null

  const { summary } = report

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-10 h-10 text-indigo-600" />
            Raio-X do Código
          </h1>
          <p className="text-gray-600 mt-1">
            Última varredura: {report.generated_at}
          </p>
        </div>

        {/* Painel de Ações */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={runAudit}
              disabled={runningAudit || runningFix}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 text-lg rounded-xl shadow-lg"
            >
              {runningAudit ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              {runningAudit ? 'Analisando...' : '🔍 Rodar Auditoria Agora'}
            </Button>

            {!showConfirmFix ? (
              <Button 
                onClick={() => setShowConfirmFix(true)}
                disabled={runningAudit || runningFix || summary.total_errors === 0}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-6 text-lg rounded-xl"
              >
                <Wrench className="w-5 h-5 mr-2" />
                🧹 Executar Faxina Automática
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertOctagon className="w-6 h-6 text-red-500" />
                <span className="text-red-700 font-medium">Confirmar faxina?</span>
                <Button 
                  onClick={runFix}
                  className="bg-red-600 hover:bg-red-700 text-white ml-2"
                >
                  {runningFix ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Sim, executar
                </Button>
                <Button 
                  onClick={() => setShowConfirmFix(false)}
                  variant="ghost"
                >
                  Cancelar
                </Button>
              </div>
            )}

            <Button onClick={loadReport} variant="outline" className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Log de Ação */}
          {actionLog && (
            <div className={`mt-4 p-4 rounded-xl ${
              actionLog.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              actionLog.startsWith('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="font-medium">{actionLog}</p>
            </div>
          )}

          {/* Aviso de Segurança */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">⚠️ Aviso de Segurança</p>
              <p>A faxina automática altera arquivos do projeto. Certifique-se de ter um backup ou commit antes de executar. Os arquivos originais são salvos em <code className="bg-amber-100 px-1 rounded">_BACKUP_BEFORE_FIX/</code></p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <FileCode className="w-8 h-8 text-indigo-500" />
              <span className="text-3xl font-bold text-gray-900">{summary.files_scanned}</span>
            </div>
            <p className="text-gray-600 mt-2">Arquivos Analisados</p>
          </div>
          
          <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${summary.total_errors > 0 ? 'border-red-500' : 'border-green-500'}`}>
            <div className="flex items-center justify-between">
              {summary.total_errors > 0 ? (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
              <span className="text-3xl font-bold text-gray-900">{summary.total_errors}</span>
            </div>
            <p className="text-gray-600 mt-2">Problemas Encontrados</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <Ghost className="w-8 h-8 text-purple-500" />
              <span className="text-3xl font-bold text-gray-900">{summary.broken_buttons}</span>
            </div>
            <p className="text-gray-600 mt-2">Botões Quebrados</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <Bug className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">{summary.console_logs}</span>
            </div>
            <p className="text-gray-600 mt-2">Console.logs</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{summary.todos_pending}</p>
              <p className="text-sm text-gray-500">TODOs Pendentes</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <Code2 className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{summary.mock_data}</p>
              <p className="text-sm text-gray-500">Dados Mock</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <Globe className="w-6 h-6 text-pink-500" />
            <div>
              <p className="text-2xl font-bold">{summary.localhost_urls}</p>
              <p className="text-sm text-gray-500">URLs Localhost</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-gray-500" />
            <div>
              <p className="text-2xl font-bold">{summary.files_with_problems}</p>
              <p className="text-sm text-gray-500">Arquivos c/ Problemas</p>
            </div>
          </div>
        </div>

        {/* Errors List */}
        {summary.total_errors > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalhamento por Arquivo</h2>
            
            {Object.entries(groupedErrors).map(([file, errors]) => (
              <div key={file} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-gray-500" />
                  <span className="font-mono text-sm text-gray-700">{file}</span>
                  <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {errors.length} problema{errors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {errors.map((err, idx) => (
                    <div key={idx} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
                      <span className="font-mono text-sm text-gray-400 w-20">
                        Linha {err.line}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${BADGE_COLORS[err.emoji] || 'bg-gray-100 text-gray-700'}`}>
                        {err.emoji} {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Código Limpo! 🎉
            </h2>
            <p className="text-green-700">
              Nenhum problema detectado na varredura.
            </p>
          </div>
        )}

        {/* Legenda */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-700 mb-3">Legenda</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">👻</span>
              <span>Botão/Link fantasma</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">🐛</span>
              <span>Console.log esquecido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">🤡</span>
              <span>Dados mock/fake</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">📝</span>
              <span>TODO/FIXME pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">🔀</span>
              <span>Redirecionamento vazio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">🏠</span>
              <span>URL localhost</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
