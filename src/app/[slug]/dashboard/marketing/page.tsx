'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Megaphone, Plus, Send, Users, MessageSquare, Bell,
  Loader2, AlertCircle, Calendar, Clock, Target,
  Edit, Trash2, Play, Pause, CheckCircle, Gift,
  Smartphone, Mail, MessageCircle, Zap, FileText,
  TrendingUp, DollarSign, BarChart3, Settings, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  type: 'promotion' | 'notification' | 'announcement' | 'remarketing' | 'loyalty'
  channel: 'push' | 'whatsapp' | 'email' | 'sms' | 'all'
  status: 'draft' | 'scheduled' | 'sending' | 'active' | 'completed' | 'paused' | 'cancelled'
  message: string
  subject: string | null
  target_audience: 'all' | 'new' | 'inactive' | 'vip' | 'birthday' | 'custom'
  scheduled_at: string | null
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  converted_count: number
  open_rate: number
  click_rate: number
  conversion_rate: number
  revenue_generated: number
  created_at: string
}

interface CampaignStats {
  total: number
  active: number
  scheduled: number
  totalSent: number
  avgOpenRate: number
  avgConversionRate: number
  totalRevenue: number
  automationsActive: number
}

interface Automation {
  id: string
  name: string
  trigger_type: string
  channel: string
  is_active: boolean
  total_sent: number
  total_converted: number
}

