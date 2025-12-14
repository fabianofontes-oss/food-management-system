'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Monitor, Save, Loader2, CheckCircle, ChevronDown, ChevronUp,
  LayoutGrid, Grid3X3, Image, Package, ScanBarcode, Scale, Percent, Users,
  FileText, Printer, Receipt, Archive, Volume2, Zap, CreditCard, DollarSign,
  Banknote, EyeOff, Settings, Palette, Clock, Keyboard, Calculator, Bell,
  Eye, Moon, Sun, Type, Lock, RefreshCw, Utensils, Gift, Minus, Plus,
  ShoppingCart, X, Search, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PDVSettings {
  // Interface
  pdv_enabled: boolean
  pdv_theme: 'light' | 'dark' | 'auto'
  pdv_layout: 'grid' | 'list' | 'compact'
  pdv_product_size: 'small' | 'medium' | 'large'
  pdv_show_images: boolean
  pdv_font_size: 'small' | 'medium' | 'large'
  pdv_primary_color: string
  
  // Estoque
  pdv_show_stock: boolean
  pdv_low_stock_alert: number
  pdv_hide_out_of_stock: boolean
  
  // Hardware
  pdv_barcode_enabled: boolean
  pdv_scale_enabled: boolean
  pdv_open_drawer: boolean
  pdv_sound_enabled: boolean
  
  // Impressão
  pdv_auto_print: boolean
  pdv_print_copies: string
  pdv_print_customer_copy: boolean
  pdv_print_kitchen: boolean
  
  // Descontos e Permissões
  pdv_discount_enabled: boolean
  pdv_max_discount: number
  pdv_manager_discount: number
  pdv_require_customer: boolean
  pdv_allow_obs: boolean
  pdv_cancel_item_password: boolean
  pdv_reprint_password: boolean
  
  // Pagamentos
  pdv_default_payment: 'money' | 'debit' | 'credit' | 'pix'
  pdv_allow_split_payment: boolean
  pdv_calculate_change: boolean
  pdv_tip_enabled: boolean
  pdv_tip_suggestions: string
  
  // Caixa
  pdv_sangria_enabled: boolean
  pdv_suprimento_enabled: boolean
  pdv_blind_close: boolean
  pdv_auto_logout: number
  pdv_shift_required: boolean
  
  // Atalhos
  pdv_quick_sale: boolean
  pdv_shortcut_f1: string
  pdv_shortcut_f2: string
  pdv_shortcut_f3: string
  pdv_shortcut_f4: string
}

const DEFAULT_SETTINGS: PDVSettings = {
  pdv_enabled: true,
  pdv_theme: 'light',
  pdv_layout: 'grid',
  pdv_product_size: 'medium',
  pdv_show_images: true,
  pdv_font_size: 'medium',
  pdv_primary_color: '#8B5CF6',
  pdv_show_stock: true,
  pdv_low_stock_alert: 5,
  pdv_hide_out_of_stock: false,
  pdv_barcode_enabled: true,
  pdv_scale_enabled: false,
  pdv_open_drawer: true,
  pdv_sound_enabled: true,
  pdv_auto_print: true,
  pdv_print_copies: '1',
  pdv_print_customer_copy: false,
  pdv_print_kitchen: true,
  pdv_discount_enabled: true,
  pdv_max_discount: 10,
  pdv_manager_discount: 30,
  pdv_require_customer: false,
  pdv_allow_obs: true,
  pdv_cancel_item_password: false,
  pdv_reprint_password: false,
  pdv_default_payment: 'money',
  pdv_allow_split_payment: true,
  pdv_calculate_change: true,
  pdv_tip_enabled: false,
  pdv_tip_suggestions: '5,10,15',
  pdv_sangria_enabled: true,
  pdv_suprimento_enabled: true,
  pdv_blind_close: false,
  pdv_auto_logout: 0,
  pdv_shift_required: false,
  pdv_quick_sale: true,
  pdv_shortcut_f1: 'search',
  pdv_shortcut_f2: 'quick_sale',
  pdv_shortcut_f3: 'discount',
  pdv_shortcut_f4: 'cancel'
}

