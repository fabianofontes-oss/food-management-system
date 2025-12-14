'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Link2, Truck, Star, Package, Bike, Car,
  Loader2, Save, CheckCircle, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Info, ExternalLink, AlertCircle,
  Lock, Unlock, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PlatformSetting {
  key: string
  label: string
  description: string
  type: 'text' | 'toggle' | 'password'
  placeholder?: string
  defaultValue?: any
}

interface Platform {
  id: string
  name: string
  description: string
  longDescription: string
  icon: string
  color: string
  bgColor: string
  category: 'delivery' | 'shipping' | 'reviews'
  apiStatus: 'available' | 'limited' | 'closed'
  settings: PlatformSetting[]
}

const PLATFORMS: Platform[] = [
  // === PLATAFORMAS DE DELIVERY ===
  {
    id: 'ifood',
    name: 'iFood',
    description: 'Receba pedidos do iFood',
    longDescription: 'Integre com o iFood para receber pedidos diretamente no sistema. A API do iFood é restrita a parceiros.',
    icon: '🍔',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'delivery',
    apiStatus: 'limited',
    settings: [
      { key: 'ifood_enabled', label: 'Ativar iFood', description: 'Receber pedidos do iFood', type: 'toggle', defaultValue: false },
      { key: 'ifood_merchant_id', label: 'Merchant ID', description: 'ID do restaurante no iFood', type: 'text', placeholder: 'Seu Merchant ID' },
      { key: 'ifood_client_id', label: 'Client ID', description: 'Credencial de acesso', type: 'text', placeholder: 'Client ID da API' },
      { key: 'ifood_client_secret', label: 'Client Secret', description: 'Chave secreta', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    id: 'rappi',
    name: 'Rappi',
    description: 'Receba pedidos da Rappi',
    longDescription: 'Integre com a Rappi para unificar pedidos. API disponível para parceiros.',
    icon: '🛵',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'delivery',
    apiStatus: 'limited',
    settings: [
      { key: 'rappi_enabled', label: 'Ativar Rappi', description: 'Receber pedidos da Rappi', type: 'toggle', defaultValue: false },
      { key: 'rappi_store_id', label: 'Store ID', description: 'ID da loja na Rappi', type: 'text', placeholder: 'Seu Store ID' },
      { key: 'rappi_api_key', label: 'API Key', description: 'Chave de acesso', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    description: 'Receba pedidos do Uber Eats',
    longDescription: 'Integre com o Uber Eats para receber pedidos. API restrita a parceiros.',
    icon: '🚗',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'delivery',
    apiStatus: 'limited',
    settings: [
      { key: 'ubereats_enabled', label: 'Ativar Uber Eats', description: 'Receber pedidos do Uber Eats', type: 'toggle', defaultValue: false },
      { key: 'ubereats_store_id', label: 'Store ID', description: 'ID da loja no Uber Eats', type: 'text', placeholder: 'Seu Store ID' },
      { key: 'ubereats_client_id', label: 'Client ID', description: 'Credencial de acesso', type: 'text', placeholder: 'Client ID' },
      { key: 'ubereats_client_secret', label: 'Client Secret', description: 'Chave secreta', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    id: '99food',
    name: '99 Food',
    description: 'Receba pedidos do 99 Food',
    longDescription: 'Integre com o 99 Food para receber pedidos.',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'delivery',
    apiStatus: 'closed',
    settings: [
      { key: '99food_enabled', label: 'Ativar 99 Food', description: 'Receber pedidos do 99 Food', type: 'toggle', defaultValue: false },
      { key: '99food_store_id', label: 'Store ID', description: 'ID da loja', type: 'text', placeholder: 'Seu Store ID' }
    ]
  },

  // === PLATAFORMAS DE ENTREGA ===
  {
    id: 'loggi',
    name: 'Loggi',
    description: 'Entregas via Loggi',
    longDescription: 'Use entregadores da Loggi para suas entregas. API disponível.',
    icon: '📦',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'shipping',
    apiStatus: 'available',
    settings: [
      { key: 'loggi_enabled', label: 'Ativar Loggi', description: 'Usar Loggi para entregas', type: 'toggle', defaultValue: false },
      { key: 'loggi_api_key', label: 'API Key', description: 'Chave de acesso da Loggi', type: 'password', placeholder: '••••••••' },
      { key: 'loggi_auto_dispatch', label: 'Despacho Automático', description: 'Enviar para Loggi automaticamente', type: 'toggle', defaultValue: false }
    ]
  },
  {
    id: 'lalamove',
    name: 'Lalamove',
    description: 'Entregas via Lalamove',
    longDescription: 'Use entregadores da Lalamove para suas entregas.',
    icon: '🚚',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    category: 'shipping',
    apiStatus: 'available',
    settings: [
      { key: 'lalamove_enabled', label: 'Ativar Lalamove', description: 'Usar Lalamove para entregas', type: 'toggle', defaultValue: false },
      { key: 'lalamove_api_key', label: 'API Key', description: 'Chave de acesso', type: 'password', placeholder: '••••••••' },
      { key: 'lalamove_api_secret', label: 'API Secret', description: 'Chave secreta', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    id: '99entrega',
    name: '99 Entrega',
    description: 'Entregas via 99',
    longDescription: 'Use entregadores da 99 para suas entregas.',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    category: 'shipping',
    apiStatus: 'limited',
    settings: [
      { key: '99entrega_enabled', label: 'Ativar 99 Entrega', description: 'Usar 99 para entregas', type: 'toggle', defaultValue: false },
      { key: '99entrega_token', label: 'Token', description: 'Token de acesso', type: 'password', placeholder: '••••••••' }
    ]
  },
  {
    id: 'uber_direct',
    name: 'Uber Direct',
    description: 'Entregas via Uber',
    longDescription: 'Use entregadores da Uber para suas entregas.',
    icon: '⚫',
    color: 'text-slate-800',
    bgColor: 'bg-slate-100',
    category: 'shipping',
    apiStatus: 'available',
    settings: [
      { key: 'uber_direct_enabled', label: 'Ativar Uber Direct', description: 'Usar Uber para entregas', type: 'toggle', defaultValue: false },
      { key: 'uber_direct_client_id', label: 'Client ID', description: 'Credencial de acesso', type: 'text', placeholder: 'Client ID' },
      { key: 'uber_direct_client_secret', label: 'Client Secret', description: 'Chave secreta', type: 'password', placeholder: '••••••••' }
    ]
  },

  // === PLATAFORMAS DE AVALIAÇÕES ===
  {
    id: 'google_reviews',
    name: 'Google Meu Negócio',
    description: 'Importe avaliações do Google',
    longDescription: 'Conecte sua conta do Google para importar avaliações automaticamente. API disponível via OAuth.',
    icon: '🔍',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    category: 'reviews',
    apiStatus: 'available',
    settings: [
      { key: 'google_reviews_enabled', label: 'Ativar Google Reviews', description: 'Importar do Google', type: 'toggle', defaultValue: false }
    ]
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    description: 'Importe avaliações do TripAdvisor',
    longDescription: 'Importe avaliações do TripAdvisor. API limitada.',
    icon: '🦉',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    category: 'reviews',
    apiStatus: 'closed',
    settings: [
      { key: 'tripadvisor_enabled', label: 'Ativar TripAdvisor', description: 'Cadastro manual', type: 'toggle', defaultValue: false },
      { key: 'tripadvisor_url', label: 'URL do Perfil', description: 'Link do seu restaurante', type: 'text', placeholder: 'https://tripadvisor.com/...' }
    ]
  },
  {
    id: 'facebook_reviews',
    name: 'Facebook',
    description: 'Importe avaliações do Facebook',
    longDescription: 'Importe avaliações da sua página do Facebook.',
    icon: '📘',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'reviews',
    apiStatus: 'limited',
    settings: [
      { key: 'facebook_reviews_enabled', label: 'Ativar Facebook', description: 'Importar do Facebook', type: 'toggle', defaultValue: false },
      { key: 'facebook_page_id', label: 'Page ID', description: 'ID da página', type: 'text', placeholder: 'ID da sua página' }
    ]
  }
]

const CATEGORIES = [
  { id: 'delivery', name: '📦 Plataformas de Delivery', description: 'Receba pedidos de marketplaces', icon: <Package className="w-5 h-5" /> },
  { id: 'shipping', name: '🚚 Plataformas de Entrega', description: 'Terceirize suas entregas', icon: <Truck className="w-5 h-5" /> },
  { id: 'reviews', name: '⭐ Plataformas de Avaliações', description: 'Unifique seus feedbacks', icon: <Star className="w-5 h-5" /> }
]

export default function PlatformsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [platformSettings, setPlatformSettings] = useState<Record<string, Record<string, any>>>({})
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>([])
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, settings')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStoreId(data.id)
        const settings = data.settings as any || {}
        const platforms = settings.platforms || {}
        
        // Inicializar com valores padrão
        const initialSettings: Record<string, Record<string, any>> = {}
        PLATFORMS.forEach(platform => {
          initialSettings[platform.id] = {}
          platform.settings.forEach(setting => {
            initialSettings[platform.id][setting.key] = platforms[platform.id]?.[setting.key] ?? setting.defaultValue ?? ''
          })
        })
        
        setPlatformSettings(initialSettings)
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  const isPlatformEnabled = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId)
    if (!platform) return false
    const enabledKey = platform.settings.find(s => s.key.endsWith('_enabled'))?.key
    if (!enabledKey) return false
    return platformSettings[platformId]?.[enabledKey] ?? false
  }

  const toggleExpanded = (platformId: string) => {
    setExpandedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const updateSetting = (platformId: string, key: string, value: any) => {
    setPlatformSettings(prev => ({
      ...prev,
      [platformId]: {
        ...(prev[platformId] || {}),
        [key]: value
      }
    }))
    
    if (key.endsWith('_enabled') && value && !expandedPlatforms.includes(platformId)) {
      setExpandedPlatforms(prev => [...prev, platformId])
    }
  }

  const handleSave = async () => {
    if (!storeId) return
    
    setSaving(true)
    setSaveStatus('idle')
    
    try {
      const { data: currentStore } = await supabase
        .from('stores')
        .select('settings')
        .eq('id', storeId)
        .single()
      
      const currentSettings = (currentStore?.settings as any) || {}
      
      const newSettings = {
        ...currentSettings,
        platforms: platformSettings
      }
      
      const { error } = await supabase
        .from('stores')
        .update({ settings: newSettings })
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

  const getApiStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Unlock className="w-3 h-3" /> API Disponível
          </span>
        )
      case 'limited':
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> API Limitada
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" /> API Fechada
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                <Link2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Plataformas e Integrações
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Conecte com marketplaces e serviços externos</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Status */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Configurações salvas com sucesso!
          </div>
        )}

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Sobre as APIs:</strong> Algumas plataformas têm APIs fechadas ou limitadas. 
            Onde a API não está disponível, oferecemos cadastro manual ou importação via CSV.
          </div>
        </div>

        {/* Categorias e Plataformas */}
        {CATEGORIES.map(category => {
          const categoryPlatforms = PLATFORMS.filter(p => p.category === category.id)
          
          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-xl font-bold text-slate-800">{category.name}</h2>
                <span className="text-sm text-slate-400">{category.description}</span>
              </div>
              
              <div className="grid gap-3">
                {categoryPlatforms.map(platform => {
                  const enabled = isPlatformEnabled(platform.id)
                  const expanded = expandedPlatforms.includes(platform.id)
                  const enabledKey = platform.settings.find(s => s.key.endsWith('_enabled'))?.key
                  
                  return (
                    <div 
                      key={platform.id}
                      className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        enabled 
                          ? 'border-blue-200 shadow-lg shadow-blue-100' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Header */}
                      <div 
                        className="p-5 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpanded(platform.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 ${platform.bgColor} rounded-xl text-3xl`}>
                            {platform.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-800 text-lg">{platform.name}</p>
                              {getApiStatusBadge(platform.apiStatus)}
                              {enabled && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{platform.description}</p>
                          </div>
                        </div>
                        
                        <div className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      
                      {/* Settings */}
                      <div className={`transition-all duration-300 ease-in-out ${
                        expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden`}>
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                          <p className="text-sm text-slate-600 mb-5 flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
                            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            {platform.longDescription}
                          </p>
                          
                          <div className="space-y-4">
                            {platform.settings.map(setting => {
                              const isMainToggle = setting.key.endsWith('_enabled')
                              const currentValue = platformSettings[platform.id]?.[setting.key] ?? setting.defaultValue ?? ''
                              
                              return (
                                <div 
                                  key={setting.key}
                                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                                    isMainToggle 
                                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100' 
                                      : 'bg-slate-50 border border-slate-100'
                                  } ${!enabled && !isMainToggle ? 'opacity-50' : ''}`}
                                >
                                  <div>
                                    <p className={`font-medium ${isMainToggle ? 'text-blue-800' : 'text-slate-700'}`}>
                                      {setting.label}
                                    </p>
                                    <p className="text-xs text-slate-500">{setting.description}</p>
                                  </div>
                                  
                                  {setting.type === 'toggle' ? (
                                    <button
                                      onClick={() => updateSetting(platform.id, setting.key, !currentValue)}
                                      className={`transition-all ${isMainToggle ? 'scale-125' : ''}`}
                                      disabled={!enabled && !isMainToggle}
                                    >
                                      {currentValue ? (
                                        <ToggleRight className={`w-12 h-12 ${isMainToggle ? 'text-blue-500' : 'text-green-500'}`} />
                                      ) : (
                                        <ToggleLeft className="w-12 h-12 text-slate-300" />
                                      )}
                                    </button>
                                  ) : setting.type === 'password' ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type={showPasswords[setting.key] ? 'text' : 'password'}
                                        value={currentValue}
                                        onChange={e => updateSetting(platform.id, setting.key, e.target.value)}
                                        placeholder={setting.placeholder}
                                        disabled={!enabled}
                                        className="w-48 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                                        className="p-2 text-slate-400 hover:text-slate-600"
                                      >
                                        {showPasswords[setting.key] ? '👁️' : '👁️‍🗨️'}
                                      </button>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={currentValue}
                                      onChange={e => updateSetting(platform.id, setting.key, e.target.value)}
                                      placeholder={setting.placeholder}
                                      disabled={!enabled}
                                      className="w-48 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Link para página específica se for reviews */}
                          {platform.category === 'reviews' && enabled && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <Link href={`/${slug}/dashboard/reviews/integrations`}>
                                <Button variant="outline" className="w-full gap-2">
                                  <Settings className="w-4 h-4" />
                                  Gerenciar Avaliações Importadas
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Botão Salvar Fixo */}
        <div className="sticky bottom-4 flex justify-center">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 px-8"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Integrações
          </Button>
        </div>
      </div>
    </div>
  )
}
