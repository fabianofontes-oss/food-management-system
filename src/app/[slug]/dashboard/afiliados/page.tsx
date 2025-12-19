'use client'

import { useState, useEffect } from 'react'
import { 
  Loader2, 
  Link2, 
  Copy, 
  Check, 
  Users, 
  DollarSign,
  Plus,
  Store,
  Truck,
  User
} from 'lucide-react'
import { 
  getMyReferralDataAction, 
  createMyPartnerAction, 
  createMyCodeAction,
  getMyStoresForReferralAction 
} from '@/modules/referral/actions'
import type { MyReferralData, PartnerType } from '@/modules/referral/types'

export default function AfiliadosPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MyReferralData | null>(null)
  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string; role: string }>>([])
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form para criar partner
  const [showForm, setShowForm] = useState(false)
  const [formStoreId, setFormStoreId] = useState('')
  const [formPartnerType, setFormPartnerType] = useState<PartnerType>('DRIVER')
  const [formDisplayName, setFormDisplayName] = useState('')

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'https://pediu.food'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [dataRes, storesRes] = await Promise.all([
        getMyReferralDataAction(),
        getMyStoresForReferralAction(),
      ])

      if (dataRes.ok && dataRes.data) {
        setData(dataRes.data)
      }
      if (storesRes.ok && storesRes.stores) {
        setStores(storesRes.stores)
        if (storesRes.stores.length > 0) {
          setFormStoreId(storesRes.stores[0].id)
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePartner() {
    if (!formDisplayName.trim()) {
      setError('Informe seu nome de exibição')
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Criar partner
      const partnerRes = await createMyPartnerAction({
        storeId: ['OWNER', 'STAFF', 'DRIVER'].includes(formPartnerType) ? formStoreId : undefined,
        partnerType: formPartnerType,
        displayName: formDisplayName.trim(),
      })

      if (!partnerRes.ok || !partnerRes.partner) {
        throw new Error(partnerRes.error || 'Erro ao criar perfil')
      }

      // Criar código automaticamente
      const codeRes = await createMyCodeAction(partnerRes.partner.id)
      if (!codeRes.ok) {
        throw new Error(codeRes.error || 'Erro ao criar código')
      }

      // Recarregar dados
      await loadData()
      setShowForm(false)
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar perfil')
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateCode() {
    if (!data?.partner) return

    setCreating(true)
    setError(null)

    try {
      const res = await createMyCodeAction(data.partner.id)
      if (!res.ok) {
        throw new Error(res.error || 'Erro ao criar código')
      }
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar código')
    } finally {
      setCreating(false)
    }
  }

  function copyLink(code: string) {
    const link = `${baseUrl}/r/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  const mainCode = data?.codes?.[0]?.code

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Programa de Afiliados</h1>
        <p className="text-slate-600 mt-1">
          Indique novos estabelecimentos e ganhe comissões
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Se não tem partner, mostrar form para criar */}
      {!data?.partner && !showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="inline-block p-4 bg-violet-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Comece a indicar agora!
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Crie seu link de afiliado e comece a ganhar comissões por cada 
            estabelecimento que se cadastrar usando seu link.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar meu link de afiliado
          </button>
        </div>
      )}

      {/* Form para criar partner */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Criar perfil de afiliado
          </h2>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Seu nome de exibição
              </label>
              <input
                type="text"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                placeholder="Ex: João Silva"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de afiliado
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: 'DRIVER', label: 'Motoboy', icon: Truck },
                  { value: 'STAFF', label: 'Funcionário', icon: User },
                  { value: 'OWNER', label: 'Dono de Loja', icon: Store },
                  { value: 'PARTNER_GENERAL', label: 'Afiliado Geral', icon: Users },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormPartnerType(value as PartnerType)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-colors
                      ${formPartnerType === value 
                        ? 'border-violet-500 bg-violet-50' 
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${formPartnerType === value ? 'text-violet-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-medium ${formPartnerType === value ? 'text-violet-700' : 'text-slate-700'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Store (para tipos internos) */}
            {['OWNER', 'STAFF', 'DRIVER'].includes(formPartnerType) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loja vinculada
                </label>
                {stores.length === 0 ? (
                  <p className="text-sm text-red-600">
                    Você não está vinculado a nenhuma loja. Peça ao dono para te adicionar.
                  </p>
                ) : (
                  <select
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePartner}
                disabled={creating || (['OWNER', 'STAFF', 'DRIVER'].includes(formPartnerType) && !formStoreId)}
                className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar meu link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dados do afiliado */}
      {data?.partner && (
        <>
          {/* Meu Link */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Meu Link</h2>
              {data.codes.length === 0 && (
                <button
                  onClick={handleCreateCode}
                  disabled={creating}
                  className="text-violet-600 hover:text-violet-700 text-sm font-medium flex items-center gap-1"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Gerar código
                </button>
              )}
            </div>

            {mainCode ? (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Seu link de indicação</p>
                    <p className="text-lg font-mono font-semibold text-violet-600">
                      {baseUrl}/r/{mainCode}
                    </p>
                  </div>
                  <button
                    onClick={() => copyLink(mainCode)}
                    className="p-3 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-violet-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Código: <span className="font-mono font-bold">{mainCode}</span>
                </p>
              </div>
            ) : (
              <p className="text-slate-500">Nenhum código gerado ainda.</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Indicados</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.referrals.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pendente</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {data.totals.pending.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Disponível</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {data.totals.available.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de indicados */}
          {data.referrals.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Estabelecimentos Indicados
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Nome</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((ref, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-3">{ref.tenant_name || 'Sem nome'}</td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(ref.captured_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de comissões */}
          {data.sales.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Comissões
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Estabelecimento</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Valor</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Comissão</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{sale.tenant_name || '-'}</td>
                        <td className="py-2 px-3">R$ {sale.sale_value.toFixed(2)}</td>
                        <td className="py-2 px-3 font-semibold text-green-600">
                          R$ {sale.commission_amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${sale.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : ''}
                            ${sale.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : ''}
                            ${sale.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {sale.status === 'AVAILABLE' ? 'Disponível' : ''}
                            {sale.status === 'PENDING' ? 'Pendente' : ''}
                            {sale.status === 'CANCELLED' ? 'Cancelado' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
