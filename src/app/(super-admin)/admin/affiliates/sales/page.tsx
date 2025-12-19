'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, Loader2, Search, Filter
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Sale {
  id: string
  partner_id: string
  tenant_id: string
  sale_value: number
  commission_percent: number
  commission_amount: number
  status: string
  available_at: string | null
  created_at: string
  // Joins
  partner_name?: string
  partner_type?: string
  tenant_name?: string
}

export default function AdminAffiliatesSalesPage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('referral_sales')
        .select(`
          *,
          referral_partners:partner_id (display_name, partner_type),
          tenants:tenant_id (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processed = (data || []).map((s: any) => ({
        ...s,
        partner_name: s.referral_partners?.display_name,
        partner_type: s.referral_partners?.partner_type,
        tenant_name: s.tenants?.name,
      }))

      setSales(processed)
    } catch (e) {
      console.error('Erro ao carregar vendas:', e)
    } finally {
      setLoading(false)
    }
  }

  async function updateSaleStatus(saleId: string, newStatus: string) {
    const supabase = createClient()
    
    const updates: any = { status: newStatus }
    if (newStatus === 'AVAILABLE') {
      updates.available_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('referral_sales')
      .update(updates)
      .eq('id', saleId)

    if (!error) {
      setSales(prev => prev.map(s => 
        s.id === saleId ? { ...s, status: newStatus, available_at: updates.available_at || s.available_at } : s
      ))
    }
  }

  const filteredSales = sales.filter(s => {
    if (filterStatus === 'all') return true
    return s.status === filterStatus
  })

  const totals = {
    pending: sales.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.commission_amount, 0),
    available: sales.filter(s => s.status === 'AVAILABLE').reduce((sum, s) => sum + s.commission_amount, 0),
    cancelled: sales.filter(s => s.status === 'CANCELLED').reduce((sum, s) => sum + s.commission_amount, 0),
  }

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Pendente',
      'AVAILABLE': 'Disponível',
      'CANCELLED': 'Cancelado',
      'ADJUSTED': 'Ajustado',
    }
    return labels[status] || status
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-amber-100 text-amber-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/affiliates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas de Afiliados</h1>
          <p className="text-slate-600">Comissões geradas por indicações</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendente</p>
                <p className="text-2xl font-bold">R$ {(totals.pending / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Disponível</p>
                <p className="text-2xl font-bold text-green-600">R$ {(totals.available / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Cancelado</p>
                <p className="text-2xl font-bold text-red-600">R$ {(totals.cancelled / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Afiliado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tenant</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Valor Venda</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">%</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Comissão</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Data</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{sale.partner_name}</p>
                        <p className="text-sm text-slate-500">{sale.partner_type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{sale.tenant_name || '-'}</td>
                    <td className="py-3 px-4 text-right">R$ {(sale.sale_value / 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">{sale.commission_percent}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      R$ {(sale.commission_amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(sale.status)}`}>
                        {statusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sale.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSaleStatus(sale.id, 'AVAILABLE')}
                            title="Liberar"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSaleStatus(sale.id, 'CANCELLED')}
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Nenhuma venda encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
