'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Star, Loader2, AlertCircle, Link2, Unlink, RefreshCw, 
  CheckCircle, XCircle, Settings, ExternalLink, Clock,
  ArrowLeft, Plus, Trash2, Eye, EyeOff, Copy, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Integration {
  id: string
  platform: string
  platform_name: string
  is_active: boolean
  is_connected: boolean
  external_url: string | null
  last_sync_at: string | null
  last_sync_status: string | null
  total_reviews: number
  average_rating: number
  auto_sync: boolean
  sync_interval_hours: number
}

interface UnifiedStats {
  total_reviews: number
  average_rating: number
  internal_count: number
  external_count: number
  google_count: number
  ifood_count: number
}

const PLATFORMS = [
  { id: 'google', name: 'Google Meu Negócio', icon: '🔍', color: 'bg-blue-500', instructions: 'Cole o link do seu perfil do Google' },
  { id: 'ifood', name: 'iFood', icon: '🍔', color: 'bg-red-500', instructions: 'Cole o link do seu restaurante no iFood' },
  { id: 'rappi', name: 'Rappi', icon: '🛵', color: 'bg-orange-500', instructions: 'Cole o link do seu restaurante na Rappi' },
  { id: 'ubereats', name: 'Uber Eats', icon: '🚗', color: 'bg-green-600', instructions: 'Cole o link do seu restaurante no Uber Eats' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600', instructions: 'Cole o link da sua página do Facebook' },
  { id: 'tripadvisor', name: 'TripAdvisor', icon: '🦉', color: 'bg-green-500', instructions: 'Cole o link do seu restaurante no TripAdvisor' }
]

export default function ReviewIntegrationsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [stats, setStats] = useState<UnifiedStats | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    async function loadStore() {
      try {
        const { data, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (storeError || !data) {
          setError('Loja não encontrada')
          setLoading(false)
          return
        }
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
        setError('Erro ao carregar loja')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) loadIntegrations()
  }, [storeId])

  async function loadIntegrations() {
    try {
      setLoading(true)
      
      // Tentar buscar integrações do banco
      const { data: dbIntegrations, error: intError } = await supabase
        .from('review_integrations')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (intError) {
        console.log('Tabela review_integrations não existe ainda')
        setIntegrations([])
      } else {
        setIntegrations(dbIntegrations || [])
      }

      // Buscar estatísticas unificadas
      const { data: statsData } = await supabase
        .rpc('get_unified_review_stats', { p_store_id: storeId })

      if (statsData && statsData[0]) {
        setStats(statsData[0])
      } else {
        // Mock stats
        setStats({
          total_reviews: 0,
          average_rating: 0,
          internal_count: 0,
          external_count: 0,
          google_count: 0,
          ifood_count: 0
        })
      }
    } catch (err) {
      console.error('Erro ao carregar integrações:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddIntegration() {
    if (!selectedPlatform || !storeId) return
    
    setSaving(true)
    try {
      const platform = PLATFORMS.find(p => p.id === selectedPlatform)
      
      const { data, error } = await supabase
        .from('review_integrations')
        .insert({
          store_id: storeId,
          platform: selectedPlatform,
          platform_name: platform?.name || selectedPlatform,
          external_url: externalUrl || null,
          is_active: true,
          is_connected: !!externalUrl
        })
        .select()
        .single()

      if (error) throw error

      setIntegrations(prev => [data, ...prev])
      setShowAddModal(false)
      setSelectedPlatform(null)
      setExternalUrl('')
    } catch (err: any) {
      console.error('Erro ao adicionar integração:', err)
      alert('Erro ao adicionar integração. A tabela pode não existir ainda.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(integrationId: string) {
    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) return

    await supabase
      .from('review_integrations')
      .update({ is_active: !integration.is_active })
      .eq('id', integrationId)

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, is_active: !i.is_active } : i
    ))
  }

  async function handleSync(integrationId: string) {
    setSyncing(integrationId)
    
    // Simular sincronização (em produção, chamaria API externa)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await supabase
      .from('review_integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success'
      })
      .eq('id', integrationId)

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { 
        ...i, 
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success'
      } : i
    ))
    
    setSyncing(null)
  }

  async function handleDelete(integrationId: string) {
    if (!confirm('Tem certeza que deseja remover esta integração?')) return

    await supabase
      .from('review_integrations')
      .delete()
      .eq('id', integrationId)

    setIntegrations(prev => prev.filter(i => i.id !== integrationId))
  }

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || { 
      id: platformId, name: platformId, icon: '📱', color: 'bg-gray-500', instructions: 'Cole o link do seu perfil'
    }
  }

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <Loader2 className="w-14 h-14 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando integrações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${slug}/dashboard/reviews`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-yellow-500/25">
                  <Link2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                Integrações de Reviews
              </h1>
              <p className="text-slate-500 mt-1">Unifique avaliações de todas as plataformas</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Stats Unificados */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Total Unificado</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total_reviews}</p>
              <p className="text-xs text-slate-400 mt-1">avaliações</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Média Geral</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-yellow-500">{stats.average_rating?.toFixed(1) || '0.0'}</p>
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Internas</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.internal_count}</p>
              <p className="text-xs text-slate-400 mt-1">do sistema</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Externas</p>
              <p className="text-3xl font-bold text-blue-600">{stats.external_count}</p>
              <p className="text-xs text-slate-400 mt-1">importadas</p>
            </div>
          </div>
        )}

        {/* Lista de Integrações */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Plataformas Conectadas</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-3" />
              <p className="text-slate-500">Carregando...</p>
            </div>
          ) : integrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Link2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-2">Nenhuma integração configurada</p>
              <p className="text-sm text-slate-400 mb-4">Conecte plataformas para unificar suas avaliações</p>
              <Button onClick={() => setShowAddModal(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Integração
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {integrations.map(integration => {
                const platform = getPlatformInfo(integration.platform)
                return (
                  <div key={integration.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-2xl`}>
                          {platform.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800">{platform.name}</p>
                            {integration.is_connected ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Conectado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Pendente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span>{integration.total_reviews} avaliações</span>
                            {integration.average_rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {integration.average_rating.toFixed(1)}
                              </span>
                            )}
                            {integration.last_sync_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Sync: {new Date(integration.last_sync_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(integration.id)}
                          disabled={syncing === integration.id}
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing === integration.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant={integration.is_active ? 'default' : 'outline'}
                          onClick={() => handleToggleActive(integration.id)}
                        >
                          {integration.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        {integration.external_url && (
                          <a href={integration.external_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(integration.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Plataformas Disponíveis */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Plataformas Disponíveis</h2>
            <p className="text-sm text-slate-500 mt-1">Clique para adicionar uma nova integração</p>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {PLATFORMS.map(platform => {
              const isConnected = integrations.some(i => i.platform === platform.id)
              return (
                <button
                  key={platform.id}
                  onClick={() => {
                    if (!isConnected) {
                      setSelectedPlatform(platform.id)
                      setShowAddModal(true)
                    }
                  }}
                  disabled={isConnected}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isConnected 
                      ? 'border-green-200 bg-green-50 cursor-not-allowed' 
                      : 'border-slate-200 hover:border-yellow-400 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium text-slate-800">{platform.name}</p>
                      {isConnected && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Conectado
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal Adicionar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Adicionar Integração
            </h3>
            
            {!selectedPlatform ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">Selecione a plataforma:</p>
                {PLATFORMS.filter(p => !integrations.some(i => i.platform === p.id)).map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-yellow-400 transition-all flex items-center gap-3"
                  >
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <span className="text-2xl">{getPlatformInfo(selectedPlatform).icon}</span>
                  <span className="font-medium">{getPlatformInfo(selectedPlatform).name}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Link do seu perfil/restaurante
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={e => setExternalUrl(e.target.value)}
                    placeholder={getPlatformInfo(selectedPlatform).instructions}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-yellow-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {getPlatformInfo(selectedPlatform).instructions}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> A importação automática de avaliações depende da disponibilidade 
                    da API de cada plataforma. Algumas podem requerer importação manual.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedPlatform(null)
                  setExternalUrl('')
                }}
              >
                Cancelar
              </Button>
              {selectedPlatform && (
                <Button 
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500"
                  onClick={handleAddIntegration}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
