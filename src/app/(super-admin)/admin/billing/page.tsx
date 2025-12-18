'use client'

import { useEffect, useState } from 'react'
import { 
  CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, 
  RefreshCw, Loader2, Building2, Calendar, FileText, Send,
  Ban, ChevronDown, ChevronUp, QrCode
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/superadmin/queries'
import { toast } from 'sonner'

interface Invoice {
  id: string
  tenant_id: string
  plan_id: string
  amount_cents: number
  reference_month: string
  due_date: string
  paid_at: string | null
  status: string
  payment_gateway: string
  pix_qr_code: string | null
  pix_qr_code_base64: string | null
  created_at: string
  tenant?: {
    name: string
    email: string
  }
  plan?: {
    name: string
  }
}

interface BillingStats {
  totalInvoices: number
  pendingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  totalRevenue: number
  pendingRevenue: number
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [generatingInvoices, setGeneratingInvoices] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Buscar faturas com tenant e plano
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          tenant:tenants(name, email),
          plan:plans(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar faturas:', error)
        // Se a tabela não existe, mostrar mensagem
        if (error.code === '42P01') {
          toast.error('Tabela de faturas não existe. Execute a migration SQL primeiro.')
        }
        return
      }

      setInvoices(invoicesData || [])

      // Calcular estatísticas
      const allInvoices: Invoice[] = invoicesData || []
      const paid = allInvoices.filter((i: Invoice) => i.status === 'paid')
      const pending = allInvoices.filter((i: Invoice) => i.status === 'pending')
      const overdue = allInvoices.filter((i: Invoice) => i.status === 'overdue')

      setStats({
        totalInvoices: allInvoices.length,
        paidInvoices: paid.length,
        pendingInvoices: pending.length,
        overdueInvoices: overdue.length,
        totalRevenue: paid.reduce((sum: number, i: Invoice) => sum + i.amount_cents, 0),
        pendingRevenue: pending.reduce((sum: number, i: Invoice) => sum + i.amount_cents, 0) + overdue.reduce((sum: number, i: Invoice) => sum + i.amount_cents, 0)
      })
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast.error('Erro ao carregar dados de billing')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateInvoices() {
    if (!confirm('Isso vai gerar faturas para todos os tenants com plano ativo. Continuar?')) return

    try {
      setGeneratingInvoices(true)
      const response = await fetch('/api/billing/generate', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        toast.success(`${data.generated} faturas geradas!`)
        await loadData()
      } else {
        toast.error(data.error || 'Erro ao gerar faturas')
      }
    } catch (err) {
      console.error('Erro:', err)
      toast.error('Erro ao gerar faturas')
    } finally {
      setGeneratingInvoices(false)
    }
  }

  async function handleRunCron() {
    try {
      const response = await fetch('/api/cron/billing')
      const data = await response.json()

      if (data.success) {
        toast.success(`Cron executado! ${data.results.overdueInvoices} faturas vencidas, ${data.results.suspendedTenants} tenants suspensos`)
        await loadData()
      } else {
        toast.error('Erro ao executar cron')
      }
    } catch (err) {
      console.error('Erro:', err)
      toast.error('Erro ao executar cron')
    }
  }

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(i => i.status === filter)

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    paid: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: Ban }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando billing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Billing</h1>
            <p className="text-gray-600 mt-1">Faturas e Pagamentos Automatizados</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadData} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button onClick={handleRunCron} variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Executar Cron
            </Button>
            <Button 
              onClick={handleGenerateInvoices} 
              disabled={generatingInvoices}
              className="bg-gradient-to-r from-green-600 to-green-700 gap-2"
            >
              {generatingInvoices ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Gerar Faturas do Mês
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Faturas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalInvoices || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pagas</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.paidInvoices || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vencidas</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.overdueInvoices || 0}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {((stats?.totalRevenue || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'paid', label: 'Pagas' },
            { value: 'overdue', label: 'Vencidas' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
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

        {/* Lista de Faturas */}
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma fatura encontrada
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'Clique em "Gerar Faturas do Mês" para criar faturas para os tenants.' 
                  : 'Nenhuma fatura com este status.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const status = statusConfig[invoice.status] || statusConfig.pending
              const StatusIcon = status.icon
              const isExpanded = expandedInvoice === invoice.id

              return (
                <Card key={invoice.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {(invoice.tenant as any)?.name || 'Tenant'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(invoice.plan as any)?.name || 'Plano'} • {invoice.reference_month}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              R$ {(invoice.amount_cents / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Venc: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <p className="font-medium">{(invoice.tenant as any)?.email || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Criada em</p>
                            <p className="font-medium">
                              {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Gateway</p>
                            <p className="font-medium capitalize">{invoice.payment_gateway || '-'}</p>
                          </div>
                        </div>

                        {invoice.pix_qr_code_base64 && invoice.status === 'pending' && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <QrCode className="w-4 h-4" />
                              QR Code PIX
                            </p>
                            <img 
                              src={`data:image/png;base64,${invoice.pix_qr_code_base64}`}
                              alt="QR Code PIX"
                              className="w-48 h-48 mx-auto"
                            />
                            {invoice.pix_qr_code && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Código PIX (Copia e Cola):</p>
                                <input 
                                  type="text" 
                                  value={invoice.pix_qr_code} 
                                  readOnly
                                  className="w-full p-2 text-xs bg-gray-100 rounded border"
                                  onClick={(e) => {
                                    (e.target as HTMLInputElement).select()
                                    navigator.clipboard.writeText(invoice.pix_qr_code!)
                                    toast.success('Código PIX copiado!')
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {invoice.paid_at && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              ✓ Pago em {new Date(invoice.paid_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