const SECTIONS = [
  { id: 'interface', name: '🎨 Interface', icon: Palette },
  { id: 'stock', name: '📦 Estoque', icon: Package },
  { id: 'hardware', name: '🔌 Hardware', icon: Monitor },
  { id: 'printing', name: '🖨️ Impressão', icon: Printer },
  { id: 'permissions', name: '🔐 Permissões', icon: Lock },
  { id: 'payments', name: '💳 Pagamentos', icon: CreditCard },
  { id: 'cashier', name: '💰 Caixa', icon: DollarSign },
  { id: 'shortcuts', name: '⌨️ Atalhos', icon: Keyboard }
]

export default function PDVSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])

  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [settings, setSettings] = useState<PDVSettings>(DEFAULT_SETTINGS)
  const [expandedSections, setExpandedSections] = useState<string[]>(['interface'])

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('stores').select('id, settings').eq('slug', slug).single()
      if (data) {
        setStoreId(data.id)
        const storeSettings = (data.settings as any)?.pdv || {}
        setSettings(prev => ({ ...prev, ...storeSettings }))
      }
      setLoading(false)
    }
    loadSettings()
  }, [slug, supabase])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const updateSetting = <K extends keyof PDVSettings>(key: K, value: PDVSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!storeId) return
    setSaving(true)
    setSaveStatus('idle')
    try {
      const { data: store } = await supabase.from('stores').select('settings').eq('id', storeId).single()
      const currentSettings = (store?.settings as any) || {}
      const { error } = await supabase.from('stores').update({
        settings: { ...currentSettings, pdv: settings }
      }).eq('id', storeId)
      if (error) throw error
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Erro:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Configurações do PDV</h1>
              <p className="text-sm text-slate-500">Personalize o sistema de vendas no balcão</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Configurações do PDV salvas!
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda: Configurações */}
          <div className="space-y-4">
            {/* Toggle Principal */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Monitor className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Sistema PDV</p>
                    <p className="text-sm text-slate-500">Vendas no balcão e caixa</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('pdv_enabled', !settings.pdv_enabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.pdv_enabled ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.pdv_enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Seções de Configuração */}
            {SECTIONS.map(section => (
              <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-800">{section.name}</span>
                  </div>
                  {expandedSections.includes(section.id) ? 
                    <ChevronUp className="w-5 h-5 text-slate-400" /> :
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  }
                </button>

                {expandedSections.includes(section.id) && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                    {section.id === 'interface' && (
                      <>
                        <SettingSelect label="Tema" value={settings.pdv_theme} onChange={v => updateSetting('pdv_theme', v as any)}
                          options={[{ value: 'light', label: '☀️ Claro' }, { value: 'dark', label: '🌙 Escuro' }, { value: 'auto', label: '🔄 Automático' }]} />
                        <SettingSelect label="Layout" value={settings.pdv_layout} onChange={v => updateSetting('pdv_layout', v as any)}
                          options={[{ value: 'grid', label: 'Grade' }, { value: 'list', label: 'Lista' }, { value: 'compact', label: 'Compacto' }]} />
                        <SettingSelect label="Tamanho dos Cards" value={settings.pdv_product_size} onChange={v => updateSetting('pdv_product_size', v as any)}
                          options={[{ value: 'small', label: 'Pequeno' }, { value: 'medium', label: 'Médio' }, { value: 'large', label: 'Grande' }]} />
                        <SettingSelect label="Tamanho da Fonte" value={settings.pdv_font_size} onChange={v => updateSetting('pdv_font_size', v as any)}
                          options={[{ value: 'small', label: 'Pequena' }, { value: 'medium', label: 'Média' }, { value: 'large', label: 'Grande' }]} />
                        <SettingToggle label="Exibir Fotos" checked={settings.pdv_show_images} onChange={v => updateSetting('pdv_show_images', v)} />
                        <SettingColor label="Cor Principal" value={settings.pdv_primary_color} onChange={v => updateSetting('pdv_primary_color', v)} />
                      </>
                    )}

                    {section.id === 'stock' && (
                      <>
                        <SettingToggle label="Exibir Estoque" checked={settings.pdv_show_stock} onChange={v => updateSetting('pdv_show_stock', v)} />
                        <SettingNumber label="Alerta Estoque Baixo" value={settings.pdv_low_stock_alert} onChange={v => updateSetting('pdv_low_stock_alert', v)} suffix="unidades" />
                        <SettingToggle label="Ocultar Sem Estoque" checked={settings.pdv_hide_out_of_stock} onChange={v => updateSetting('pdv_hide_out_of_stock', v)} />
                      </>
                    )}

                    {section.id === 'hardware' && (
                      <>
                        <SettingToggle label="Leitor Código de Barras" checked={settings.pdv_barcode_enabled} onChange={v => updateSetting('pdv_barcode_enabled', v)} />
                        <SettingToggle label="Integração com Balança" checked={settings.pdv_scale_enabled} onChange={v => updateSetting('pdv_scale_enabled', v)} />
                        <SettingToggle label="Abrir Gaveta Automático" checked={settings.pdv_open_drawer} onChange={v => updateSetting('pdv_open_drawer', v)} />
                        <SettingToggle label="Sons de Feedback" checked={settings.pdv_sound_enabled} onChange={v => updateSetting('pdv_sound_enabled', v)} />
                      </>
                    )}

                    {section.id === 'printing' && (
                      <>
                        <SettingToggle label="Impressão Automática" checked={settings.pdv_auto_print} onChange={v => updateSetting('pdv_auto_print', v)} />
                        <SettingSelect label="Cópias do Cupom" value={settings.pdv_print_copies} onChange={v => updateSetting('pdv_print_copies', v)}
                          options={[{ value: '1', label: '1 via' }, { value: '2', label: '2 vias' }, { value: '3', label: '3 vias' }]} />
                        <SettingToggle label="Via do Cliente" checked={settings.pdv_print_customer_copy} onChange={v => updateSetting('pdv_print_customer_copy', v)} />
                        <SettingToggle label="Imprimir para Cozinha" checked={settings.pdv_print_kitchen} onChange={v => updateSetting('pdv_print_kitchen', v)} />
                      </>
                    )}

                    {section.id === 'permissions' && (
                      <>
                        <SettingToggle label="Permitir Descontos" checked={settings.pdv_discount_enabled} onChange={v => updateSetting('pdv_discount_enabled', v)} />
                        <SettingNumber label="Desconto Máximo (Operador)" value={settings.pdv_max_discount} onChange={v => updateSetting('pdv_max_discount', v)} suffix="%" />
                        <SettingNumber label="Desconto Máximo (Gerente)" value={settings.pdv_manager_discount} onChange={v => updateSetting('pdv_manager_discount', v)} suffix="%" />
                        <SettingToggle label="Exigir Cliente" checked={settings.pdv_require_customer} onChange={v => updateSetting('pdv_require_customer', v)} />
                        <SettingToggle label="Observações nos Itens" checked={settings.pdv_allow_obs} onChange={v => updateSetting('pdv_allow_obs', v)} />
                        <SettingToggle label="Senha p/ Cancelar Item" checked={settings.pdv_cancel_item_password} onChange={v => updateSetting('pdv_cancel_item_password', v)} />
                        <SettingToggle label="Senha p/ Reimprimir" checked={settings.pdv_reprint_password} onChange={v => updateSetting('pdv_reprint_password', v)} />
                      </>
                    )}

                    {section.id === 'payments' && (
                      <>
                        <SettingSelect label="Pagamento Padrão" value={settings.pdv_default_payment} onChange={v => updateSetting('pdv_default_payment', v as any)}
                          options={[{ value: 'money', label: '💵 Dinheiro' }, { value: 'debit', label: '💳 Débito' }, { value: 'credit', label: '💳 Crédito' }, { value: 'pix', label: '📱 PIX' }]} />
                        <SettingToggle label="Pagamento Dividido" checked={settings.pdv_allow_split_payment} onChange={v => updateSetting('pdv_allow_split_payment', v)} />
                        <SettingToggle label="Calcular Troco" checked={settings.pdv_calculate_change} onChange={v => updateSetting('pdv_calculate_change', v)} />
                        <SettingToggle label="Gorjeta" checked={settings.pdv_tip_enabled} onChange={v => updateSetting('pdv_tip_enabled', v)} />
                        {settings.pdv_tip_enabled && (
                          <SettingText label="Sugestões de Gorjeta (%)" value={settings.pdv_tip_suggestions} onChange={v => updateSetting('pdv_tip_suggestions', v)} placeholder="5,10,15" />
                        )}
                      </>
                    )}

                    {section.id === 'cashier' && (
                      <>
                        <SettingToggle label="Sangria de Caixa" checked={settings.pdv_sangria_enabled} onChange={v => updateSetting('pdv_sangria_enabled', v)} />
                        <SettingToggle label="Suprimento de Caixa" checked={settings.pdv_suprimento_enabled} onChange={v => updateSetting('pdv_suprimento_enabled', v)} />
                        <SettingToggle label="Fechamento Cego" checked={settings.pdv_blind_close} onChange={v => updateSetting('pdv_blind_close', v)} />
                        <SettingToggle label="Exigir Abertura de Turno" checked={settings.pdv_shift_required} onChange={v => updateSetting('pdv_shift_required', v)} />
                        <SettingNumber label="Logout Automático" value={settings.pdv_auto_logout} onChange={v => updateSetting('pdv_auto_logout', v)} suffix="min (0 = desativado)" />
                      </>
                    )}

                    {section.id === 'shortcuts' && (
                      <>
                        <SettingToggle label="Venda Rápida (F2)" checked={settings.pdv_quick_sale} onChange={v => updateSetting('pdv_quick_sale', v)} />
                        <SettingSelect label="F1" value={settings.pdv_shortcut_f1} onChange={v => updateSetting('pdv_shortcut_f1', v)}
                          options={[{ value: 'search', label: '🔍 Buscar Produto' }, { value: 'customer', label: '👤 Buscar Cliente' }, { value: 'none', label: 'Nenhum' }]} />
                        <SettingSelect label="F3" value={settings.pdv_shortcut_f3} onChange={v => updateSetting('pdv_shortcut_f3', v)}
                          options={[{ value: 'discount', label: '💰 Desconto' }, { value: 'obs', label: '📝 Observação' }, { value: 'none', label: 'Nenhum' }]} />
                        <SettingSelect label="F4" value={settings.pdv_shortcut_f4} onChange={v => updateSetting('pdv_shortcut_f4', v)}
                          options={[{ value: 'cancel', label: '❌ Cancelar Venda' }, { value: 'clear', label: '🗑️ Limpar Carrinho' }, { value: 'none', label: 'Nenhum' }]} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Coluna Direita: Preview do PDV */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-medium text-slate-700">Preview do PDV</span>
                <span className="text-xs text-slate-400">Visualização em tempo real</span>
              </div>

              {/* Mini PDV Preview */}
              <div className={`p-4 ${settings.pdv_theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header do PDV */}
                <div className={`flex items-center justify-between mb-4 pb-3 border-b ${settings.pdv_theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.pdv_primary_color }}>
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className={`font-bold ${settings.pdv_theme === 'dark' ? 'text-white' : 'text-slate-800'} ${settings.pdv_font_size === 'small' ? 'text-sm' : settings.pdv_font_size === 'large' ? 'text-lg' : ''}`}>
                      PDV
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.pdv_barcode_enabled && (
                      <div className={`p-1.5 rounded ${settings.pdv_theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <ScanBarcode className={`w-4 h-4 ${settings.pdv_theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
                      </div>
                    )}
                    <div className={`p-1.5 rounded ${settings.pdv_theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <Search className={`w-4 h-4 ${settings.pdv_theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
                    </div>
                  </div>
                </div>

                {/* Produtos Grid/List */}
                <div className={`mb-4 ${settings.pdv_layout === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}`}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className={`rounded-lg border overflow-hidden ${settings.pdv_theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} ${
                        settings.pdv_layout === 'list' ? 'flex items-center gap-2 p-2' : ''
                      }`}
                      style={{
                        height: settings.pdv_layout === 'grid' ? 
                          (settings.pdv_product_size === 'small' ? 60 : settings.pdv_product_size === 'large' ? 100 : 80) : 'auto'
                      }}
                    >
                      {settings.pdv_show_images && (
                        <div className={`bg-gradient-to-br from-slate-200 to-slate-300 ${settings.pdv_layout === 'list' ? 'w-10 h-10 rounded' : 'w-full h-1/2'}`} />
                      )}
                      <div className={`p-1 ${settings.pdv_layout === 'list' ? 'flex-1' : ''}`}>
                        <div className={`h-2 rounded ${settings.pdv_theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'} w-3/4 mb-1`} />
                        <div className={`h-2 rounded w-1/2`} style={{ backgroundColor: settings.pdv_primary_color, opacity: 0.7 }} />
                        {settings.pdv_show_stock && (
                          <div className={`h-1.5 rounded ${settings.pdv_theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} w-1/3 mt-1`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carrinho */}
                <div className={`rounded-lg border p-3 ${settings.pdv_theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${settings.pdv_theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Carrinho</span>
                    <span className={`text-xs ${settings.pdv_theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>3 itens</span>
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex items-center justify-between py-1 ${i < 3 ? `border-b ${settings.pdv_theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}` : ''}`}>
                        <div className={`h-2 rounded ${settings.pdv_theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'} w-1/3`} />
                        <div className={`h-2 rounded w-1/5`} style={{ backgroundColor: settings.pdv_primary_color }} />
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 pt-2 border-t ${settings.pdv_theme === 'dark' ? 'border-slate-600' : 'border-slate-300'} flex justify-between`}>
                    <span className={`font-bold ${settings.pdv_theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Total</span>
                    <span className="font-bold" style={{ color: settings.pdv_primary_color }}>R$ 45,90</span>
                  </div>
                </div>

                {/* Botões de Pagamento */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {['💵', '💳', '💳', '📱'].map((icon, i) => (
                    <button
                      key={i}
                      className={`p-2 rounded-lg text-center text-sm ${
                        i === ['money', 'debit', 'credit', 'pix'].indexOf(settings.pdv_default_payment) 
                          ? '' 
                          : settings.pdv_theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                      style={i === ['money', 'debit', 'credit', 'pix'].indexOf(settings.pdv_default_payment) ? { backgroundColor: settings.pdv_primary_color } : {}}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Atalhos */}
                {settings.pdv_quick_sale && (
                  <div className={`mt-3 p-2 rounded-lg text-center text-xs ${settings.pdv_theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    F2 = Venda Rápida em Dinheiro
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function SettingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-2 py-1 text-sm border border-slate-200 rounded-lg bg-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function SettingNumber({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center"
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

function SettingText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-24 px-2 py-1 text-sm border border-slate-200 rounded-lg"
      />
    </div>
  )
}

function SettingColor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0"
        />
        <span className="text-xs text-slate-500 font-mono">{value}</span>
      </div>
    </div>
  )
}
