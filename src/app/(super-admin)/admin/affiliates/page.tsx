'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, DollarSign, TrendingUp, Store, Truck, User, Search,
  MoreVertical, Eye, Ban, CheckCircle, Clock, Loader2, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Partner {
  id: string
  user_id: string | null
  tenant_id: string | null
  store_id: string | null
  display_name: string
  partner_type: string
  base_commission_percent: number
  is_active: boolean
  driver_share_percent: number | null
  recruiter_share_percent: number | null
  recruited_by_store_id: string | null
  created_at: string
  // Joins
  user_email?: string
  store_name?: string
  recruited_by_store_name?: string
  codes_count?: number
  referrals_count?: number
  total_commission?: number
}

interface Stats {
  total_partners: number
  active_partners: number
  total_referrals: number
  pending_commissions: number
  available_commissions: number
}

export default function AdminAffiliatesPage() {
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState<Partner[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Buscar partners com dados relacionados
      const { data: partnersData, error } = await supabase
        .from('referral_partners')
        .select(`
          *,
          users:user_id (email),
          stores:store_id (name),
          recruited_store:recruited_by_store_id (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Buscar contagens adicionais
      const { data: codesData } = await supabase
        .from('referral_codes')
        .select('partner_id')

      const { data: referralsData } = await supabase
        .from('tenant_referrals')
        .select('code_id, referral_codes!inner(partner_id)')

      const { data: salesData } = await supabase
        .from('referral_sales')
        .select('partner_id, commission_amount, status')

      // Processar partners
      const processedPartners = (partnersData || []).map((p: any) => {
        const codes = codesData?.filter((c: any) => c.partner_id === p.id) || []
        const referrals = referralsData?.filter((r: any) => 
          r.referral_codes?.partner_id === p.id
        ) || []
        const sales = salesData?.filter((s: any) => s.partner_id === p.id) || []
        const totalCommission = sales.reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0)

        return {
          ...p,
          user_email: p.users?.email,
          store_name: p.stores?.name,
          recruited_by_store_name: p.recruited_store?.name,
          codes_count: codes.length,
          referrals_count: referrals.length,
          total_commission: totalCommission,
        }
      })

      setPartners(processedPartners)

      // Calcular stats
      const pendingCommissions = salesData
        ?.filter((s: any) => s.status === 'PENDING')
        .reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0) || 0

      const availableCommissions = salesData
        ?.filter((s: any) => s.status === 'AVAILABLE')
        .reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0) || 0

      setStats({
        total_partners: processedPartners.length,
        active_partners: processedPartners.filter((p: Partner) => p.is_active).length,
        total_referrals: referralsData?.length || 0,
        pending_commissions: pendingCommissions,
        available_commissions: availableCommissions,
      })
    } catch (e) {
      console.error('Erro ao carregar afiliados:', e)
    } finally {
      setLoading(false)
    }
  }

  async function togglePartnerStatus(partnerId: string, currentStatus: boolean) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('referral_partners')
      .update({ is_active: !currentStatus })
      .eq('id', partnerId)

    if (!error) {
      setPartners(prev => prev.map(p => 
        p.id === partnerId ? { ...p, is_active: !currentStatus } : p
      ))
    }
  }

  const filteredPartners = partners.filter(p => {
    const matchesSearch = !search || 
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = filterType === 'all' || p.partner_type === filterType
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && p.is_active) ||
      (filterStatus === 'inactive' && !p.is_active)

    return matchesSearch && matchesType && matchesStatus
  })

  const partnerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'OWNER': 'Dono de Loja',
      'STAFF': 'Funcionário',
      'DRIVER': 'Motoboy',
      'PARTNER_GENERAL': 'Parceiro',
      'INFLUENCER': 'Influenciador',
    }
    return labels[type] || type
  }

  const partnerTypeIcon = (type: string) => {
    switch (type) {
      case 'OWNER': return Store
      case 'STAFF': return User
      case 'DRIVER': return Truck
      default: return Users
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Afiliados</h1>
          <p className="text-slate-600">Gerencie parceiros e comissões do programa de afiliados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/affiliates/sales">
            <Button variant="outline">Vendas</Button>
          </Link>
          <Link href="/admin/affiliates/payouts">
            <Button variant="outline">Repasses</Button>
          </Link>
          <Link href="/admin/affiliates/settings">
            <Button variant="outline">Configurações</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{stats?.total_partners || 0}</p>
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
                <p className="text-sm text-slate-500">Ativos</p>
                <p className="text-2xl font-bold">{stats?.active_partners || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Indicações</p>
                <p className="text-2xl font-bold">{stats?.total_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendente</p>
                <p className="text-2xl font-bold">
                  R$ {((stats?.pending_commissions || 0) / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {((stats?.available_commissions || 0) / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
            >
              <option value="all">Todos os tipos</option>
              <option value="OWNER">Donos de Loja</option>
              <option value="STAFF">Funcionários</option>
              <option value="DRIVER">Motoboys</option>
              <option value="PARTNER_GENERAL">Parceiros</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
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
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Loja</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Recrutado por</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Códigos</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Indicações</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Comissões</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => {
                  const Icon = partnerTypeIcon(partner.partner_type)
                  return (
                    <tr key={partner.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{partner.display_name}</p>
                          <p className="text-sm text-slate-500">{partner.user_email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{partnerTypeLabel(partner.partner_type)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {partner.store_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {partner.recruited_by_store_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">{partner.codes_count}</td>
                      <td className="py-3 px-4 text-center">{partner.referrals_count}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {((partner.total_commission || 0) / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${partner.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}
                        `}>
                          {partner.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePartnerStatus(partner.id, partner.is_active)}
                            title={partner.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {partner.is_active ? (
                              <Ban className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredPartners.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhum afiliado encontrado
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
