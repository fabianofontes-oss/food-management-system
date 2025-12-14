'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/useSettings'
import { PDVSettings, DEFAULT_PDV_SETTINGS } from '@/types/settings'
import {
  Monitor, Save, Loader2, CheckCircle, ChevronDown, ChevronUp,
  LayoutGrid, Grid3X3, Image, Package, ScanBarcode, Scale, Percent, Users,
  FileText, Printer, Receipt, Archive, Volume2, Zap, CreditCard, DollarSign,
  Banknote, EyeOff, Settings, Palette, Clock, Keyboard, Calculator, Bell,
  Eye, Moon, Sun, Type, Lock, RefreshCw, Utensils, Gift, Minus, Plus,
  ShoppingCart, X, Search, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [settings, setSettings] = useState<PDVSettings>(DEFAULT_PDV_SETTINGS)
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
                  onClick={() => updateSetting('enabled', !settings.enabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.enabled ? 'left-8' : 'left-1'
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
                        <SettingSelect label="Tema" value={settings.theme} onChange={v => updateSetting('theme', v as any)}
                          options={[{ value: 'light', label: '☀️ Claro' }, { value: 'dark', label: '🌙 Escuro' }, { value: 'auto', label: '🔄 Automático' }]} />
                        <SettingSelect label="Layout" value={settings.layout} onChange={v => updateSetting('layout', v as any)}
                          options={[{ value: 'grid', label: 'Grade' }, { value: 'list', label: 'Lista' }, { value: 'compact', label: 'Compacto' }]} />
                        <SettingSelect label="Tamanho dos Cards" value={settings.productSize} onChange={v => updateSetting('productSize', v as any)}
                          options={[{ value: 'small', label: 'Pequeno' }, { value: 'medium', label: 'Médio' }, { value: 'large', label: 'Grande' }]} />
                        <SettingSelect label="Tamanho da Fonte" value={settings.fontSize} onChange={v => updateSetting('fontSize', v as any)}
                          options={[{ value: 'small', label: 'Pequena' }, { value: 'medium', label: 'Média' }, { value: 'large', label: 'Grande' }]} />
                        <SettingToggle label="Exibir Fotos" checked={settings.showImages} onChange={v => updateSetting('showImages', v)} />
                        <SettingColor label="Cor Principal" value={settings.primaryColor} onChange={v => updateSetting('primaryColor', v)} />
                      </>
                    )}

                    {section.id === 'stock' && (
                      <>
                        <SettingToggle label="Exibir Estoque" checked={settings.showStock} onChange={v => updateSetting('showStock', v)} />
                        <SettingNumber label="Alerta Estoque Baixo" value={settings.lowStockAlert} onChange={v => updateSetting('lowStockAlert', v)} suffix="unidades" />
                        <SettingToggle label="Ocultar Sem Estoque" checked={settings.hideOutOfStock} onChange={v => updateSetting('hideOutOfStock', v)} />
                      </>
                    )}

                    {section.id === 'hardware' && (
                      <>
                        <SettingToggle label="Leitor Código de Barras" checked={settings.barcodeEnabled} onChange={v => updateSetting('barcodeEnabled', v)} />
                        <SettingToggle label="Integração com Balança" checked={settings.scaleEnabled} onChange={v => updateSetting('scaleEnabled', v)} />
                        <SettingToggle label="Abrir Gaveta Automático" checked={settings.openDrawer} onChange={v => updateSetting('openDrawer', v)} />
                        <SettingToggle label="Sons de Feedback" checked={settings.soundEnabled} onChange={v => updateSetting('soundEnabled', v)} />
                      </>
                    )}

                    {section.id === 'printing' && (
                      <>
                        <SettingToggle label="Impressão Automática" checked={settings.autoPrint} onChange={v => updateSetting('autoPrint', v)} />
                        <SettingSelect label="Cópias do Cupom" value={settings.printCopies} onChange={v => updateSetting('printCopies', v)}
                          options={[{ value: '1', label: '1 via' }, { value: '2', label: '2 vias' }, { value: '3', label: '3 vias' }]} />
                        <SettingToggle label="Via do Cliente" checked={settings.printCustomerCopy} onChange={v => updateSetting('printCustomerCopy', v)} />
                        <SettingToggle label="Imprimir para Cozinha" checked={settings.printKitchen} onChange={v => updateSetting('printKitchen', v)} />
                      </>
                    )}

                    {section.id === 'permissions' && (
                      <>
                        <SettingToggle label="Permitir Descontos" checked={settings.discountEnabled} onChange={v => updateSetting('discountEnabled', v)} />
                        <SettingNumber label="Desconto Máximo (Operador)" value={settings.maxDiscount} onChange={v => updateSetting('maxDiscount', v)} suffix="%" />
                        <SettingNumber label="Desconto Máximo (Gerente)" value={settings.managerDiscount} onChange={v => updateSetting('managerDiscount', v)} suffix="%" />
                        <SettingToggle label="Exigir Cliente" checked={settings.requireCustomer} onChange={v => updateSetting('requireCustomer', v)} />
                        <SettingToggle label="Observações nos Itens" checked={settings.allowObs} onChange={v => updateSetting('allowObs', v)} />
                        <SettingToggle label="Senha p/ Cancelar Item" checked={settings.cancelItemPassword} onChange={v => updateSetting('cancelItemPassword', v)} />
                        <SettingToggle label="Senha p/ Reimprimir" checked={settings.reprintPassword} onChange={v => updateSetting('reprintPassword', v)} />
                      </>
                    )}

                    {section.id === 'payments' && (
                      <>
                        <SettingSelect label="Pagamento Padrão" value={settings.defaultPayment} onChange={v => updateSetting('defaultPayment', v as any)}
                          options={[{ value: 'money', label: '💵 Dinheiro' }, { value: 'debit', label: '💳 Débito' }, { value: 'credit', label: '💳 Crédito' }, { value: 'pix', label: '📱 PIX' }]} />
                        <SettingToggle label="Pagamento Dividido" checked={settings.allowSplitPayment} onChange={v => updateSetting('allowSplitPayment', v)} />
                        <SettingToggle label="Calcular Troco" checked={settings.calculateChange} onChange={v => updateSetting('calculateChange', v)} />
                        <SettingToggle label="Gorjeta" checked={settings.tipEnabled} onChange={v => updateSetting('tipEnabled', v)} />
                        {settings.tipEnabled && (
                          <SettingText label="Sugestões de Gorjeta (%)" value={settings.tipSuggestions} onChange={v => updateSetting('tipSuggestions', v)} placeholder="5,10,15" />
                        )}
                      </>
                    )}

                    {section.id === 'cashier' && (
                      <>
                        <SettingToggle label="Sangria de Caixa" checked={settings.sangriaEnabled} onChange={v => updateSetting('sangriaEnabled', v)} />
                        <SettingToggle label="Suprimento de Caixa" checked={settings.suprimentoEnabled} onChange={v => updateSetting('suprimentoEnabled', v)} />
                        <SettingToggle label="Fechamento Cego" checked={settings.blindClose} onChange={v => updateSetting('blindClose', v)} />
                        <SettingToggle label="Exigir Abertura de Turno" checked={settings.shiftRequired} onChange={v => updateSetting('shiftRequired', v)} />
                        <SettingNumber label="Logout Automático" value={settings.autoLogout} onChange={v => updateSetting('autoLogout', v)} suffix="min (0 = desativado)" />
                      </>
                    )}

                    {section.id === 'shortcuts' && (
                      <>
                        <SettingToggle label="Venda Rápida (F2)" checked={settings.quickSale} onChange={v => updateSetting('quickSale', v)} />
                        <SettingSelect label="F1" value={settings.shortcutF1} onChange={v => updateSetting('shortcutF1', v)}
                          options={[{ value: 'search', label: '🔍 Buscar Produto' }, { value: 'customer', label: '👤 Buscar Cliente' }, { value: 'none', label: 'Nenhum' }]} />
                        <SettingSelect label="F3" value={settings.shortcutF3} onChange={v => updateSetting('shortcutF3', v)}
                          options={[{ value: 'discount', label: '💰 Desconto' }, { value: 'obs', label: '📝 Observação' }, { value: 'none', label: 'Nenhum' }]} />
                        <SettingSelect label="F4" value={settings.shortcutF4} onChange={v => updateSetting('shortcutF4', v)}
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
              <div className={`p-4 ${settings.theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header do PDV */}
                <div className={`flex items-center justify-between mb-4 pb-3 border-b ${settings.theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: settings.primaryColor }}>
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className={`font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-slate-800'} ${settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : ''}`}>
                      PDV
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.barcodeEnabled && (
                      <div className={`p-1.5 rounded ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <ScanBarcode className={`w-4 h-4 ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
                      </div>
                    )}
                    <div className={`p-1.5 rounded ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <Search className={`w-4 h-4 ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
                    </div>
                  </div>
                </div>

                {/* Produtos Grid/List */}
                <div className={`mb-4 ${settings.layout === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}`}>
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className={`rounded-lg border overflow-hidden ${settings.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'} ${
                        settings.layout === 'list' ? 'flex items-center gap-2 p-2' : ''
                      }`}
                      style={{
                        height: settings.layout === 'grid' ? 
                          (settings.productSize === 'small' ? 60 : settings.productSize === 'large' ? 100 : 80) : 'auto'
                      }}
                    >
                      {settings.showImages && (
                        <div className={`bg-gradient-to-br from-slate-200 to-slate-300 ${settings.layout === 'list' ? 'w-10 h-10 rounded' : 'w-full h-1/2'}`} />
                      )}
                      <div className={`p-1 ${settings.layout === 'list' ? 'flex-1' : ''}`}>
                        <div className={`h-2 rounded ${settings.theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'} w-3/4 mb-1`} />
                        <div className={`h-2 rounded w-1/2`} style={{ backgroundColor: settings.primaryColor, opacity: 0.7 }} />
                        {settings.showStock && (
                          <div className={`h-1.5 rounded ${settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} w-1/3 mt-1`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carrinho */}
                <div className={`rounded-lg border p-3 ${settings.theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Carrinho</span>
                    <span className={`text-xs ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>3 itens</span>
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex items-center justify-between py-1 ${i < 3 ? `border-b ${settings.theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}` : ''}`}>
                        <div className={`h-2 rounded ${settings.theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'} w-1/3`} />
                        <div className={`h-2 rounded w-1/5`} style={{ backgroundColor: settings.primaryColor }} />
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 pt-2 border-t ${settings.theme === 'dark' ? 'border-slate-600' : 'border-slate-300'} flex justify-between`}>
                    <span className={`font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Total</span>
                    <span className="font-bold" style={{ color: settings.primaryColor }}>R$ 45,90</span>
                  </div>
                </div>

                {/* Botões de Pagamento */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {['💵', '💳', '💳', '📱'].map((icon, i) => (
                    <button
                      key={i}
                      className={`p-2 rounded-lg text-center text-sm ${
                        i === ['money', 'debit', 'credit', 'pix'].indexOf(settings.defaultPayment) 
                          ? '' 
                          : settings.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                      style={i === ['money', 'debit', 'credit', 'pix'].indexOf(settings.defaultPayment) ? { backgroundColor: settings.primaryColor } : {}}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Atalhos */}
                {settings.quickSale && (
                  <div className={`mt-3 p-2 rounded-lg text-center text-xs ${settings.theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
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