interface Template {
  id: string
  name: string
  category: string
  message: string
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
    avgOpenRate: 0,
    avgConversionRate: 0,
    totalRevenue: 0,
    automationsActive: 0
  })
  const [automations, setAutomations] = useState<Automation[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTab, setActiveTab] = useState<'campaigns' | 'automations' | 'templates'>('campaigns')
  const [showForm, setShowForm] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  
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
      
      // Tentar buscar do banco de dados
      const { data: dbCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      let campaignsData: Campaign[] = []

      if (!dbCampaigns || dbCampaigns.length === 0) {
        // Não usar mock em produção
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️ Sistema de campanhas não configurado ou sem dados')
          campaignsData = []
          setIsDemoMode(false)
        } else {
          console.warn('⚠️ MODO DEMO: Usando dados mock de campanhas (apenas DEV)')
          setIsDemoMode(true)
          // Mock data APENAS em DEV
          campaignsData = [
            {
              id: '1',
              name: 'Promoção de Verão',
              type: 'promotion',
              channel: 'whatsapp',
              status: 'active',
              subject: null,
              message: '🌞 Verão chegou! Açaí 500ml por apenas R$15,90. Use o código VERAO2024',
              target_audience: 'all',
              scheduled_at: null,
              sent_count: 245,
              delivered_count: 238,
              opened_count: 167,
              clicked_count: 89,
              converted_count: 34,
              open_rate: 68,
              click_rate: 53,
              conversion_rate: 38,
              revenue_generated: 1250.50,
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '2',
              name: 'Lembrete Clientes Inativos',
              type: 'remarketing',
              channel: 'whatsapp',
              status: 'scheduled',
              subject: null,
              message: 'Sentimos sua falta! 😊 Volte e ganhe 10% de desconto no seu pedido.',
              target_audience: 'inactive',
              scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              sent_count: 0,
              delivered_count: 0,
              opened_count: 0,
              clicked_count: 0,
              converted_count: 0,
              open_rate: 0,
              click_rate: 0,
              conversion_rate: 0,
              revenue_generated: 0,
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Novidade no Cardápio',
              type: 'announcement',
              channel: 'push',
              status: 'completed',
              subject: null,
              message: '🆕 Novidade! Experimentem nosso novo Açaí Premium com Whey Protein!',
              target_audience: 'all',
              scheduled_at: null,
              sent_count: 512,
              delivered_count: 498,
              opened_count: 230,
              clicked_count: 78,
              converted_count: 22,
              open_rate: 45,
              click_rate: 34,
              conversion_rate: 28,
              revenue_generated: 890.00,
              created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      } else {
        campaignsData = dbCampaigns
        setIsDemoMode(false)
      }

      setCampaigns(campaignsData)

      // Buscar automações
      const { data: dbAutomations } = await supabase
        .from('marketing_automations')
        .select('*')
        .eq('store_id', storeId)

      if (dbAutomations) {
        setAutomations(dbAutomations)
      } else {
        setAutomations([
          { id: '1', name: 'Boas-vindas', trigger_type: 'welcome', channel: 'whatsapp', is_active: true, total_sent: 45, total_converted: 12 },
          { id: '2', name: 'Aniversário', trigger_type: 'birthday', channel: 'whatsapp', is_active: true, total_sent: 23, total_converted: 8 },
          { id: '3', name: 'Cliente Inativo', trigger_type: 'inactive', channel: 'whatsapp', is_active: false, total_sent: 156, total_converted: 34 }
        ])
      }

      // Buscar templates
      const { data: dbTemplates } = await supabase
        .from('message_templates')
        .select('*')
        .eq('store_id', storeId)

      if (dbTemplates) {
        setTemplates(dbTemplates)
      } else {
        setTemplates([
          { id: '1', name: 'Boas-vindas', category: 'welcome', message: 'Olá {nome}! 👋 Seja bem-vindo(a) à {loja}!' },
          { id: '2', name: 'Promoção', category: 'promotion', message: '🔥 {nome}, temos uma oferta especial! Use {cupom} e ganhe {desconto}!' },
          { id: '3', name: 'Aniversário', category: 'birthday', message: '🎂 Parabéns, {nome}! Ganhe {desconto} OFF com o cupom {cupom}!' }
        ])
      }

      const activeAutomations = automations.filter(a => a.is_active).length
      
      setStats({
        total: campaignsData.length,
        active: campaignsData.filter(c => c.status === 'active').length,
        scheduled: campaignsData.filter(c => c.status === 'scheduled').length,
        totalSent: campaignsData.reduce((sum, c) => sum + c.sent_count, 0),
        avgOpenRate: campaignsData.filter(c => c.sent_count > 0).length > 0 
          ? campaignsData.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.open_rate, 0) / campaignsData.filter(c => c.sent_count > 0).length 
          : 0,
        avgConversionRate: campaignsData.filter(c => c.sent_count > 0).length > 0
          ? campaignsData.filter(c => c.sent_count > 0).reduce((sum, c) => sum + c.conversion_rate, 0) / campaignsData.filter(c => c.sent_count > 0).length
          : 0,
        totalRevenue: campaignsData.reduce((sum, c) => sum + c.revenue_generated, 0),
        automationsActive: activeAutomations
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
      subject: null,
      status: formData.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: formData.scheduled_at || null,
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      converted_count: 0,
      open_rate: 0,
      click_rate: 0,
      conversion_rate: 0,
      revenue_generated: 0,
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
      sending: 'bg-cyan-100 text-cyan-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-purple-100 text-purple-700',
      paused: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    const labels: Record<Campaign['status'], string> = {
      draft: 'Rascunho',
      scheduled: 'Agendada',
      sending: 'Enviando',
      active: 'Ativa',
      completed: 'Concluída',
      paused: 'Pausada',
      cancelled: 'Cancelada'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-pink-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando campanhas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg shadow-pink-500/25">
              <Megaphone className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Marketing
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Campanhas e comunicação com clientes</p>
        </div>
        <Button 
          onClick={() => { setSelectedCampaign(null); setShowForm(true); }}
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Banner DEMO */}
      {isDemoMode && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Modo Demonstração</h3>
              <p className="text-sm text-amber-800 mt-1">
                Você está visualizando dados de exemplo. As campanhas mostradas são fictícias e não serão enviadas.
                Para usar este módulo em produção, configure as integrações de envio (WhatsApp, Email, SMS).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Total Campanhas</p>
            <div className="p-2 bg-slate-100 rounded-xl">
              <Megaphone className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Ativas</p>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Play className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Mensagens Enviadas</p>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.totalSent}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Taxa Abertura Média</p>
            <div className="p-2 bg-violet-100 rounded-xl">
              <Target className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-violet-600">{stats.avgOpenRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Megaphone className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium mb-4">Nenhuma campanha criada</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg shadow-pink-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Campanha
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="p-5 hover:bg-slate-50/50 transition-colors">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
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
    </div>
  )
}
