import { 
  Store, Clock, Truck, CreditCard, Bell, Package, Star, Megaphone, Users, Tag, Calendar, UtensilsCrossed,
  Archive, Printer, ChefHat, BarChart3, FileText, MapPin, DollarSign, Percent, Timer, Hash, Smartphone, 
  Mail, Volume2, Gift, ShoppingBag
} from 'lucide-react'

export interface ModuleSetting {
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

export interface Module {
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

export const CATEGORIES = [
  { id: 'sales', name: '💰 Vendas', description: 'Canais de venda' },
  { id: 'operations', name: '⚙️ Operações', description: 'Gestão interna' },
  { id: 'marketing', name: '📣 Marketing', description: 'Promoções e fidelidade' },
  { id: 'notifications', name: '🔔 Notificações', description: 'Comunicação' }
]

export const MODULES: Module[] = [
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
      { key: 'delivery_enabled', label: 'Ativar Delivery', description: 'Habilita entregas para seus clientes', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true },
      { key: 'delivery_radius', label: 'Raio de Entrega', description: 'Distância máxima para entregas', type: 'number', icon: <MapPin className="w-4 h-4" />, placeholder: '5', suffix: 'km', defaultValue: 5 },
      { key: 'delivery_fee', label: 'Taxa de Entrega', description: 'Valor cobrado pela entrega', type: 'currency', icon: <DollarSign className="w-4 h-4" />, placeholder: '5.00', prefix: 'R$', defaultValue: 5 },
      { key: 'min_order_delivery', label: 'Pedido Mínimo', description: 'Valor mínimo para fazer delivery', type: 'currency', icon: <ShoppingBag className="w-4 h-4" />, placeholder: '20.00', prefix: 'R$', defaultValue: 20 },
      { key: 'delivery_time', label: 'Tempo Estimado', description: 'Tempo médio de entrega', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '45', suffix: 'min', defaultValue: 45 },
      { key: 'free_delivery_above', label: 'Frete Grátis Acima de', description: 'Valor para frete grátis (0 = desativado)', type: 'currency', icon: <Gift className="w-4 h-4" />, placeholder: '50.00', prefix: 'R$', defaultValue: 0 }
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
      { key: 'pickup_enabled', label: 'Ativar Retirada', description: 'Habilita retirada na loja', type: 'toggle', icon: <Store className="w-4 h-4" />, defaultValue: true },
      { key: 'pickup_time', label: 'Tempo para Retirada', description: 'Tempo médio de preparo', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '20', suffix: 'min', defaultValue: 20 },
      { key: 'pickup_discount', label: 'Desconto Retirada', description: 'Desconto para quem retira', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '10', suffix: '%', defaultValue: 0 }
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
      { key: 'tables_enabled', label: 'Ativar Mesas', description: 'Habilita gestão de mesas', type: 'toggle', icon: <UtensilsCrossed className="w-4 h-4" />, defaultValue: false },
      { key: 'table_count', label: 'Número de Mesas', description: 'Quantidade total de mesas', type: 'number', icon: <Hash className="w-4 h-4" />, placeholder: '20', defaultValue: 10 },
      { key: 'service_fee', label: 'Taxa de Serviço', description: 'Gorjeta sugerida (10%)', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '10', suffix: '%', defaultValue: 10 },
      { key: 'table_qrcode', label: 'QR Code nas Mesas', description: 'Cliente faz pedido pelo celular', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: true }
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
      { key: 'scheduling_enabled', label: 'Ativar Agendamento', description: 'Permite pedidos agendados', type: 'toggle', icon: <Calendar className="w-4 h-4" />, defaultValue: false },
      { key: 'min_advance_hours', label: 'Antecedência Mínima', description: 'Tempo mínimo para agendar', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '2', suffix: 'horas', defaultValue: 2 },
      { key: 'max_advance_days', label: 'Antecedência Máxima', description: 'Até quantos dias pode agendar', type: 'number', icon: <Calendar className="w-4 h-4" />, placeholder: '7', suffix: 'dias', defaultValue: 7 }
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
      { key: 'reservations_enabled', label: 'Ativar Reservas', description: 'Permite reservas de mesas', type: 'toggle', icon: <Clock className="w-4 h-4" />, defaultValue: false },
      { key: 'reservation_duration', label: 'Duração Padrão', description: 'Tempo da reserva', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '90', suffix: 'min', defaultValue: 90 },
      { key: 'max_party_size', label: 'Máximo de Pessoas', description: 'Limite por reserva', type: 'number', icon: <Users className="w-4 h-4" />, placeholder: '20', suffix: 'pessoas', defaultValue: 20 },
      { key: 'reservation_advance_days', label: 'Antecedência Máxima', description: 'Dias para reservar', type: 'number', icon: <Calendar className="w-4 h-4" />, placeholder: '30', suffix: 'dias', defaultValue: 30 }
    ]
  },

