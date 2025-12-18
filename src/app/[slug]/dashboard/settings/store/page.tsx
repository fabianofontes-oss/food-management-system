'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Store, Clock, MapPin, Phone, Mail, Globe, Instagram, Facebook,
  Loader2, Save, CheckCircle, Image, Palette, FileText, Calendar,
  Plus, Trash2, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BusinessHour {
  day: string
  dayName: string
  enabled: boolean
  open: string
  close: string
}

const DAYS = [
  { day: 'sunday', name: 'Domingo' },
  { day: 'monday', name: 'Segunda' },
  { day: 'tuesday', name: 'Terça' },
  { day: 'wednesday', name: 'Quarta' },
  { day: 'thursday', name: 'Quinta' },
  { day: 'friday', name: 'Sexta' },
  { day: 'saturday', name: 'Sábado' }
]

export default function StoreSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Dados básicos
  const [storeName, setStoreName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeCity, setStoreCity] = useState('')
  const [storeState, setStoreState] = useState('')
  const [storeCep, setStoreCep] = useState('')
  
  // Visual
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6')
  const [secondaryColor, setSecondaryColor] = useState('#F59E0B')
  
  // Redes sociais
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [website, setWebsite] = useState('')
  
  // Horários
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(
    DAYS.map(d => ({
      day: d.day,
      dayName: d.name,
      enabled: d.day !== 'sunday',
      open: '08:00',
      close: '22:00'
    }))
  )

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        setStoreName(data.name || '')
        setStoreDescription(data.description || '')
        setStorePhone(data.phone || '')
        setStoreEmail(data.email || '')
        setStoreAddress(data.address || '')
        setStoreCity(data.city || '')
        setStoreState(data.state || '')
        setStoreCep(data.cep || '')
        setLogoUrl(data.logo_url || '')
        setBannerUrl(data.banner_url || '')
        
        // Carregar settings
        const settings = data.settings as any || {}
        setPrimaryColor(settings.primaryColor || '#8B5CF6')
        setSecondaryColor(settings.secondaryColor || '#F59E0B')
        setInstagram(settings.instagram || '')
        setFacebook(settings.facebook || '')
        setWebsite(settings.website || '')
        
        if (settings.businessHours) {
          setBusinessHours(settings.businessHours)
        }
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  const updateBusinessHour = (day: string, field: keyof BusinessHour, value: any) => {
    setBusinessHours(prev => prev.map(h => 
      h.day === day ? { ...h, [field]: value } : h
    ))
  }

  const handleSave = async () => {
    if (!storeId) return
    
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      // Buscar settings atuais
      const { data: currentStore } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single()
      
      const currentSettings = (currentStore?.settings as any) || {}
      
      // Atualizar store
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          description: storeDescription,
          phone: storePhone,
          email: storeEmail,
          address: storeAddress,
          city: storeCity,
          state: storeState,
          cep: storeCep,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          settings: {
            ...currentSettings,
            primaryColor,
            secondaryColor,
            instagram,
            facebook,
            website,
            businessHours
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/25">
                <Store className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Dados da Loja
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Informações e personalização</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Status */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Dados salvos com sucesso!
          </div>
        )}

        {/* Informações Básicas */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              Informações Básicas
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="Ex: Açaí do João"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={e => setStorePhone(e.target.value)}
                  placeholder="(31) 99914-0095"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={storeDescription}
                onChange={e => setStoreDescription(e.target.value)}
                placeholder="Descreva sua loja em poucas palavras..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={storeEmail}
                onChange={e => setStoreEmail(e.target.value)}
                placeholder="contato@sualoja.com"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Endereço
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endereço Completo
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={e => setStoreAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
                <input
                  type="text"
                  value={storeCity}
                  onChange={e => setStoreCity(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <input
                  type="text"
                  value={storeState}
                  onChange={e => setStoreState(e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
                <input
                  type="text"
                  value={storeCep}
                  onChange={e => setStoreCep(e.target.value)}
                  placeholder="32.010-370"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Horário de Funcionamento
            </h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {businessHours.map(hour => (
                <div 
                  key={hour.day}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    hour.enabled ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-slate-50 border-2 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateBusinessHour(hour.day, 'enabled', !hour.enabled)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        hour.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${
                        hour.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className={`font-medium min-w-[80px] ${hour.enabled ? 'text-emerald-800' : 'text-slate-400'}`}>
                      {hour.dayName}
                    </span>
                  </div>
                  
                  {hour.enabled ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hour.open}
                        onChange={e => updateBusinessHour(hour.day, 'open', e.target.value)}
                        className="px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                      />
                      <span className="text-slate-400">às</span>
                      <input
                        type="time"
                        value={hour.close}
                        onChange={e => updateBusinessHour(hour.day, 'close', e.target.value)}
                        className="px-3 py-2 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual / Branding */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Visual e Marca
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL do Logo
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                {logoUrl && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                    <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL do Banner
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                {bannerUrl && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                    <img src={bannerUrl} alt="Banner" className="h-20 w-full object-cover rounded" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cor Principal
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-14 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cor Secundária
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-14 h-12 rounded-lg border-2 border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-500" />
              Redes Sociais
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                <Instagram className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="@seuinstagram"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl text-white">
                <Facebook className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                placeholder="facebook.com/suapagina"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-700 rounded-xl text-white">
                <Globe className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://seusite.com"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar Fixo */}
        <div className="sticky bottom-4 flex justify-center">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-green-600 shadow-xl shadow-emerald-500/30 px-8"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Dados da Loja
          </Button>
        </div>
      </div>
    </div>
  )
}
