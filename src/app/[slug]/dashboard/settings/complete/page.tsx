'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Settings, Store, ShoppingCart, CreditCard, Bell, Link2,
  Loader2, Save, CheckCircle, MapPin, Clock, Phone, Mail,
  Globe, Instagram, Facebook, Palette, Truck, Package,
  UtensilsCrossed, Calendar, Archive, ChefHat, Printer,
  Tag, Users, Star, Megaphone, Smartphone, Volume2,
  DollarSign, Percent, Timer, Gift, Hash, AlertCircle,
  ToggleLeft, ToggleRight, Info, Lock, Unlock, Eye, EyeOff,
  ChevronDown, ChevronUp, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type TabId = 'store' | 'sales' | 'payments' | 'notifications' | 'integrations'

const TABS: { id: TabId; name: string; icon: React.ReactNode }[] = [
  { id: 'store', name: 'Loja', icon: <Store className="w-4 h-4" /> },
  { id: 'sales', name: 'Vendas', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'payments', name: 'Pagamentos', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'notifications', name: 'Notificações', icon: <Bell className="w-4 h-4" /> },
  { id: 'integrations', name: 'Integrações', icon: <Link2 className="w-4 h-4" /> }
]

const DAYS = [
  { day: 'monday', name: 'Seg' },
  { day: 'tuesday', name: 'Ter' },
  { day: 'wednesday', name: 'Qua' },
  { day: 'thursday', name: 'Qui' },
  { day: 'friday', name: 'Sex' },
  { day: 'saturday', name: 'Sáb' },
  { day: 'sunday', name: 'Dom' }
]

