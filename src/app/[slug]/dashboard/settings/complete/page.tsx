'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Store, ShoppingCart, CreditCard, Bell, Link2, Loader2, Save, CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  StoreTabContent, 
  SalesTabContent, 
  PaymentsTabContent, 
  NotificationsTabContent, 
  IntegrationsTabContent 
} from '@/components/settings'

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
  
  const [store, setStore] = useState({
    name: '', description: '', phone: '', email: '', address: '', city: '', state: '', cep: '',
    logo_url: '', banner_url: '', primary_color: '#8B5CF6', instagram: '', facebook: '', website: ''
  })
  
  const [businessHours, setBusinessHours] = useState(
    DAYS.map(d => ({ day: d.day, name: d.name, enabled: d.day !== 'sunday', open: '08:00', close: '22:00' }))
  )

  const [sales, setSales] = useState({
    delivery_enabled: true, delivery_radius: 5, delivery_fee: 5, delivery_min_order: 20, delivery_time: 45, delivery_free_above: 0,
    pickup_enabled: true, pickup_time: 20, pickup_discount: 0,
    tables_enabled: false, table_count: 10, service_fee: 10,
    scheduling_enabled: false, scheduling_min_hours: 2, scheduling_max_days: 7,
    inventory_enabled: false, inventory_low_alert: 10,
    kitchen_enabled: true, kitchen_prep_alert: 30,
    printer_enabled: false, printer_type: 'thermal80'
  })

  const [payments, setPayments] = useState({
    cash_enabled: true, credit_enabled: true, debit_enabled: true,
    pix_enabled: true, pix_key_type: 'cpf', pix_key: '', pix_name: ''
  })

  const [notifications, setNotifications] = useState({
    whatsapp_enabled: false, whatsapp_number: '', whatsapp_notify_order: true, whatsapp_notify_customer: true,
    email_enabled: false, email_confirmation: true,
    sounds_enabled: true, sound_new_order: true, sound_volume: 'medium'
  })

  const [integrations, setIntegrations] = useState({
    ifood_enabled: false, ifood_merchant_id: '', ifood_client_id: '', ifood_client_secret: '',
    rappi_enabled: false, rappi_store_id: '', rappi_api_key: '',
    google_reviews_enabled: false,
    loggi_enabled: false, loggi_api_key: '', loggi_auto_dispatch: false
  })

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase.from('stores').select('*').eq('slug', slug).single()
      if (data) {
        setStoreId(data.id)
        setStore({
          name: data.name || '', description: data.description || '', phone: data.phone || '', email: data.email || '',
          address: data.address || '', city: data.city || '', state: data.state || '', cep: data.cep || '',
          logo_url: data.logo_url || '', banner_url: data.banner_url || '',
          primary_color: data.settings?.primary_color || '#8B5CF6',
          instagram: data.settings?.instagram || '', facebook: data.settings?.facebook || '', website: data.settings?.website || ''
        })
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
      const { error } = await supabase.from('stores').update({
        name: store.name, description: store.description, phone: store.phone, email: store.email,
        address: store.address, city: store.city, state: store.state, cep: store.cep,
        logo_url: store.logo_url, banner_url: store.banner_url,
        settings: {
          primary_color: store.primary_color, instagram: store.instagram, facebook: store.facebook, website: store.website,
          businessHours, sales, payments, notifications, integrations
        }
      }).eq('id', storeId)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Header */}
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
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg">
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {saveStatus === 'success' && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Todas as configurações foram salvas!
          </div>
        </div>
      )}

      {/* Conteúdo das Abas */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {activeTab === 'store' && <StoreTabContent store={store} setStore={setStore} businessHours={businessHours} setBusinessHours={setBusinessHours} />}
        {activeTab === 'sales' && <SalesTabContent sales={sales} setSales={setSales} />}
        {activeTab === 'payments' && <PaymentsTabContent payments={payments} setPayments={setPayments} />}
        {activeTab === 'notifications' && <NotificationsTabContent notifications={notifications} setNotifications={setNotifications} />}
        {activeTab === 'integrations' && <IntegrationsTabContent integrations={integrations} setIntegrations={setIntegrations} />}
      </div>

      {/* Botão Salvar Fixo */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-5xl mx-auto flex justify-center">
          <Button onClick={handleSave} disabled={saving} size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-xl px-12">
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
