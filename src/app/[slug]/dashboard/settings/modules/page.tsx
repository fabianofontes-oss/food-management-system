'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Settings, Store, Clock, Truck, CreditCard, Bell, Package,
  Star, Megaphone, Users, Tag, Calendar, UtensilsCrossed,
  Archive, Printer, ChefHat, BarChart3, FileText, MapPin,
  Loader2, Save, CheckCircle, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Info, ExternalLink, DollarSign,
  Percent, Timer, Hash, Smartphone, Mail, Volume2, Gift,
  ShoppingBag, Bike, Car, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ModuleSetting {
  key: string
  label: string
  description: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'currency'
  icon: React.ReactNode
  options?: { value: string; label: string }[]
  placeholder?: string
  defaultValue?: any
  suffix?: string
  prefix?: string
}

interface Module {
  id: string
  name: string
  description: string
  longDescription: string
  icon: React.ReactNode
  color: string
  bgColor: string
  category: 'sales' | 'operations' | 'marketing' | 'notifications'
  configPage?: string
  isCore?: boolean
  settings: ModuleSetting[]
}

const MODULES: Module[] = [
  // === VENDAS ===
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Entregas na casa do cliente',
    longDescription: 'Permite que seus clientes façam pedidos para entrega. Configure raio, taxas e tempo estimado.',
    icon: <Truck className="w-6 h-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'sales',
    settings: [
      { 
        key: 'delivery_enabled', 
        label: 'Ativar Delivery', 
        description: 'Habilita entregas para seus clientes',
        type: 'toggle', 
        icon: <Truck className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'delivery_radius', 
        label: 'Raio de Entrega', 
        description: 'Distância máxima para entregas',
        type: 'number', 
        icon: <MapPin className="w-4 h-4" />,
        placeholder: '5', 
        suffix: 'km',
        defaultValue: 5 
      },
      { 
        key: 'delivery_fee', 
        label: 'Taxa de Entrega', 
        description: 'Valor cobrado pela entrega',
        type: 'currency', 
        icon: <DollarSign className="w-4 h-4" />,
        placeholder: '5.00', 
        prefix: 'R$',
        defaultValue: 5 
      },
      { 
        key: 'min_order_delivery', 
        label: 'Pedido Mínimo', 
        description: 'Valor mínimo para fazer delivery',
        type: 'currency', 
        icon: <ShoppingBag className="w-4 h-4" />,
        placeholder: '20.00', 
        prefix: 'R$',
        defaultValue: 20 
      },
      { 
        key: 'delivery_time', 
        label: 'Tempo Estimado', 
        description: 'Tempo médio de entrega',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '45', 
        suffix: 'min',
        defaultValue: 45 
      },
      { 
        key: 'free_delivery_above', 
        label: 'Frete Grátis Acima de', 
        description: 'Valor para frete grátis (0 = desativado)',
        type: 'currency', 
        icon: <Gift className="w-4 h-4" />,
        placeholder: '50.00', 
        prefix: 'R$',
        defaultValue: 0 
      }
    ]
  },
  {
    id: 'pickup',
    name: 'Retirada na Loja',
    description: 'Cliente busca o pedido',
    longDescription: 'Permite pedidos para retirada no balcão. Ofereça desconto para incentivar!',
    icon: <Store className="w-6 h-6" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    category: 'sales',
    settings: [
      { 
        key: 'pickup_enabled', 
        label: 'Ativar Retirada', 
        description: 'Habilita retirada na loja',
        type: 'toggle', 
        icon: <Store className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'pickup_time', 
        label: 'Tempo para Retirada', 
        description: 'Tempo médio de preparo',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '20', 
        suffix: 'min',
        defaultValue: 20 
      },
      { 
        key: 'pickup_discount', 
        label: 'Desconto Retirada', 
        description: 'Desconto para quem retira',
        type: 'number', 
        icon: <Percent className="w-4 h-4" />,
        placeholder: '10', 
        suffix: '%',
        defaultValue: 0 
      }
    ]
  },
  {
    id: 'tables',
    name: 'Mesas e Comandas',
    description: 'Atendimento no local',
    longDescription: 'Gerencie mesas, comandas e pedidos presenciais. Ideal para restaurantes e bares.',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    category: 'sales',
    configPage: '/dashboard/tables',
    settings: [
      { 
        key: 'tables_enabled', 
        label: 'Ativar Mesas', 
        description: 'Habilita gestão de mesas',
        type: 'toggle', 
        icon: <UtensilsCrossed className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'table_count', 
        label: 'Número de Mesas', 
        description: 'Quantidade total de mesas',
        type: 'number', 
        icon: <Hash className="w-4 h-4" />,
        placeholder: '20', 
        defaultValue: 10 
      },
      { 
        key: 'service_fee', 
        label: 'Taxa de Serviço', 
        description: 'Gorjeta sugerida (10%)',
        type: 'number', 
        icon: <Percent className="w-4 h-4" />,
        placeholder: '10', 
        suffix: '%',
        defaultValue: 10 
      },
      { 
        key: 'table_qrcode', 
        label: 'QR Code nas Mesas', 
        description: 'Cliente faz pedido pelo celular',
        type: 'toggle', 
        icon: <Smartphone className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },
  {
    id: 'scheduling',
    name: 'Agendamento',
    description: 'Pedidos para data futura',
    longDescription: 'Permite que clientes agendem pedidos para uma data e hora específica.',
    icon: <Calendar className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'sales',
    settings: [
      { 
        key: 'scheduling_enabled', 
        label: 'Ativar Agendamento', 
        description: 'Permite pedidos agendados',
        type: 'toggle', 
        icon: <Calendar className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'min_advance_hours', 
        label: 'Antecedência Mínima', 
        description: 'Tempo mínimo para agendar',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '2', 
        suffix: 'horas',
        defaultValue: 2 
      },
      { 
        key: 'max_advance_days', 
        label: 'Antecedência Máxima', 
        description: 'Até quantos dias pode agendar',
        type: 'number', 
        icon: <Calendar className="w-4 h-4" />,
        placeholder: '7', 
        suffix: 'dias',
        defaultValue: 7 
      }
    ]
  },
  {
    id: 'reservations',
    name: 'Reservas',
    description: 'Reserva de mesas',
    longDescription: 'Sistema completo de reservas de mesas com confirmação automática.',
    icon: <Clock className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'sales',
    configPage: '/dashboard/reservations',
    settings: [
      { 
        key: 'reservations_enabled', 
        label: 'Ativar Reservas', 
        description: 'Permite reservas de mesas',
        type: 'toggle', 
        icon: <Clock className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'reservation_duration', 
        label: 'Duração Padrão', 
        description: 'Tempo da reserva',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '90', 
        suffix: 'min',
        defaultValue: 90 
      },
      { 
        key: 'max_party_size', 
        label: 'Máximo de Pessoas', 
        description: 'Limite por reserva',
        type: 'number', 
        icon: <Users className="w-4 h-4" />,
        placeholder: '20', 
        suffix: 'pessoas',
        defaultValue: 20 
      },
      { 
        key: 'reservation_advance_days', 
        label: 'Antecedência Máxima', 
        description: 'Dias para reservar',
        type: 'number', 
        icon: <Calendar className="w-4 h-4" />,
        placeholder: '30', 
        suffix: 'dias',
        defaultValue: 30 
      }
    ]
  },

  // === OPERAÇÕES ===
  {
    id: 'inventory',
    name: 'Controle de Estoque',
    description: 'Gestão de insumos',
    longDescription: 'Controle de estoque com alertas de baixa quantidade e baixa automática.',
    icon: <Archive className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'operations',
    configPage: '/dashboard/inventory',
    settings: [
      { 
        key: 'inventory_enabled', 
        label: 'Ativar Estoque', 
        description: 'Controle de inventário',
        type: 'toggle', 
        icon: <Archive className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'low_stock_alert', 
        label: 'Alerta Estoque Baixo', 
        description: 'Quando notificar',
        type: 'number', 
        icon: <AlertCircle className="w-4 h-4" />,
        placeholder: '10', 
        suffix: 'unid',
        defaultValue: 10 
      },
      { 
        key: 'auto_deduct', 
        label: 'Baixa Automática', 
        description: 'Reduz estoque ao vender',
        type: 'toggle', 
        icon: <Package className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },
  {
    id: 'kitchen',
    name: 'Cozinha (KDS)',
    description: 'Painel da cozinha',
    longDescription: 'Display de pedidos para a cozinha com gestão de preparo.',
    icon: <ChefHat className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'operations',
    configPage: '/dashboard/kitchen',
    settings: [
      { 
        key: 'kitchen_enabled', 
        label: 'Ativar KDS', 
        description: 'Painel da cozinha',
        type: 'toggle', 
        icon: <ChefHat className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'auto_accept', 
        label: 'Aceitar Automaticamente', 
        description: 'Pedidos entram direto',
        type: 'toggle', 
        icon: <CheckCircle className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'prep_time_alert', 
        label: 'Alerta de Atraso', 
        description: 'Notifica se demorar',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '30', 
        suffix: 'min',
        defaultValue: 30 
      }
    ]
  },
  {
    id: 'printer',
    name: 'Impressão',
    description: 'Comandas e recibos',
    longDescription: 'Impressão automática de comandas e recibos em impressora térmica.',
    icon: <Printer className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'operations',
    settings: [
      { 
        key: 'printer_enabled', 
        label: 'Ativar Impressão', 
        description: 'Imprime comandas',
        type: 'toggle', 
        icon: <Printer className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'auto_print', 
        label: 'Imprimir Automaticamente', 
        description: 'Imprime ao receber pedido',
        type: 'toggle', 
        icon: <Printer className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'printer_type', 
        label: 'Tipo de Impressora', 
        description: 'Modelo compatível',
        type: 'select', 
        icon: <Settings className="w-4 h-4" />,
        options: [
          { value: 'thermal80', label: 'Térmica 80mm' },
          { value: 'thermal58', label: 'Térmica 58mm' },
          { value: 'a4', label: 'A4 comum' }
        ], 
        defaultValue: 'thermal80' 
      },
      { 
        key: 'print_customer_copy', 
        label: 'Via do Cliente', 
        description: 'Imprime cópia para cliente',
        type: 'toggle', 
        icon: <FileText className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },

  // === MARKETING ===
  {
    id: 'coupons',
    name: 'Cupons de Desconto',
    description: 'Promoções e descontos',
    longDescription: 'Crie cupons promocionais com validade, limite de uso e condições.',
    icon: <Tag className="w-6 h-6" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'marketing',
    configPage: '/dashboard/coupons',
    settings: [
      { 
        key: 'coupons_enabled', 
        label: 'Ativar Cupons', 
        description: 'Permite uso de cupons',
        type: 'toggle', 
        icon: <Tag className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'show_coupon_field', 
        label: 'Campo de Cupom', 
        description: 'Exibe campo no checkout',
        type: 'toggle', 
        icon: <Tag className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },
  {
    id: 'loyalty',
    name: 'Programa Fidelidade',
    description: 'Pontos e recompensas',
    longDescription: 'Fidelize clientes com sistema de pontos, cashback e recompensas.',
    icon: <Users className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'marketing',
    configPage: '/dashboard/loyalty',
    settings: [
      { 
        key: 'loyalty_enabled', 
        label: 'Ativar Fidelidade', 
        description: 'Sistema de pontos',
        type: 'toggle', 
        icon: <Users className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'points_per_real', 
        label: 'Pontos por Real', 
        description: 'Quantos pontos ganha',
        type: 'number', 
        icon: <Star className="w-4 h-4" />,
        placeholder: '1', 
        suffix: 'pts/R$',
        defaultValue: 1 
      },
      { 
        key: 'min_points_redeem', 
        label: 'Mínimo para Resgate', 
        description: 'Pontos necessários',
        type: 'number', 
        icon: <Gift className="w-4 h-4" />,
        placeholder: '100', 
        suffix: 'pts',
        defaultValue: 100 
      },
      { 
        key: 'reward_value', 
        label: 'Valor da Recompensa', 
        description: 'Desconto ao resgatar',
        type: 'currency', 
        icon: <DollarSign className="w-4 h-4" />,
        placeholder: '10.00', 
        prefix: 'R$',
        defaultValue: 10 
      }
    ]
  },
  {
    id: 'reviews',
    name: 'Avaliações',
    description: 'Feedback dos clientes',
    longDescription: 'Colete avaliações e feedbacks para melhorar seu atendimento.',
    icon: <Star className="w-6 h-6" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    category: 'marketing',
    configPage: '/dashboard/reviews',
    settings: [
      { 
        key: 'reviews_enabled', 
        label: 'Ativar Avaliações', 
        description: 'Coleta feedbacks',
        type: 'toggle', 
        icon: <Star className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'auto_request_review', 
        label: 'Solicitar Automaticamente', 
        description: 'Pede avaliação após entrega',
        type: 'toggle', 
        icon: <Mail className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'review_request_delay', 
        label: 'Tempo para Solicitar', 
        description: 'Horas após a entrega',
        type: 'number', 
        icon: <Timer className="w-4 h-4" />,
        placeholder: '2', 
        suffix: 'horas',
        defaultValue: 2 
      }
    ]
  },
  {
    id: 'marketing',
    name: 'Campanhas',
    description: 'Marketing e CRM',
    longDescription: 'Envie campanhas, promoções e mantenha contato com seus clientes.',
    icon: <Megaphone className="w-6 h-6" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'marketing',
    configPage: '/dashboard/marketing',
    settings: [
      { 
        key: 'marketing_enabled', 
        label: 'Ativar Marketing', 
        description: 'Campanhas e CRM',
        type: 'toggle', 
        icon: <Megaphone className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },

  // === NOTIFICAÇÕES ===
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Notificações via WhatsApp',
    longDescription: 'Envie confirmações e atualizações de pedidos pelo WhatsApp.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'notifications',
    settings: [
      { 
        key: 'whatsapp_enabled', 
        label: 'Ativar WhatsApp', 
        description: 'Notificações via WhatsApp',
        type: 'toggle', 
        icon: <Smartphone className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'whatsapp_number', 
        label: 'Número da Loja', 
        description: 'WhatsApp para receber pedidos',
        type: 'text', 
        icon: <Smartphone className="w-4 h-4" />,
        placeholder: '5511999999999',
        defaultValue: '' 
      },
      { 
        key: 'notify_new_order', 
        label: 'Novos Pedidos', 
        description: 'Notifica quando receber pedido',
        type: 'toggle', 
        icon: <Bell className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'notify_customer', 
        label: 'Notificar Cliente', 
        description: 'Envia status para cliente',
        type: 'toggle', 
        icon: <Users className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },
  {
    id: 'email',
    name: 'E-mail',
    description: 'Notificações por e-mail',
    longDescription: 'Envie confirmações e recibos por e-mail.',
    icon: <Mail className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'notifications',
    settings: [
      { 
        key: 'email_enabled', 
        label: 'Ativar E-mail', 
        description: 'Notificações por e-mail',
        type: 'toggle', 
        icon: <Mail className="w-4 h-4" />,
        defaultValue: false 
      },
      { 
        key: 'email_confirmation', 
        label: 'Confirmação de Pedido', 
        description: 'Envia ao confirmar',
        type: 'toggle', 
        icon: <CheckCircle className="w-4 h-4" />,
        defaultValue: true 
      }
    ]
  },
  {
    id: 'sounds',
    name: 'Alertas Sonoros',
    description: 'Sons de notificação',
    longDescription: 'Configure sons para novos pedidos e alertas.',
    icon: <Volume2 className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'notifications',
    settings: [
      { 
        key: 'sounds_enabled', 
        label: 'Ativar Sons', 
        description: 'Alertas sonoros',
        type: 'toggle', 
        icon: <Volume2 className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'sound_new_order', 
        label: 'Som Novo Pedido', 
        description: 'Toca ao receber pedido',
        type: 'toggle', 
        icon: <Bell className="w-4 h-4" />,
        defaultValue: true 
      },
      { 
        key: 'sound_volume', 
        label: 'Volume', 
        description: 'Intensidade do som',
        type: 'select', 
        icon: <Volume2 className="w-4 h-4" />,
        options: [
          { value: 'low', label: 'Baixo' },
          { value: 'medium', label: 'Médio' },
          { value: 'high', label: 'Alto' }
        ],
        defaultValue: 'medium' 
      }
    ]
  }
]

const CATEGORIES = [
  { id: 'sales', name: '🛒 Vendas', description: 'Canais e formas de venda' },
  { id: 'operations', name: '⚙️ Operações', description: 'Gestão operacional' },
  { id: 'marketing', name: '📣 Marketing', description: 'Promoção e fidelização' },
  { id: 'notifications', name: '🔔 Notificações', description: 'Alertas e comunicação' }
]

export default function ModulesPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const [moduleSettings, setModuleSettings] = useState<Record<string, Record<string, any>>>({})
  const [expandedModules, setExpandedModules] = useState<string[]>([])

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
        const moduleConfigs = settings.moduleSettings || {}
        
        // Inicializar com valores padrão onde não existem
        const initialSettings: Record<string, Record<string, any>> = {}
        MODULES.forEach(module => {
          initialSettings[module.id] = {}
          module.settings.forEach(setting => {
            initialSettings[module.id][setting.key] = moduleConfigs[module.id]?.[setting.key] ?? setting.defaultValue
          })
        })
        
        setModuleSettings(initialSettings)
      }
      setLoading(false)
    }
    loadStore()
  }, [slug, supabase])

  const isModuleEnabled = (moduleId: string) => {
    const module = MODULES.find(m => m.id === moduleId)
    if (!module) return false
    const enabledKey = module.settings.find(s => s.key.endsWith('_enabled'))?.key
    if (!enabledKey) return true
    return moduleSettings[moduleId]?.[enabledKey] ?? false
  }

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const updateSetting = (moduleId: string, key: string, value: any) => {
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [key]: value
      }
    }))
    
    // Se ativou o módulo, expande automaticamente
    if (key.endsWith('_enabled') && value && !expandedModules.includes(moduleId)) {
      setExpandedModules(prev => [...prev, moduleId])
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
        moduleSettings: moduleSettings
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                <Settings className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              Módulos e Funcionalidades
            </h1>
            <p className="text-slate-500 mt-2 ml-14">Ative e configure cada recurso do sistema</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Status */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5" />
            Configurações salvas com sucesso!
          </div>
        )}

        {/* Categorias e Módulos */}
        {CATEGORIES.map(category => {
          const categoryModules = MODULES.filter(m => m.category === category.id)
          
          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-xl font-bold text-slate-800">{category.name}</h2>
                <span className="text-sm text-slate-400">{category.description}</span>
              </div>
              
              <div className="space-y-3">
                {categoryModules.map(module => {
                  const enabled = isModuleEnabled(module.id)
                  const expanded = expandedModules.includes(module.id)
                  const enabledKey = module.settings.find(s => s.key.endsWith('_enabled'))?.key
                  
                  return (
                    <div 
                      key={module.id}
                      className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        enabled 
                          ? 'border-violet-200 shadow-lg shadow-violet-100' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Header do Módulo */}
                      <div 
                        className="p-5 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpanded(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 ${module.bgColor} rounded-xl ${module.color}`}>
                            {module.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-lg">{module.name}</p>
                              {enabled && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{module.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {module.configPage && enabled && (
                            <Link 
                              href={`/${slug}${module.configPage}`}
                              onClick={e => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <ExternalLink className="w-3 h-3" />
                                Gerenciar
                              </Button>
                            </Link>
                          )}
                          
                          <div className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Configurações (Sanfona) */}
                      <div className={`transition-all duration-300 ease-in-out ${
                        expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      } overflow-hidden`}>
                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                          {/* Descrição longa */}
                          <p className="text-sm text-slate-600 mb-5 flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
                            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            {module.longDescription}
                          </p>
                          
                          {/* Settings */}
                          <div className="space-y-4">
                            {module.settings.map((setting, index) => {
                              const isMainToggle = setting.key.endsWith('_enabled')
                              const currentValue = moduleSettings[module.id]?.[setting.key] ?? setting.defaultValue
                              
                              return (
                                <div 
                                  key={setting.key}
                                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                                    isMainToggle 
                                      ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-100' 
                                      : 'bg-slate-50 border border-slate-100'
                                  } ${!enabled && !isMainToggle ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isMainToggle ? 'bg-violet-100 text-violet-600' : 'bg-white text-slate-500'}`}>
                                      {setting.icon}
                                    </div>
                                    <div>
                                      <p className={`font-medium ${isMainToggle ? 'text-violet-800' : 'text-slate-700'}`}>
                                        {setting.label}
                                      </p>
                                      <p className="text-xs text-slate-500">{setting.description}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {setting.type === 'toggle' ? (
                                      <button
                                        onClick={() => updateSetting(module.id, setting.key, !currentValue)}
                                        className={`transition-all ${isMainToggle ? 'scale-125' : ''}`}
                                        disabled={!enabled && !isMainToggle}
                                      >
                                        {currentValue ? (
                                          <ToggleRight className={`w-12 h-12 ${isMainToggle ? 'text-violet-500' : 'text-green-500'}`} />
                                        ) : (
                                          <ToggleLeft className="w-12 h-12 text-slate-300" />
                                        )}
                                      </button>
                                    ) : setting.type === 'select' ? (
                                      <select
                                        value={currentValue}
                                        onChange={e => updateSetting(module.id, setting.key, e.target.value)}
                                        disabled={!enabled}
                                        className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none text-sm min-w-[140px]"
                                      >
                                        {setting.options?.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        {setting.prefix && (
                                          <span className="text-sm text-slate-500">{setting.prefix}</span>
                                        )}
                                        <input
                                          type={setting.type === 'currency' ? 'number' : setting.type}
                                          step={setting.type === 'currency' ? '0.01' : '1'}
                                          value={currentValue}
                                          onChange={e => updateSetting(
                                            module.id, 
                                            setting.key, 
                                            setting.type === 'number' || setting.type === 'currency' 
                                              ? Number(e.target.value) 
                                              : e.target.value
                                          )}
                                          placeholder={setting.placeholder}
                                          disabled={!enabled}
                                          className="w-24 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:outline-none text-sm text-right"
                                        />
                                        {setting.suffix && (
                                          <span className="text-sm text-slate-500 min-w-[40px]">{setting.suffix}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
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
            className="bg-gradient-to-r from-violet-500 to-purple-600 shadow-xl shadow-violet-500/30 px-8"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  )
}