export default function CompleteSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<TabId>('store')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  
  // ====== DADOS DA LOJA ======
  const [store, setStore] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    logo_url: '',
    banner_url: '',
    primary_color: '#8B5CF6',
    instagram: '',
    facebook: '',
    website: ''
  })
  
  const [businessHours, setBusinessHours] = useState(
    DAYS.map(d => ({
      day: d.day,
      name: d.name,
      enabled: d.day !== 'sunday',
      open: '08:00',
      close: '22:00'
    }))
  )

  // ====== VENDAS ======
  const [sales, setSales] = useState({
    // Delivery
    delivery_enabled: true,
    delivery_radius: 5,
    delivery_fee: 5,
    delivery_min_order: 20,
    delivery_time: 45,
    delivery_free_above: 0,
    // Retirada
    pickup_enabled: true,
    pickup_time: 20,
    pickup_discount: 0,
    // Mesas
    tables_enabled: false,
    table_count: 10,
    service_fee: 10,
    table_qrcode: true,
    // Agendamento
    scheduling_enabled: false,
    scheduling_min_hours: 2,
    scheduling_max_days: 7,
    // Reservas
    reservations_enabled: false,
    reservation_duration: 90,
    reservation_max_party: 20,
    // Estoque
    inventory_enabled: false,
    inventory_low_alert: 10,
    inventory_auto_deduct: true,
    // Cozinha
    kitchen_enabled: true,
    kitchen_auto_accept: false,
    kitchen_prep_alert: 30,
    // Impressão
    printer_enabled: false,
    printer_auto: false,
    printer_type: 'thermal80'
  })

  // ====== PAGAMENTOS ======
  const [payments, setPayments] = useState({
    cash_enabled: true,
    credit_enabled: true,
    debit_enabled: true,
    pix_enabled: true,
    pix_key_type: 'cpf',
    pix_key: '',
    pix_name: ''
  })

  // ====== NOTIFICAÇÕES ======
  const [notifications, setNotifications] = useState({
    // WhatsApp
    whatsapp_enabled: false,
    whatsapp_number: '',
    whatsapp_notify_order: true,
    whatsapp_notify_customer: true,
    // Email
    email_enabled: false,
    email_confirmation: true,
    // Sons
    sounds_enabled: true,
    sound_new_order: true,
    sound_volume: 'medium'
  })

  // ====== INTEGRAÇÕES ======
  const [integrations, setIntegrations] = useState({
    // iFood
    ifood_enabled: false,
    ifood_merchant_id: '',
    ifood_client_id: '',
    ifood_client_secret: '',
    // Rappi
    rappi_enabled: false,
    rappi_store_id: '',
    rappi_api_key: '',
    // Google Reviews
    google_reviews_enabled: false,
    // Loggi
    loggi_enabled: false,
    loggi_api_key: '',
    loggi_auto_dispatch: false
  })

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        
        // Carregar dados básicos
        setStore({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          cep: data.cep || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          primary_color: data.settings?.primary_color || '#8B5CF6',
          instagram: data.settings?.instagram || '',
          facebook: data.settings?.facebook || '',
          website: data.settings?.website || ''
        })
        
        // Carregar settings
        const s = data.settings || {}
        if (s.businessHours) setBusinessHours(s.businessHours)
        if (s.sales) setSales(prev => ({ ...prev, ...s.sales }))
        if (s.payments) setPayments(prev => ({ ...prev, ...s.payments }))
        if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications }))
        if (s.integrations) setIntegrations(prev => ({ ...prev, ...s.integrations }))
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  const handleSave = async () => {
    if (!storeId) return
    
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: store.name,
          description: store.description,
          phone: store.phone,
          email: store.email,
          address: store.address,
          city: store.city,
          state: store.state,
          cep: store.cep,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          settings: {
            primary_color: store.primary_color,
            instagram: store.instagram,
            facebook: store.facebook,
            website: store.website,
            businessHours,
            sales,
            payments,
            notifications,
            integrations
          }
        })
        .eq('id', storeId)
      
      if (error) throw error
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setSaving(false)
    }
  }

  const ToggleSwitch = ({ enabled, onToggle, size = 'normal' }: { enabled: boolean; onToggle: () => void; size?: 'normal' | 'large' }) => (
    <button onClick={onToggle} className="focus:outline-none">
      {enabled ? (
        <ToggleRight className={`${size === 'large' ? 'w-14 h-14' : 'w-10 h-10'} text-violet-500`} />
      ) : (
        <ToggleLeft className={`${size === 'large' ? 'w-14 h-14' : 'w-10 h-10'} text-slate-300`} />
      )}
    </button>
  )

  const ModuleCard = ({ 
    icon, 
    title, 
    description, 
    enabled, 
    onToggle, 
    children,
    color = 'violet'
  }: { 
    icon: React.ReactNode
    title: string
    description: string
    enabled: boolean
    onToggle: () => void
    children?: React.ReactNode
    color?: string
  }) => {
    const [expanded, setExpanded] = useState(enabled)
    
    useEffect(() => {
      if (enabled && !expanded) setExpanded(true)
    }, [enabled])

    const colors: Record<string, { bg: string; text: string; border: string }> = {
      violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' }
    }
    const c = colors[color] || colors.violet

    return (
      <div className={`bg-white rounded-xl border-2 transition-all ${enabled ? c.border + ' shadow-md' : 'border-slate-100'}`}>
        <div 
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => children && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>
              {icon}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{title}</p>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enabled && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>}
            <ToggleSwitch enabled={enabled} onToggle={onToggle} size="large" />
            {children && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}>
                {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
            )}
          </div>
        </div>
        {children && expanded && enabled && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {children}
            </div>
          </div>
        )}
      </div>
    )
  }

  const ConfigField = ({ 
    label, 
    value, 
    onChange, 
    type = 'text',
    prefix,
    suffix,
    placeholder,
    options
  }: { 
    label: string
    value: any
    onChange: (v: any) => void
    type?: 'text' | 'number' | 'select' | 'password'
    prefix?: string
    suffix?: string
    placeholder?: string
    options?: { value: string; label: string }[]
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
        {type === 'select' ? (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
          >
            {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === 'password' ? (
          <div className="flex-1 relative">
            <input
              type={showPasswords[label] ? 'text' : 'password'}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(p => ({ ...p, [label]: !p[label] }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPasswords[label] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
          />
        )}
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header fixo */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
              <p className="text-sm text-slate-500">Configure tudo em um só lugar</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-violet-100 text-violet-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status de salvamento */}
      {saveStatus === 'success' && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Todas as configurações foram salvas!
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        
        {/* ====== ABA LOJA ====== */}
        {activeTab === 'store' && (
          <div className="space-y-4">
            {/* Dados Básicos */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                Dados Básicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigField label="Nome da Loja" value={store.name} onChange={v => setStore(s => ({ ...s, name: v }))} placeholder="Ex: Açaí do João" />
                <ConfigField label="Telefone / WhatsApp" value={store.phone} onChange={v => setStore(s => ({ ...s, phone: v }))} placeholder="(11) 99999-9999" />
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
                  <textarea
                    value={store.description}
                    onChange={e => setStore(s => ({ ...s, description: e.target.value }))}
                    placeholder="Descreva sua loja..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none resize-none"
                  />
                </div>
                <ConfigField label="E-mail" value={store.email} onChange={v => setStore(s => ({ ...s, email: v }))} placeholder="contato@loja.com" />
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Endereço
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-4">
                  <ConfigField label="Endereço" value={store.address} onChange={v => setStore(s => ({ ...s, address: v }))} placeholder="Rua, número, bairro" />
                </div>
                <ConfigField label="Cidade" value={store.city} onChange={v => setStore(s => ({ ...s, city: v }))} placeholder="São Paulo" />
                <ConfigField label="Estado" value={store.state} onChange={v => setStore(s => ({ ...s, state: v }))} placeholder="SP" />
                <ConfigField label="CEP" value={store.cep} onChange={v => setStore(s => ({ ...s, cep: v }))} placeholder="00000-000" />
              </div>
            </div>

            {/* Horários */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Horário de Funcionamento
              </h3>
              <div className="space-y-2">
                {businessHours.map((h, i) => (
                  <div key={h.day} className={`flex items-center justify-between p-3 rounded-lg ${h.enabled ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const newHours = [...businessHours]
                          newHours[i].enabled = !newHours[i].enabled
                          setBusinessHours(newHours)
                        }}
                        className={`w-10 h-5 rounded-full transition-all ${h.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${h.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`font-medium min-w-[40px] ${h.enabled ? 'text-emerald-800' : 'text-slate-400'}`}>{h.name}</span>
                    </div>
                    {h.enabled ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.open}
                          onChange={e => {
                            const newHours = [...businessHours]
                            newHours[i].open = e.target.value
                            setBusinessHours(newHours)
                          }}
                          className="px-2 py-1 border border-emerald-200 rounded text-sm"
                        />
                        <span className="text-slate-400">às</span>
                        <input
                          type="time"
                          value={h.close}
                          onChange={e => {
                            const newHours = [...businessHours]
                            newHours[i].close = e.target.value
                            setBusinessHours(newHours)
                          }}
                          className="px-2 py-1 border border-emerald-200 rounded text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                Visual e Redes Sociais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConfigField label="URL do Logo" value={store.logo_url} onChange={v => setStore(s => ({ ...s, logo_url: v }))} placeholder="https://..." />
                <ConfigField label="URL do Banner" value={store.banner_url} onChange={v => setStore(s => ({ ...s, banner_url: v }))} placeholder="https://..." />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cor Principal</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={store.primary_color}
                      onChange={e => setStore(s => ({ ...s, primary_color: e.target.value }))}
                      className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={store.primary_color}
                      onChange={e => setStore(s => ({ ...s, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <ConfigField label="Instagram" value={store.instagram} onChange={v => setStore(s => ({ ...s, instagram: v }))} placeholder="@seuinstagram" />
                <ConfigField label="Facebook" value={store.facebook} onChange={v => setStore(s => ({ ...s, facebook: v }))} placeholder="facebook.com/pagina" />
                <ConfigField label="Website" value={store.website} onChange={v => setStore(s => ({ ...s, website: v }))} placeholder="https://..." />
              </div>
            </div>
          </div>
        )}

        {/* ====== ABA VENDAS ====== */}
        {activeTab === 'sales' && (
          <div className="space-y-3">
            <ModuleCard
              icon={<Truck className="w-5 h-5" />}
              title="Delivery"
              description="Entregas na casa do cliente"
              enabled={sales.delivery_enabled}
              onToggle={() => setSales(s => ({ ...s, delivery_enabled: !s.delivery_enabled }))}
              color="emerald"
            >
              <ConfigField label="Raio de entrega" value={sales.delivery_radius} onChange={v => setSales(s => ({ ...s, delivery_radius: v }))} type="number" suffix="km" />
              <ConfigField label="Taxa de entrega" value={sales.delivery_fee} onChange={v => setSales(s => ({ ...s, delivery_fee: v }))} type="number" prefix="R$" />
              <ConfigField label="Pedido mínimo" value={sales.delivery_min_order} onChange={v => setSales(s => ({ ...s, delivery_min_order: v }))} type="number" prefix="R$" />
              <ConfigField label="Tempo estimado" value={sales.delivery_time} onChange={v => setSales(s => ({ ...s, delivery_time: v }))} type="number" suffix="min" />
              <ConfigField label="Frete grátis acima de" value={sales.delivery_free_above} onChange={v => setSales(s => ({ ...s, delivery_free_above: v }))} type="number" prefix="R$" />
            </ModuleCard>

            <ModuleCard
              icon={<Store className="w-5 h-5" />}
              title="Retirada na Loja"
              description="Cliente busca o pedido"
              enabled={sales.pickup_enabled}
              onToggle={() => setSales(s => ({ ...s, pickup_enabled: !s.pickup_enabled }))}
              color="violet"
            >
              <ConfigField label="Tempo preparo" value={sales.pickup_time} onChange={v => setSales(s => ({ ...s, pickup_time: v }))} type="number" suffix="min" />
              <ConfigField label="Desconto retirada" value={sales.pickup_discount} onChange={v => setSales(s => ({ ...s, pickup_discount: v }))} type="number" suffix="%" />
            </ModuleCard>

            <ModuleCard
              icon={<UtensilsCrossed className="w-5 h-5" />}
              title="Mesas e Comandas"
              description="Atendimento no local"
              enabled={sales.tables_enabled}
              onToggle={() => setSales(s => ({ ...s, tables_enabled: !s.tables_enabled }))}
              color="amber"
            >
              <ConfigField label="Número de mesas" value={sales.table_count} onChange={v => setSales(s => ({ ...s, table_count: v }))} type="number" />
              <ConfigField label="Taxa de serviço" value={sales.service_fee} onChange={v => setSales(s => ({ ...s, service_fee: v }))} type="number" suffix="%" />
            </ModuleCard>

            <ModuleCard
              icon={<Calendar className="w-5 h-5" />}
              title="Agendamento"
              description="Pedidos para data futura"
              enabled={sales.scheduling_enabled}
              onToggle={() => setSales(s => ({ ...s, scheduling_enabled: !s.scheduling_enabled }))}
              color="blue"
            >
              <ConfigField label="Antecedência mínima" value={sales.scheduling_min_hours} onChange={v => setSales(s => ({ ...s, scheduling_min_hours: v }))} type="number" suffix="horas" />
              <ConfigField label="Antecedência máxima" value={sales.scheduling_max_days} onChange={v => setSales(s => ({ ...s, scheduling_max_days: v }))} type="number" suffix="dias" />
            </ModuleCard>

            <ModuleCard
              icon={<Archive className="w-5 h-5" />}
              title="Controle de Estoque"
              description="Gestão de insumos"
              enabled={sales.inventory_enabled}
              onToggle={() => setSales(s => ({ ...s, inventory_enabled: !s.inventory_enabled }))}
              color="violet"
            >
              <ConfigField label="Alerta estoque baixo" value={sales.inventory_low_alert} onChange={v => setSales(s => ({ ...s, inventory_low_alert: v }))} type="number" suffix="unid" />
            </ModuleCard>

            <ModuleCard
              icon={<ChefHat className="w-5 h-5" />}
              title="Cozinha (KDS)"
              description="Painel de pedidos"
              enabled={sales.kitchen_enabled}
              onToggle={() => setSales(s => ({ ...s, kitchen_enabled: !s.kitchen_enabled }))}
              color="red"
            >
              <ConfigField label="Alerta de atraso" value={sales.kitchen_prep_alert} onChange={v => setSales(s => ({ ...s, kitchen_prep_alert: v }))} type="number" suffix="min" />
            </ModuleCard>

            <ModuleCard
              icon={<Printer className="w-5 h-5" />}
              title="Impressão"
              description="Comandas automáticas"
              enabled={sales.printer_enabled}
              onToggle={() => setSales(s => ({ ...s, printer_enabled: !s.printer_enabled }))}
              color="violet"
            >
              <ConfigField 
                label="Tipo de impressora" 
                value={sales.printer_type} 
                onChange={v => setSales(s => ({ ...s, printer_type: v }))} 
                type="select"
                options={[
                  { value: 'thermal80', label: 'Térmica 80mm' },
                  { value: 'thermal58', label: 'Térmica 58mm' },
                  { value: 'a4', label: 'A4' }
                ]}
              />
            </ModuleCard>
          </div>
        )}

        {/* ====== ABA PAGAMENTOS ====== */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Formas de Pagamento Aceitas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Dinheiro</span>
                  </div>
                  <ToggleSwitch enabled={payments.cash_enabled} onToggle={() => setPayments(p => ({ ...p, cash_enabled: !p.cash_enabled }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Cartão de Crédito</span>
                  </div>
                  <ToggleSwitch enabled={payments.credit_enabled} onToggle={() => setPayments(p => ({ ...p, credit_enabled: !p.credit_enabled }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Cartão de Débito</span>
                  </div>
                  <ToggleSwitch enabled={payments.debit_enabled} onToggle={() => setPayments(p => ({ ...p, debit_enabled: !p.debit_enabled }))} />
                </div>
              </div>
            </div>

            <ModuleCard
              icon={<Smartphone className="w-5 h-5" />}
              title="PIX"
              description="Pagamento instantâneo"
              enabled={payments.pix_enabled}
              onToggle={() => setPayments(p => ({ ...p, pix_enabled: !p.pix_enabled }))}
              color="green"
            >
              <ConfigField 
                label="Tipo de chave" 
                value={payments.pix_key_type} 
                onChange={v => setPayments(p => ({ ...p, pix_key_type: v }))} 
                type="select"
                options={[
                  { value: 'cpf', label: 'CPF' },
                  { value: 'cnpj', label: 'CNPJ' },
                  { value: 'email', label: 'E-mail' },
                  { value: 'phone', label: 'Telefone' },
                  { value: 'random', label: 'Chave Aleatória' }
                ]}
              />
              <ConfigField label="Chave PIX" value={payments.pix_key} onChange={v => setPayments(p => ({ ...p, pix_key: v }))} placeholder="Sua chave PIX" />
              <ConfigField label="Nome do titular" value={payments.pix_name} onChange={v => setPayments(p => ({ ...p, pix_name: v }))} placeholder="Nome que aparece no PIX" />
            </ModuleCard>
          </div>
        )}

        {/* ====== ABA NOTIFICAÇÕES ====== */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <ModuleCard
              icon={<Smartphone className="w-5 h-5" />}
              title="WhatsApp"
              description="Notificações via WhatsApp"
              enabled={notifications.whatsapp_enabled}
              onToggle={() => setNotifications(n => ({ ...n, whatsapp_enabled: !n.whatsapp_enabled }))}
              color="green"
            >
              <ConfigField label="Número WhatsApp" value={notifications.whatsapp_number} onChange={v => setNotifications(n => ({ ...n, whatsapp_number: v }))} placeholder="5511999999999" />
              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={notifications.whatsapp_notify_order}
                    onChange={e => setNotifications(n => ({ ...n, whatsapp_notify_order: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notificar novos pedidos</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={notifications.whatsapp_notify_customer}
                    onChange={e => setNotifications(n => ({ ...n, whatsapp_notify_customer: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notificar cliente</span>
                </label>
              </div>
            </ModuleCard>

            <ModuleCard
              icon={<Mail className="w-5 h-5" />}
              title="E-mail"
              description="Notificações por e-mail"
              enabled={notifications.email_enabled}
              onToggle={() => setNotifications(n => ({ ...n, email_enabled: !n.email_enabled }))}
              color="blue"
            >
              <label className="flex items-center gap-2 col-span-2">
                <input 
                  type="checkbox" 
                  checked={notifications.email_confirmation}
                  onChange={e => setNotifications(n => ({ ...n, email_confirmation: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Enviar confirmação de pedido</span>
              </label>
            </ModuleCard>

            <ModuleCard
              icon={<Volume2 className="w-5 h-5" />}
              title="Alertas Sonoros"
              description="Sons de notificação"
              enabled={notifications.sounds_enabled}
              onToggle={() => setNotifications(n => ({ ...n, sounds_enabled: !n.sounds_enabled }))}
              color="amber"
            >
              <ConfigField 
                label="Volume" 
                value={notifications.sound_volume} 
                onChange={v => setNotifications(n => ({ ...n, sound_volume: v }))} 
                type="select"
                options={[
                  { value: 'low', label: 'Baixo' },
                  { value: 'medium', label: 'Médio' },
                  { value: 'high', label: 'Alto' }
                ]}
              />
            </ModuleCard>
          </div>
        )}

        {/* ====== ABA INTEGRAÇÕES ====== */}
        {activeTab === 'integrations' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Sobre APIs:</strong> Algumas plataformas têm APIs restritas a parceiros. 
                Entre em contato com cada plataforma para obter suas credenciais.
              </p>
            </div>

            <ModuleCard
              icon={<span className="text-2xl">🍔</span>}
              title="iFood"
              description="Receba pedidos do iFood"
              enabled={integrations.ifood_enabled}
              onToggle={() => setIntegrations(i => ({ ...i, ifood_enabled: !i.ifood_enabled }))}
              color="red"
            >
              <ConfigField label="Merchant ID" value={integrations.ifood_merchant_id} onChange={v => setIntegrations(i => ({ ...i, ifood_merchant_id: v }))} placeholder="Seu Merchant ID" />
              <ConfigField label="Client ID" value={integrations.ifood_client_id} onChange={v => setIntegrations(i => ({ ...i, ifood_client_id: v }))} placeholder="Client ID" />
              <ConfigField label="Client Secret" value={integrations.ifood_client_secret} onChange={v => setIntegrations(i => ({ ...i, ifood_client_secret: v }))} type="password" placeholder="••••••••" />
            </ModuleCard>

            <ModuleCard
              icon={<span className="text-2xl">🛵</span>}
              title="Rappi"
              description="Receba pedidos da Rappi"
              enabled={integrations.rappi_enabled}
              onToggle={() => setIntegrations(i => ({ ...i, rappi_enabled: !i.rappi_enabled }))}
              color="amber"
            >
              <ConfigField label="Store ID" value={integrations.rappi_store_id} onChange={v => setIntegrations(i => ({ ...i, rappi_store_id: v }))} placeholder="Seu Store ID" />
              <ConfigField label="API Key" value={integrations.rappi_api_key} onChange={v => setIntegrations(i => ({ ...i, rappi_api_key: v }))} type="password" placeholder="••••••••" />
            </ModuleCard>

            <ModuleCard
              icon={<span className="text-2xl">📦</span>}
              title="Loggi"
              description="Entregas via Loggi"
              enabled={integrations.loggi_enabled}
              onToggle={() => setIntegrations(i => ({ ...i, loggi_enabled: !i.loggi_enabled }))}
              color="blue"
            >
              <ConfigField label="API Key" value={integrations.loggi_api_key} onChange={v => setIntegrations(i => ({ ...i, loggi_api_key: v }))} type="password" placeholder="••••••••" />
              <label className="flex items-center gap-2 col-span-2">
                <input 
                  type="checkbox" 
                  checked={integrations.loggi_auto_dispatch}
                  onChange={e => setIntegrations(i => ({ ...i, loggi_auto_dispatch: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Despacho automático</span>
              </label>
            </ModuleCard>

            <ModuleCard
              icon={<span className="text-2xl">🔍</span>}
              title="Google Reviews"
              description="Importe avaliações do Google"
              enabled={integrations.google_reviews_enabled}
              onToggle={() => setIntegrations(i => ({ ...i, google_reviews_enabled: !i.google_reviews_enabled }))}
              color="blue"
            >
              <p className="text-sm text-slate-600 col-span-3">
                Clique em "Conectar" na página de Avaliações para autorizar o Google.
              </p>
            </ModuleCard>
          </div>
        )}
      </div>

      {/* Botão Salvar Fixo */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-5xl mx-auto flex justify-center">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-xl px-12"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
