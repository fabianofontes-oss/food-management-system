'use client'

import { useEffect, useState } from 'react'
import { 
  Activity, FileCode, AlertTriangle, Bug, FileText, 
  Globe, RefreshCw, CheckCircle, Terminal, Search, 
  Loader2, Link2, Copy, Eye, X, AlertCircle
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

// Severidade por tipo de erro
const SEVERITY: Record<string, 'critical' | 'warning' | 'info'> = {
  '🏠': 'critical',  // localhost - quebra em produção
  '👻': 'critical',  // botão fantasma
  '🔀': 'critical',  // redirect vazio
  '🐛': 'warning',   // console.log
  '🤡': 'warning',   // mock data
  '📝': 'info',      // TODO/FIXME
}

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function AuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupedErrors, setGroupedErrors] = useState<Record<string, AuditError[]>>({})
  const [runningAudit, setRunningAudit] = useState(false)
  const [fixingLocalhost, setFixingLocalhost] = useState(false)
  const [actionLog, setActionLog] = useState<string | null>(null)
  const [isProduction, setIsProduction] = useState(false)
  const [showConsoleModal, setShowConsoleModal] = useState(false)
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const isProd = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
    setIsProduction(isProd)
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
        setActionLog('❌ ' + (data.message || 'Falha desconhecida'))
      }
    } catch (err) {
      setActionLog('❌ Erro ao executar auditoria')
    } finally {
      setRunningAudit(false)
    }
  }

  async function fixLocalhost() {
    try {
      setFixingLocalhost(true)
      setActionLog('🔗 Corrigindo URLs localhost...')
      
      const response = await fetch('/api/admin/audit/fix-localhost', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setActionLog('✅ URLs corrigidas! Executando nova auditoria...')
        await runAudit()
      } else {
        setActionLog('❌ ' + (data.message || 'Falha desconhecida'))
      }
    } catch (err) {
      setActionLog('❌ Erro ao corrigir URLs')
    } finally {
      setFixingLocalhost(false)
    }
  }

  function copyTodoList() {
    if (!report) return
    
    const todos = report.errors
      .filter(e => e.emoji === '📝')
      .map(e => `${e.file}:${e.line} - ${e.message}`)
      .join('\n')
    
    navigator.clipboard.writeText(todos)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtrar erros por categoria
  const localhostErrors = report?.errors.filter(e => e.emoji === '🏠') || []
  const consoleErrors = report?.errors.filter(e => e.emoji === '🐛') || []
  const todoErrors = report?.errors.filter(e => e.emoji === '📝') || []

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-10 h-10 text-indigo-600" />
              Saúde do Código
            </h1>
            <p className="text-gray-600 mt-1">
              Última varredura: {report.generated_at}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runAudit}
              disabled={runningAudit || fixingLocalhost || isProduction}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {runningAudit ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {runningAudit ? 'Analisando...' : 'Rodar Auditoria'}
            </Button>
            <Button onClick={loadReport} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modo Produção */}
        {isProduction && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <Terminal className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Modo Visualização:</strong> Ações de correção só funcionam em desenvolvimento local.
            </p>
          </div>
        )}

        {/* Log de Ação */}
        {actionLog && (
          <div className={`mb-6 p-4 rounded-xl ${
            actionLog.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
            actionLog.startsWith('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <p className="font-medium">{actionLog}</p>
          </div>
        )}

        {/* 3 Cards de Categorias */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: Links Quebrados (Localhost) - CRÍTICO */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-red-500 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Link2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Links Quebrados</h3>
                  <p className="text-xs text-red-600 font-medium">🔴 CRÍTICO</p>
                </div>
                <span className="ml-auto text-4xl font-bold text-red-600">{summary.localhost_urls}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                URLs apontando para <code className="bg-gray-100 px-1 rounded">localhost:3000</code>. 
                <strong className="text-red-600"> Vão quebrar na internet.</strong>
              </p>
              <Button 
                onClick={fixLocalhost}
                disabled={fixingLocalhost || isProduction || summary.localhost_urls === 0}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {fixingLocalhost ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                {fixingLocalhost ? 'Corrigindo...' : 'Corrigir Links Automaticamente'}
              </Button>
            </div>
            {localhostErrors.length > 0 && (
              <div className="border-t bg-red-50 p-3 max-h-32 overflow-y-auto">
                <p className="text-xs text-red-700 font-medium mb-1">Arquivos afetados:</p>
                {[...new Set(localhostErrors.map(e => e.file))].slice(0, 3).map(f => (
                  <p key={f} className="text-xs text-red-600 truncate">• {f}</p>
                ))}
                {[...new Set(localhostErrors.map(e => e.file))].length > 3 && (
                  <p className="text-xs text-red-500">+ mais arquivos...</p>
                )}
              </div>
            )}
          </div>

          {/* CARD 2: Rastros de Debug (Console.log) - AVISO */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-yellow-500 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Bug className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Rastros de Debug</h3>
                  <p className="text-xs text-yellow-600 font-medium">🟡 AVISO</p>
                </div>
                <span className="ml-auto text-4xl font-bold text-yellow-600">{summary.console_logs}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                <code className="bg-gray-100 px-1 rounded">console.log</code> útil para desenvolvimento, 
                mas pode deixar o site lento e expor dados.
              </p>
              <Button 
                onClick={() => setShowConsoleModal(true)}
                disabled={summary.console_logs === 0}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Arquivos ({summary.console_logs})
              </Button>
            </div>
          </div>

          {/* CARD 3: Tarefas Pendentes (TODO/FIXME) - INFO */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-blue-500 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tarefas Pendentes</h3>
                  <p className="text-xs text-blue-600 font-medium">🔵 INFO</p>
                </div>
                <span className="ml-auto text-4xl font-bold text-blue-600">{summary.todos_pending}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                <code className="bg-gray-100 px-1 rounded">TODO</code> e <code className="bg-gray-100 px-1 rounded">FIXME</code> - 
                funcionalidades que você anotou para fazer depois.
              </p>
              <Button 
                onClick={copyTodoList}
                disabled={summary.todos_pending === 0}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? 'Copiado!' : 'Exportar Lista'}
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <FileCode className="w-6 h-6 text-indigo-500" />
            <div>
              <p className="text-2xl font-bold">{summary.files_scanned}</p>
              <p className="text-xs text-gray-500">Arquivos Analisados</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{summary.total_errors}</p>
              <p className="text-xs text-gray-500">Total de Problemas</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{summary.mock_data}</p>
              <p className="text-xs text-gray-500">Dados Mock</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{summary.files_with_problems}</p>
              <p className="text-xs text-gray-500">Arquivos c/ Problemas</p>
            </div>
          </div>
        </div>

        {/* Lista Detalhada */}
        {summary.total_errors > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Detalhamento por Arquivo</h2>
            
            {Object.entries(groupedErrors).map(([file, errors]) => (
              <div key={file} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-gray-500" />
                  <span className="font-mono text-sm text-gray-700">{file}</span>
                  <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {errors.length} item{errors.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {errors.map((err, idx) => {
                    const severity = SEVERITY[err.emoji] || 'info'
                    return (
                      <div key={idx} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
                        <span className="font-mono text-sm text-gray-400 w-20">
                          Linha {err.line}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${SEVERITY_COLORS[severity]}`}>
                          {err.emoji} {err.message}
                        </span>
                      </div>
                    )
                  })}
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

        {/* Modal Console.logs */}
        {showConsoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between bg-yellow-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bug className="w-5 h-5 text-yellow-600" />
                  Arquivos com Console.log
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowConsoleModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {consoleErrors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum console.log encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {consoleErrors.map((err, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="font-mono text-sm text-gray-700">{err.file}</p>
                        <p className="text-xs text-yellow-700">Linha {err.line}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-gray-50">
                <p className="text-xs text-gray-500">
                  💡 Remova manualmente os console.log antes de fazer deploy em produção.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal TODOs */}
        {showTodoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between bg-blue-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Tarefas Pendentes (TODO/FIXME)
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowTodoModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {todoErrors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum TODO/FIXME encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {todoErrors.map((err, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="font-mono text-sm text-gray-700">{err.file}</p>
                        <p className="text-xs text-blue-700">Linha {err.line}: {err.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