  // === OPERAÇÕES ===
  {
    id: 'inventory',
    name: 'Controle de Estoque',
    description: 'Gestão de insumos',
    longDescription: 'Controle o estoque de ingredientes e receba alertas de baixa quantidade.',
    icon: <Archive className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'operations',
    configPage: '/dashboard/inventory',
    settings: [
      { key: 'inventory_enabled', label: 'Ativar Estoque', description: 'Habilita controle de estoque', type: 'toggle', icon: <Archive className="w-4 h-4" />, defaultValue: false },
      { key: 'low_stock_alert', label: 'Alerta de Estoque Baixo', description: 'Quantidade para alerta', type: 'number', icon: <Bell className="w-4 h-4" />, placeholder: '10', suffix: 'unid', defaultValue: 10 },
      { key: 'auto_deduct', label: 'Dedução Automática', description: 'Deduz estoque ao vender', type: 'toggle', icon: <Package className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'kitchen',
    name: 'Cozinha (KDS)',
    description: 'Painel de pedidos',
    longDescription: 'Sistema de display para a cozinha com gestão de pedidos em tempo real.',
    icon: <ChefHat className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'operations',
    configPage: '/dashboard/kitchen',
    settings: [
      { key: 'kitchen_enabled', label: 'Ativar Cozinha', description: 'Habilita painel da cozinha', type: 'toggle', icon: <ChefHat className="w-4 h-4" />, defaultValue: true },
      { key: 'auto_accept', label: 'Aceitar Automaticamente', description: 'Pedidos aceitos sem revisão', type: 'toggle', icon: <Clock className="w-4 h-4" />, defaultValue: false },
      { key: 'prep_time_alert', label: 'Alerta de Atraso', description: 'Minutos para alertar atraso', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '30', suffix: 'min', defaultValue: 30 }
    ]
  },
  {
    id: 'printer',
    name: 'Impressão',
    description: 'Comandas automáticas',
    longDescription: 'Imprima comandas automaticamente na cozinha ao receber pedidos.',
    icon: <Printer className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'operations',
    settings: [
      { key: 'printer_enabled', label: 'Ativar Impressão', description: 'Habilita impressão de comandas', type: 'toggle', icon: <Printer className="w-4 h-4" />, defaultValue: false },
      { key: 'auto_print', label: 'Impressão Automática', description: 'Imprime ao receber pedido', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: true },
      { key: 'printer_type', label: 'Tipo de Impressora', description: 'Modelo da impressora', type: 'select', icon: <Printer className="w-4 h-4" />, options: [{ value: 'thermal80', label: 'Térmica 80mm' }, { value: 'thermal58', label: 'Térmica 58mm' }, { value: 'a4', label: 'A4' }], defaultValue: 'thermal80' }
    ]
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Análises e métricas',
    longDescription: 'Relatórios detalhados de vendas, produtos e performance do negócio.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'operations',
    configPage: '/dashboard/reports',
    isCore: true,
    settings: [
      { key: 'reports_enabled', label: 'Relatórios Ativados', description: 'Funcionalidade principal', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: true },
      { key: 'daily_summary', label: 'Resumo Diário', description: 'Envia resumo por e-mail', type: 'toggle', icon: <Mail className="w-4 h-4" />, defaultValue: false }
    ]
  },

  // === MARKETING ===
  {
    id: 'reviews',
    name: 'Avaliações',
    description: 'Feedback dos clientes',
    longDescription: 'Colete e gerencie avaliações dos seus clientes para melhorar o serviço.',
    icon: <Star className="w-6 h-6" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'marketing',
    configPage: '/dashboard/reviews',
    settings: [
      { key: 'reviews_enabled', label: 'Ativar Avaliações', description: 'Permite clientes avaliar', type: 'toggle', icon: <Star className="w-4 h-4" />, defaultValue: true },
      { key: 'auto_request', label: 'Solicitar Automaticamente', description: 'Pede avaliação após pedido', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'min_rating_display', label: 'Nota Mínima p/ Exibir', description: 'Só mostra acima desta nota', type: 'number', icon: <Star className="w-4 h-4" />, placeholder: '3', defaultValue: 1 }
    ]
  },
  {
    id: 'coupons',
    name: 'Cupons',
    description: 'Descontos e promoções',
    longDescription: 'Crie cupons de desconto para atrair e fidelizar clientes.',
    icon: <Tag className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'marketing',
    configPage: '/dashboard/coupons',
    settings: [
      { key: 'coupons_enabled', label: 'Ativar Cupons', description: 'Permite uso de cupons', type: 'toggle', icon: <Tag className="w-4 h-4" />, defaultValue: true },
      { key: 'max_discount_percent', label: 'Desconto Máximo', description: 'Limite de desconto permitido', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '50', suffix: '%', defaultValue: 50 }
    ]
  },
  {
    id: 'loyalty',
    name: 'Fidelidade',
    description: 'Programa de pontos',
    longDescription: 'Crie um programa de fidelidade para recompensar clientes frequentes.',
    icon: <Users className="w-6 h-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    category: 'marketing',
    configPage: '/dashboard/crm',
    settings: [
      { key: 'loyalty_enabled', label: 'Ativar Fidelidade', description: 'Habilita programa de pontos', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: false },
      { key: 'points_per_real', label: 'Pontos por Real', description: 'Quantos pontos por R$1', type: 'number', icon: <DollarSign className="w-4 h-4" />, placeholder: '10', suffix: 'pts', defaultValue: 10 },
      { key: 'points_to_redeem', label: 'Pontos para Resgatar', description: 'Mínimo para trocar', type: 'number', icon: <Gift className="w-4 h-4" />, placeholder: '100', suffix: 'pts', defaultValue: 100 }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campanhas e promoções',
    longDescription: 'Crie campanhas de marketing e promoções especiais para seus clientes.',
    icon: <Megaphone className="w-6 h-6" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'marketing',
    configPage: '/dashboard/marketing',
    settings: [
      { key: 'marketing_enabled', label: 'Ativar Marketing', description: 'Habilita campanhas', type: 'toggle', icon: <Megaphone className="w-4 h-4" />, defaultValue: true },
      { key: 'push_notifications', label: 'Push Notifications', description: 'Envia notificações push', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: false }
    ]
  },

  // === NOTIFICAÇÕES ===
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Notificações via WhatsApp',
    longDescription: 'Envie notificações de pedidos e promoções pelo WhatsApp.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'notifications',
    settings: [
      { key: 'whatsapp_enabled', label: 'Ativar WhatsApp', description: 'Habilita notificações WhatsApp', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: false },
      { key: 'whatsapp_number', label: 'Número WhatsApp', description: 'Número com DDD', type: 'text', icon: <Smartphone className="w-4 h-4" />, placeholder: '5511999999999', defaultValue: '' },
      { key: 'notify_new_order', label: 'Notificar Novos Pedidos', description: 'Avisa quando chega pedido', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'notify_customer', label: 'Notificar Cliente', description: 'Envia status ao cliente', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'email',
    name: 'E-mail',
    description: 'Notificações por e-mail',
    longDescription: 'Configure e-mails automáticos para confirmação de pedidos e promoções.',
    icon: <Mail className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'notifications',
    settings: [
      { key: 'email_enabled', label: 'Ativar E-mail', description: 'Habilita notificações por e-mail', type: 'toggle', icon: <Mail className="w-4 h-4" />, defaultValue: false },
      { key: 'email_confirmation', label: 'Confirmação de Pedido', description: 'Envia e-mail de confirmação', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'sounds',
    name: 'Alertas Sonoros',
    description: 'Sons de notificação',
    longDescription: 'Configure sons para alertar novos pedidos e outras notificações importantes.',
    icon: <Volume2 className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    category: 'notifications',
    settings: [
      { key: 'sounds_enabled', label: 'Ativar Sons', description: 'Habilita alertas sonoros', type: 'toggle', icon: <Volume2 className="w-4 h-4" />, defaultValue: true },
      { key: 'new_order_sound', label: 'Som de Novo Pedido', description: 'Toca ao receber pedido', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'sound_volume', label: 'Volume', description: 'Nível do som', type: 'select', icon: <Volume2 className="w-4 h-4" />, options: [{ value: 'low', label: 'Baixo' }, { value: 'medium', label: 'Médio' }, { value: 'high', label: 'Alto' }], defaultValue: 'medium' }
    ]
  }
]
