'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Megaphone, Plus, Send, Users, MessageSquare, Bell,
  Loader2, AlertCircle, Calendar, Clock, Target,
  Edit, Trash2, Play, Pause, CheckCircle, Gift,
  Smartphone, Mail, MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Campaign {
  id: string
  name: string
  type: 'promotion' | 'notification' | 'announcement'
  channel: 'push' | 'whatsapp' | 'email' | 'sms'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  message: string
  target_audience: 'all' | 'new' | 'inactive' | 'vip'
  scheduled_at: string | null
  sent_count: number
  open_rate: number
  created_at: string
}

interface CampaignStats {
  total: number
  active: number
  scheduled: number
  totalSent: number
  avgOpenRate: number
}

export default function MarketingPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    scheduled: 0,
    totalSent: 0,
    avgOpenRate: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'promotion' as Campaign['type'],
    channel: 'whatsapp' as Campaign['channel'],
    message: '',
    target_audience: 'all' as Campaign['target_audience'],
    scheduled_at: ''
  })

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
    if (storeId) loadCampaigns()
  }, [storeId])

  async function loadCampaigns() {
    try {
      setLoading(true)
      
      // Mock data - em produção criar tabela campaigns
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Promoção de Verão',
          type: 'promotion',
          channel: 'whatsapp',
          status: 'active',
          message: '🌞 Verão chegou! Açaí 500ml por apenas R$15,90. Use o código VERAO2024',
          target_audience: 'all',
          scheduled_at: null,
          sent_count: 245,
          open_rate: 68,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Lembrete Clientes Inativos',
          type: 'notification',
          channel: 'whatsapp',
          status: 'scheduled',
          message: 'Sentimos sua falta! 😊 Volte e ganhe 10% de desconto no seu pedido.',
          target_audience: 'inactive',
          scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          sent_count: 0,
          open_rate: 0,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Novidade no Cardápio',
          type: 'announcement',
          channel: 'push',
          status: 'completed',
          message: '🆕 Novidade! Experimentem nosso novo Açaí Premium com Whey Protein!',
          target_audience: 'all',
          scheduled_at: null,
          sent_count: 512,
          open_rate: 45,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setCampaigns(mockCampaigns)
      
      setStats({
        total: mockCampaigns.length,
        active: mockCampaigns.filter(c => c.status === 'active').length,
        scheduled: mockCampaigns.filter(c => c.status === 'scheduled').length,
        totalSent: mockCampaigns.reduce((sum, c) => sum + c.sent_count, 0),
        avgOpenRate: mockCampaigns.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.open_rate, 0) / 
                     mockCampaigns.filter(c => c.sent_count > 0).length || 0
      })
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveCampaign() {
    if (!formData.name || !formData.message) return
    
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      ...formData,
      status: formData.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: formData.scheduled_at || null,
      sent_count: 0,
      open_rate: 0,
      created_at: new Date().toISOString()
    }
    
    if (selectedCampaign) {
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? { ...newCampaign, id: c.id } : c))
    } else {
      setCampaigns(prev => [newCampaign, ...prev])
    }
    
    setShowForm(false)
    setSelectedCampaign(null)
    setFormData({ name: '', type: 'promotion', channel: 'whatsapp', message: '', target_audience: 'all', scheduled_at: '' })
  }

  function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta campanha?')) return
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  function handleToggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c))
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const styles: Record<Campaign['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-purple-100 text-purple-700',
      paused: 'bg-yellow-100 text-yellow-700'
    }
    const labels: Record<Campaign['status'], string> = {
      draft: 'Rascunho',
      scheduled: 'Agendada',
      active: 'Ativa',
      completed: 'Concluída',
      paused: 'Pausada'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getChannelIcon = (channel: Campaign['channel']) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'push': return <Bell className="w-4 h-4 text-purple-500" />
      case 'email': return <Mail className="w-4 h-4 text-blue-500" />
      case 'sms': return <Smartphone className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading && !storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-pink-600" />
            Marketing
          </h1>
          <p className="text-gray-500">Campanhas e comunicação com clientes</p>
        </div>
        <Button onClick={() => { setSelectedCampaign(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">Total Campanhas</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
          <p className="text-sm text-green-600">Ativas</p>
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
          <p className="text-sm text-blue-600">Mensagens Enviadas</p>
          <p className="text-2xl font-bold text-blue-700">{stats.totalSent}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-200">
          <p className="text-sm text-purple-600">Taxa Abertura Média</p>
          <p className="text-2xl font-bold text-purple-700">{stats.avgOpenRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma campanha criada</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      {getChannelIcon(campaign.channel)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{campaign.name}</p>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {campaign.target_audience === 'all' ? 'Todos' :
                           campaign.target_audience === 'new' ? 'Novos' :
                           campaign.target_audience === 'inactive' ? 'Inativos' : 'VIP'}
                        </span>
                        {campaign.sent_count > 0 && (
                          <>
                            <span className="flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              {campaign.sent_count} enviados
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {campaign.open_rate}% abertura
                            </span>
                          </>
                        )}
                        {campaign.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(campaign.scheduled_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {(campaign.status === 'active' || campaign.status === 'paused') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(campaign)}
                      >
                        {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setFormData({
                          name: campaign.name,
                          type: campaign.type,
                          channel: campaign.channel,
                          message: campaign.message,
                          target_audience: campaign.target_audience,
                          scheduled_at: campaign.scheduled_at || ''
                        })
                        setShowForm(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Promoção de Verão"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as Campaign['type'] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="promotion">Promoção</option>
                    <option value="notification">Notificação</option>
                    <option value="announcement">Anúncio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <select
                    value={formData.channel}
                    onChange={e => setFormData(prev => ({ ...prev, channel: e.target.value as Campaign['channel'] }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="push">Push Notification</option>
                    <option value="email">E-mail</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Público Alvo</label>
                <select
                  value={formData.target_audience}
                  onChange={e => setFormData(prev => ({ ...prev, target_audience: e.target.value as Campaign['target_audience'] }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">Todos os Clientes</option>
                  <option value="new">Clientes Novos (últimos 30 dias)</option>
                  <option value="inactive">Clientes Inativos (+60 dias)</option>
                  <option value="vip">Clientes VIP (maior recorrência)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Digite sua mensagem..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agendar para (opcional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={e => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setSelectedCampaign(null); }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveCampaign}>
                {formData.scheduled_at ? 'Agendar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
