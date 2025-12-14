import { 
  Store, Clock, Truck, CreditCard, Bell, Package, Star, Megaphone, Users, Tag, Calendar, UtensilsCrossed,
  Archive, Printer, ChefHat, BarChart3, FileText, MapPin, DollarSign, Percent, Timer, Hash, Smartphone, 
  Mail, Volume2, Gift, ShoppingBag, Wallet, QrCode, Banknote, Building2, Globe, Image, Palette, Phone,
  Link2, Bike, Car, Zap, MessageSquare, Send, Instagram, Facebook, Monitor, ScanBarcode, Scale, Calculator,
  Receipt, CreditCard as CardIcon, Layers, Eye, EyeOff, Grid3X3, LayoutGrid, ShoppingCart, Utensils
} from 'lucide-react'

export interface ModuleSetting {
  key: string
  label: string
  description?: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'currency' | 'time'
  icon?: React.ReactNode
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
  category: 'store' | 'sales' | 'payments' | 'operations' | 'integrations' | 'marketing' | 'notifications'
  subcategory?: 'delivery_platforms' | 'payment_gateways' | 'payment_machines' | 'fiscal' | 'erp' | 'communication' | 'analytics' | 'maps' | 'crm'
  configPage?: string
  isCore?: boolean
  hasCustomCard?: boolean
  requiresSuperadmin?: boolean
  settings: ModuleSetting[]
}

export const CATEGORIES = [
  { id: 'store', name: '🏪 Minha Loja', description: 'Dados e aparência' },
  { id: 'sales', name: '💰 Vendas', description: 'Canais de venda' },
  { id: 'payments', name: '💳 Pagamentos', description: 'Formas de pagamento' },
  { id: 'operations', name: '⚙️ Operações', description: 'Gestão interna' },
  { id: 'integrations', name: '🔗 Integrações', description: 'Plataformas externas' },
  { id: 'marketing', name: '📣 Marketing', description: 'Promoções e fidelidade' },
  { id: 'notifications', name: '🔔 Notificações', description: 'Comunicação' }
]

export const MODULES: Module[] = [
  // === MINHA LOJA ===
  {
    id: 'store_info',
    name: 'Dados da Loja',
    description: 'Informações básicas',
    longDescription: 'Configure nome, descrição, telefone, e-mail e endereço da sua loja.',
    icon: <Store className="w-6 h-6" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    category: 'store',
    isCore: true,
    settings: [
      { key: 'store_name', label: 'Nome da Loja', description: 'Nome exibido para clientes', type: 'text', icon: <Store className="w-4 h-4" />, placeholder: 'Minha Loja', defaultValue: '' },
      { key: 'store_phone', label: 'Telefone', description: 'Contato principal', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: '(11) 99999-9999', defaultValue: '' },
      { key: 'store_email', label: 'E-mail', description: 'E-mail de contato', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'contato@loja.com', defaultValue: '' },
      { key: 'store_address', label: 'Endereço', description: 'Endereço completo', type: 'text', icon: <MapPin className="w-4 h-4" />, placeholder: 'Rua, número, bairro', defaultValue: '' }
    ]
  },
  {
    id: 'store_hours',
    name: 'Horários de Funcionamento',
    description: 'Dias e horários da loja',
    longDescription: 'Configure os horários de funcionamento para cada dia da semana.',
    icon: <Clock className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'store',
    hasCustomCard: true,
    settings: [
      { key: 'hours_enabled', label: 'Controle de Horários', description: 'Fecha automaticamente fora do horário', type: 'toggle', icon: <Clock className="w-4 h-4" />, defaultValue: true },
      { key: 'hours_monday_open', label: 'Segunda - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_monday_close', label: 'Segunda - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_monday_closed', label: 'Segunda - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_tuesday_open', label: 'Terça - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_tuesday_close', label: 'Terça - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_tuesday_closed', label: 'Terça - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_wednesday_open', label: 'Quarta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_wednesday_close', label: 'Quarta - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_wednesday_closed', label: 'Quarta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_thursday_open', label: 'Quinta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_thursday_close', label: 'Quinta - Fecha', type: 'time', defaultValue: '22:00' },
      { key: 'hours_thursday_closed', label: 'Quinta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_friday_open', label: 'Sexta - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_friday_close', label: 'Sexta - Fecha', type: 'time', defaultValue: '23:00' },
      { key: 'hours_friday_closed', label: 'Sexta - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_saturday_open', label: 'Sábado - Abre', type: 'time', defaultValue: '08:00' },
      { key: 'hours_saturday_close', label: 'Sábado - Fecha', type: 'time', defaultValue: '23:00' },
      { key: 'hours_saturday_closed', label: 'Sábado - Fechado', type: 'toggle', defaultValue: false },
      { key: 'hours_sunday_open', label: 'Domingo - Abre', type: 'time', defaultValue: '10:00' },
      { key: 'hours_sunday_close', label: 'Domingo - Fecha', type: 'time', defaultValue: '20:00' },
      { key: 'hours_sunday_closed', label: 'Domingo - Fechado', type: 'toggle', defaultValue: false }
    ]
  },
  {
    id: 'social_media',
    name: 'Redes Sociais',
    description: 'Links e perfis sociais',
    longDescription: 'Configure todas as redes sociais da sua loja para seus clientes te encontrarem facilmente.',
    icon: <Globe className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'store',
    hasCustomCard: true,
    settings: [
      { key: 'social_enabled', label: 'Exibir Redes Sociais', description: 'Mostra os links no cardápio/minisite', type: 'toggle', icon: <Globe className="w-4 h-4" />, defaultValue: true },
      { key: 'social_instagram', label: 'Instagram', description: '@usuario ou link completo', type: 'text', icon: <Instagram className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_facebook', label: 'Facebook', description: 'Link da página', type: 'text', icon: <Facebook className="w-4 h-4" />, placeholder: 'facebook.com/minhaloja', defaultValue: '' },
      { key: 'social_whatsapp', label: 'WhatsApp Business', description: 'Número com DDD', type: 'text', icon: <MessageSquare className="w-4 h-4" />, placeholder: '11999999999', defaultValue: '' },
      { key: 'social_tiktok', label: 'TikTok', description: '@usuario', type: 'text', icon: <Zap className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_youtube', label: 'YouTube', description: 'Link do canal', type: 'text', icon: <Monitor className="w-4 h-4" />, placeholder: 'youtube.com/@minhaloja', defaultValue: '' },
      { key: 'social_twitter', label: 'X (Twitter)', description: '@usuario', type: 'text', icon: <Send className="w-4 h-4" />, placeholder: '@minhaloja', defaultValue: '' },
      { key: 'social_linkedin', label: 'LinkedIn', description: 'Link da empresa', type: 'text', icon: <Link2 className="w-4 h-4" />, placeholder: 'linkedin.com/company/minhaloja', defaultValue: '' },
      { key: 'social_website', label: 'Site Oficial', description: 'URL do site', type: 'text', icon: <Globe className="w-4 h-4" />, placeholder: 'www.minhaloja.com.br', defaultValue: '' },
      { key: 'social_ifood', label: 'iFood', description: 'Link do restaurante no iFood', type: 'text', icon: <ShoppingBag className="w-4 h-4" />, placeholder: 'ifood.com.br/delivery/...', defaultValue: '' },
      { key: 'social_rappi', label: 'Rappi', description: 'Link do restaurante no Rappi', type: 'text', icon: <Bike className="w-4 h-4" />, placeholder: 'rappi.com.br/...', defaultValue: '' },
      { key: 'social_custom1_name', label: 'Rede Personalizada 1 - Nome', description: 'Nome da rede', type: 'text', placeholder: 'Pinterest', defaultValue: '' },
      { key: 'social_custom1_url', label: 'Rede Personalizada 1 - Link', description: 'URL completa', type: 'text', placeholder: 'https://...', defaultValue: '' },
      { key: 'social_custom2_name', label: 'Rede Personalizada 2 - Nome', description: 'Nome da rede', type: 'text', placeholder: 'Telegram', defaultValue: '' },
      { key: 'social_custom2_url', label: 'Rede Personalizada 2 - Link', description: 'URL completa', type: 'text', placeholder: 'https://...', defaultValue: '' }
    ]
  },

  // === VENDAS ===
  {
    id: 'pdv',
    name: 'PDV (Ponto de Venda)',
    description: 'Sistema de caixa completo',
    longDescription: 'Configure o comportamento do sistema de caixa, impressão, descontos e interface.',
    icon: <Monitor className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'sales',
    hasCustomCard: true,
    settings: [
      { key: 'pdv_enabled', label: 'Sistema PDV Ativo', description: 'Habilita o módulo de vendas no balcão', type: 'toggle', icon: <Monitor className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_layout', label: 'Layout da Tela', description: 'Como organizar produtos e carrinho', type: 'select', icon: <LayoutGrid className="w-4 h-4" />, options: [{ value: 'grid', label: 'Grade de Produtos' }, { value: 'list', label: 'Lista Vertical' }, { value: 'compact', label: 'Compacto (mais itens)' }], defaultValue: 'grid' },
      { key: 'pdv_product_size', label: 'Tamanho dos Cards', description: 'Tamanho dos produtos na grade', type: 'select', icon: <Grid3X3 className="w-4 h-4" />, options: [{ value: 'small', label: 'Pequeno (80px)' }, { value: 'medium', label: 'Médio (120px)' }, { value: 'large', label: 'Grande (160px)' }], defaultValue: 'medium' },
      { key: 'pdv_show_images', label: 'Exibir Fotos dos Produtos', description: 'Mostra imagem nos cards', type: 'toggle', icon: <Image className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_show_stock', label: 'Exibir Estoque Disponível', description: 'Mostra quantidade em estoque', type: 'toggle', icon: <Package className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_low_stock_alert', label: 'Alerta de Estoque Baixo', description: 'Destaca produtos com pouco estoque', type: 'number', icon: <Bell className="w-4 h-4" />, placeholder: '5', defaultValue: 5 },
      { key: 'pdv_barcode_enabled', label: 'Leitor de Código de Barras', description: 'Busca produto por código', type: 'toggle', icon: <ScanBarcode className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_scale_enabled', label: 'Integração com Balança', description: 'Para produtos vendidos por peso', type: 'toggle', icon: <Scale className="w-4 h-4" />, defaultValue: false },
      { key: 'pdv_discount_enabled', label: 'Permitir Descontos', description: 'Operador pode dar desconto', type: 'toggle', icon: <Percent className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_max_discount', label: 'Desconto Máximo (%)', description: 'Limite de desconto sem gerente', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '10', defaultValue: 10, suffix: '%' },
      { key: 'pdv_manager_discount', label: 'Desconto com Senha Gerente (%)', description: 'Desconto máximo com autorização', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '30', defaultValue: 30, suffix: '%' },
      { key: 'pdv_require_customer', label: 'Obrigar Identificação do Cliente', description: 'Não finaliza sem cliente', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: false },
      { key: 'pdv_allow_obs', label: 'Observações nos Itens', description: 'Permite adicionar notas aos produtos', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_auto_print', label: 'Impressão Automática', description: 'Imprime cupom ao finalizar', type: 'toggle', icon: <Printer className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_print_copies', label: 'Cópias do Cupom', description: 'Quantas vias imprimir', type: 'select', icon: <Receipt className="w-4 h-4" />, options: [{ value: '1', label: '1 via' }, { value: '2', label: '2 vias' }, { value: '3', label: '3 vias' }], defaultValue: '1' },
      { key: 'pdv_open_drawer', label: 'Abrir Gaveta Automaticamente', description: 'Abre ao receber dinheiro', type: 'toggle', icon: <Archive className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_sound_enabled', label: 'Sons de Feedback', description: 'Bip ao adicionar item', type: 'toggle', icon: <Volume2 className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_quick_sale', label: 'Venda Rápida (F2)', description: 'Atalho para finalizar em dinheiro', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_default_payment', label: 'Forma de Pagamento Padrão', description: 'Seleção inicial ao finalizar', type: 'select', icon: <CreditCard className="w-4 h-4" />, options: [{ value: 'money', label: 'Dinheiro' }, { value: 'debit', label: 'Débito' }, { value: 'credit', label: 'Crédito' }, { value: 'pix', label: 'PIX' }], defaultValue: 'money' },
      { key: 'pdv_sangria_enabled', label: 'Sangria de Caixa', description: 'Permite retirada de valores', type: 'toggle', icon: <DollarSign className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_suprimento_enabled', label: 'Suprimento de Caixa', description: 'Permite entrada de valores', type: 'toggle', icon: <Banknote className="w-4 h-4" />, defaultValue: true },
      { key: 'pdv_blind_close', label: 'Fechamento Cego', description: 'Operador informa valor sem ver sistema', type: 'toggle', icon: <EyeOff className="w-4 h-4" />, defaultValue: false }
    ]
  },
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
      { key: 'table_qrcode', label: 'QR Code nas Mesas', description: 'Cliente faz pedido pelo celular', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: true },
      { key: 'table_show_waiter', label: 'Mostrar Garçom', description: 'Exibe qual garçom atende cada mesa', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: true },
      { key: 'table_show_time', label: 'Tempo na Mesa', description: 'Mostra quanto tempo cliente está na mesa', type: 'toggle', icon: <Timer className="w-4 h-4" />, defaultValue: true },
      { key: 'table_split_bill', label: 'Dividir Conta', description: 'Permite dividir conta entre pessoas', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: true }
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
      { key: 'min_advance_hours', label: 'Antecedência Mínima', description: 'Tempo mínimo para agendar', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '6', suffix: 'horas', defaultValue: 6 },
      { key: 'max_advance_days', label: 'Antecedência Máxima', description: 'Até quantos dias pode agendar', type: 'number', icon: <Calendar className="w-4 h-4" />, placeholder: '10', suffix: 'dias', defaultValue: 10 }
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

  // === PAGAMENTOS ===
  {
    id: 'pix',
    name: 'PIX',
    description: 'Pagamento instantâneo',
    longDescription: 'Receba pagamentos via PIX com QR Code automático.',
    icon: <QrCode className="w-6 h-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    category: 'payments',
    settings: [
      { key: 'pix_enabled', label: 'Aceitar PIX', description: 'Habilita pagamento via PIX', type: 'toggle', icon: <QrCode className="w-4 h-4" />, defaultValue: true },
      { key: 'pix_key_type', label: 'Tipo da Chave', description: 'CPF, CNPJ, E-mail ou Telefone', type: 'select', icon: <QrCode className="w-4 h-4" />, options: [{ value: 'cpf', label: 'CPF' }, { value: 'cnpj', label: 'CNPJ' }, { value: 'email', label: 'E-mail' }, { value: 'phone', label: 'Telefone' }, { value: 'random', label: 'Chave Aleatória' }], defaultValue: 'cpf' },
      { key: 'pix_key', label: 'Chave PIX', description: 'Sua chave para receber', type: 'text', icon: <QrCode className="w-4 h-4" />, placeholder: 'Sua chave PIX', defaultValue: '' },
      { key: 'pix_name', label: 'Nome do Beneficiário', description: 'Nome que aparece no PIX', type: 'text', icon: <Users className="w-4 h-4" />, placeholder: 'Nome completo', defaultValue: '' }
    ]
  },
  {
    id: 'credit_card',
    name: 'Cartão de Crédito',
    description: 'Crédito na entrega',
    longDescription: 'Aceite cartão de crédito na máquina na entrega ou retirada.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'payments',
    settings: [
      { key: 'credit_enabled', label: 'Aceitar Crédito', description: 'Habilita cartão de crédito', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: true },
      { key: 'credit_min_value', label: 'Valor Mínimo', description: 'Mínimo para aceitar cartão', type: 'currency', icon: <DollarSign className="w-4 h-4" />, placeholder: '10.00', prefix: 'R$', defaultValue: 0 },
      { key: 'credit_installments', label: 'Parcelamento', description: 'Máximo de parcelas', type: 'number', icon: <CreditCard className="w-4 h-4" />, placeholder: '3', suffix: 'x', defaultValue: 1 }
    ]
  },
  {
    id: 'debit_card',
    name: 'Cartão de Débito',
    description: 'Débito na entrega',
    longDescription: 'Aceite cartão de débito na máquina na entrega ou retirada.',
    icon: <Wallet className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'payments',
    settings: [
      { key: 'debit_enabled', label: 'Aceitar Débito', description: 'Habilita cartão de débito', type: 'toggle', icon: <Wallet className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    description: 'Pagamento em espécie',
    longDescription: 'Aceite pagamento em dinheiro na entrega ou retirada.',
    icon: <Banknote className="w-6 h-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'payments',
    settings: [
      { key: 'cash_enabled', label: 'Aceitar Dinheiro', description: 'Habilita pagamento em dinheiro', type: 'toggle', icon: <Banknote className="w-4 h-4" />, defaultValue: true },
      { key: 'cash_change', label: 'Troco Disponível', description: 'Oferece troco na entrega', type: 'toggle', icon: <DollarSign className="w-4 h-4" />, defaultValue: true }
    ]
  },

  // === OPERAÇÕES ===
  {
    id: 'drivers',
    name: 'Entregadores',
    description: 'Gestão de motoboys',
    longDescription: 'Configure como pagar seus entregadores: por entrega, porcentagem ou turno.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-lime-600',
    bgColor: 'bg-lime-100',
    category: 'operations',
    configPage: '/dashboard/delivery',
    settings: [
      { key: 'drivers_enabled', label: 'Gestão de Entregadores', description: 'Ativa controle de motoboys', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: true },
      { key: 'driver_payment_type', label: 'Tipo de Pagamento', description: 'Como pagar o entregador', type: 'select', icon: <DollarSign className="w-4 h-4" />, options: [{ value: 'per_delivery', label: 'Valor por Entrega' }, { value: 'percentage', label: 'Porcentagem (%)' }, { value: 'shift', label: 'Valor por Turno' }, { value: 'mixed', label: 'Combinado (Fixo + %)' }], defaultValue: 'per_delivery' },
      { key: 'driver_fixed_value', label: 'Valor Fixo por Entrega', description: 'Quanto pagar por cada entrega', type: 'currency', icon: <Banknote className="w-4 h-4" />, placeholder: '5.00', prefix: 'R$', defaultValue: 5 },
      { key: 'driver_percentage', label: 'Porcentagem do Pedido', description: '% do valor do pedido', type: 'number', icon: <Percent className="w-4 h-4" />, placeholder: '10', suffix: '%', defaultValue: 10 },
      { key: 'driver_shift_value', label: 'Valor do Turno', description: 'Valor fixo por turno de trabalho', type: 'currency', icon: <Clock className="w-4 h-4" />, placeholder: '50.00', prefix: 'R$', defaultValue: 50 },
      { key: 'driver_shift_hours', label: 'Horas por Turno', description: 'Duração do turno', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '6', suffix: 'h', defaultValue: 6 },
      { key: 'driver_min_guarantee', label: 'Garantia Mínima', description: 'Valor mínimo garantido por turno', type: 'currency', icon: <DollarSign className="w-4 h-4" />, placeholder: '30.00', prefix: 'R$', defaultValue: 0 },
      { key: 'driver_bonus_enabled', label: 'Bônus por Meta', description: 'Paga bônus ao atingir meta', type: 'toggle', icon: <Gift className="w-4 h-4" />, defaultValue: false },
      { key: 'driver_bonus_target', label: 'Meta de Entregas', description: 'Entregas para ganhar bônus', type: 'number', icon: <Hash className="w-4 h-4" />, placeholder: '20', suffix: 'entregas', defaultValue: 20 },
      { key: 'driver_bonus_value', label: 'Valor do Bônus', description: 'Bônus ao atingir meta', type: 'currency', icon: <Gift className="w-4 h-4" />, placeholder: '20.00', prefix: 'R$', defaultValue: 20 }
    ]
  },
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
      { key: 'prep_time_alert', label: 'Alerta de Atraso', description: 'Minutos para alertar atraso', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '30', suffix: 'min', defaultValue: 30 },
      { key: 'kitchen_show_customer', label: 'Mostrar Nome do Cliente', description: 'Exibe nome no painel', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: true },
      { key: 'kitchen_show_obs', label: 'Destacar Observações', description: 'Observações em destaque', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: true },
      { key: 'kitchen_group_items', label: 'Agrupar Itens Iguais', description: 'Agrupa itens iguais do mesmo pedido', type: 'toggle', icon: <Layers className="w-4 h-4" />, defaultValue: true },
      { key: 'kitchen_sound', label: 'Som de Novo Pedido', description: 'Toca som quando chega pedido', type: 'toggle', icon: <Volume2 className="w-4 h-4" />, defaultValue: true }
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

  // === INTEGRAÇÕES - DELIVERY ===
  {
    id: 'ifood',
    name: 'iFood',
    description: 'Receba pedidos do iFood',
    longDescription: 'Integre com o iFood para receber pedidos diretamente no sistema. Requer conta iFood Partner.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    settings: [
      { key: 'ifood_enabled', label: 'Ativar iFood', description: 'Recebe pedidos do iFood no painel', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: false },
      { key: 'ifood_merchant_id', label: 'Merchant ID', description: 'ID do restaurante no iFood Partner', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'abc123-def456...', defaultValue: '' },
      { key: 'ifood_client_id', label: 'Client ID', description: 'Credencial da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID da API', defaultValue: '' },
      { key: 'ifood_client_secret', label: 'Client Secret', description: 'Chave secreta da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' },
      { key: 'ifood_auto_accept', label: 'Aceitar Automaticamente', description: 'Aceita pedidos sem confirmação manual', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false },
      { key: 'ifood_auto_print', label: 'Imprimir Automaticamente', description: 'Imprime ao receber pedido', type: 'toggle', icon: <Printer className="w-4 h-4" />, defaultValue: true },
      { key: 'ifood_sync_menu', label: 'Sincronizar Cardápio', description: 'Atualiza cardápio no iFood', type: 'toggle', icon: <Package className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'rappi',
    name: 'Rappi',
    description: 'Receba pedidos da Rappi',
    longDescription: 'Integre com a Rappi para receber pedidos. Requer conta Rappi Partner.',
    icon: <Car className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    settings: [
      { key: 'rappi_enabled', label: 'Ativar Rappi', description: 'Recebe pedidos da Rappi', type: 'toggle', icon: <Car className="w-4 h-4" />, defaultValue: false },
      { key: 'rappi_store_id', label: 'Store ID', description: 'ID da loja na Rappi', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID da loja', defaultValue: '' },
      { key: 'rappi_api_key', label: 'API Key', description: 'Chave da API Rappi', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'rappi_auto_accept', label: 'Aceitar Automaticamente', description: 'Aceita pedidos sem confirmação', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    description: 'Receba pedidos do Uber Eats',
    longDescription: 'Integre com o Uber Eats para receber pedidos. Requer conta Uber Eats for Merchants.',
    icon: <Car className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    settings: [
      { key: 'ubereats_enabled', label: 'Ativar Uber Eats', description: 'Recebe pedidos do Uber Eats', type: 'toggle', icon: <Car className="w-4 h-4" />, defaultValue: false },
      { key: 'ubereats_store_id', label: 'Store ID', description: 'ID da loja no Uber Eats', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Store ID', defaultValue: '' },
      { key: 'ubereats_client_id', label: 'Client ID', description: 'OAuth Client ID', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID', defaultValue: '' },
      { key: 'ubereats_client_secret', label: 'Client Secret', description: 'OAuth Client Secret', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret', defaultValue: '' }
    ]
  },
  {
    id: 'aiqfome',
    name: 'Aiqfome',
    description: 'Receba pedidos do Aiqfome',
    longDescription: 'Integre com o Aiqfome, popular em cidades do interior.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'integrations',
    settings: [
      { key: 'aiqfome_enabled', label: 'Ativar Aiqfome', description: 'Recebe pedidos do Aiqfome', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: false },
      { key: 'aiqfome_store_id', label: 'ID da Loja', description: 'ID no Aiqfome', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID', defaultValue: '' },
      { key: 'aiqfome_token', label: 'Token', description: 'Token de integração', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - PAGAMENTOS ===
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'PIX, cartão e boleto',
    longDescription: 'Receba pagamentos online via PIX, cartão de crédito/débito e boleto. Taxa: 0% PIX, 4.99% cartão.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    settings: [
      { key: 'mercadopago_enabled', label: 'Ativar Mercado Pago', description: 'Recebe pagamentos online', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'mercadopago_public_key', label: 'Public Key', description: 'Chave pública (começa com APP_USR)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'APP_USR-...', defaultValue: '' },
      { key: 'mercadopago_access_token', label: 'Access Token', description: 'Token de acesso (começa com APP_USR)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'APP_USR-...', defaultValue: '' },
      { key: 'mercadopago_pix', label: 'Aceitar PIX', description: 'Pagamento via PIX (0% taxa)', type: 'toggle', icon: <QrCode className="w-4 h-4" />, defaultValue: true },
      { key: 'mercadopago_credit', label: 'Aceitar Crédito', description: 'Cartão de crédito', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: true },
      { key: 'mercadopago_debit', label: 'Aceitar Débito', description: 'Cartão de débito', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: true },
      { key: 'mercadopago_boleto', label: 'Aceitar Boleto', description: 'Boleto bancário', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'pagseguro',
    name: 'PagSeguro',
    description: 'PIX, cartão e boleto',
    longDescription: 'Receba pagamentos online via PagSeguro. Taxa: 0% PIX, 4.99% cartão.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    settings: [
      { key: 'pagseguro_enabled', label: 'Ativar PagSeguro', description: 'Recebe pagamentos online', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'pagseguro_email', label: 'E-mail PagSeguro', description: 'E-mail da conta', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'seu@email.com', defaultValue: '' },
      { key: 'pagseguro_token', label: 'Token', description: 'Token de integração', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'pagseguro_sandbox', label: 'Modo Teste', description: 'Usar ambiente de testes', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Cartões internacionais',
    longDescription: 'Aceite cartões de crédito internacionais. Ideal para clientes estrangeiros. Taxa: 2.9% + R$0.39.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'integrations',
    settings: [
      { key: 'stripe_enabled', label: 'Ativar Stripe', description: 'Aceita cartões internacionais', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'stripe_public_key', label: 'Publishable Key', description: 'Chave pública (pk_...)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'pk_live_...', defaultValue: '' },
      { key: 'stripe_secret_key', label: 'Secret Key', description: 'Chave secreta (sk_...)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'sk_live_...', defaultValue: '' },
      { key: 'stripe_webhook_secret', label: 'Webhook Secret', description: 'Para confirmar pagamentos', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'whsec_...', defaultValue: '' }
    ]
  },
  {
    id: 'asaas',
    name: 'Asaas',
    description: 'PIX, boleto e cobrança',
    longDescription: 'Plataforma completa: PIX, boleto, cartão e cobrança recorrente. Taxa: 0% PIX, R$0.49 boleto.',
    icon: <Wallet className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'integrations',
    settings: [
      { key: 'asaas_enabled', label: 'Ativar Asaas', description: 'Aceita pagamentos via Asaas', type: 'toggle', icon: <Wallet className="w-4 h-4" />, defaultValue: false },
      { key: 'asaas_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '$aas_...', defaultValue: '' },
      { key: 'asaas_sandbox', label: 'Modo Teste', description: 'Usar ambiente sandbox', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'pix_manual',
    name: 'PIX Manual',
    description: 'Chave PIX da loja',
    longDescription: 'Exibe sua chave PIX para o cliente copiar e pagar. Sem taxas, você confere manualmente.',
    icon: <QrCode className="w-6 h-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    category: 'integrations',
    settings: [
      { key: 'pix_manual_enabled', label: 'Ativar PIX Manual', description: 'Mostra chave PIX ao cliente', type: 'toggle', icon: <QrCode className="w-4 h-4" />, defaultValue: false },
      { key: 'pix_key_type', label: 'Tipo da Chave', description: 'Tipo da chave PIX', type: 'select', icon: <Hash className="w-4 h-4" />, options: [{ value: 'cpf', label: 'CPF' }, { value: 'cnpj', label: 'CNPJ' }, { value: 'email', label: 'E-mail' }, { value: 'phone', label: 'Telefone' }, { value: 'random', label: 'Aleatória' }], defaultValue: 'cpf' },
      { key: 'pix_key', label: 'Chave PIX', description: 'Sua chave PIX', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Sua chave...', defaultValue: '' },
      { key: 'pix_holder_name', label: 'Nome do Titular', description: 'Nome que aparece no PIX', type: 'text', icon: <Users className="w-4 h-4" />, placeholder: 'Nome completo', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - FISCAL ===
  {
    id: 'nfe',
    name: 'Nota Fiscal (NF-e)',
    description: 'Emissão de NF-e/NFC-e',
    longDescription: 'Emita notas fiscais eletrônicas automaticamente. Requer certificado digital A1.',
    icon: <FileText className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'integrations',
    settings: [
      { key: 'nfe_enabled', label: 'Ativar NF-e', description: 'Emite notas fiscais', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: false },
      { key: 'nfe_provider', label: 'Provedor', description: 'Serviço de emissão', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'focus', label: 'Focus NFe' }, { value: 'tecnospeed', label: 'Tecnospeed' }, { value: 'enotas', label: 'eNotas' }, { value: 'nuvemfiscal', label: 'Nuvem Fiscal' }], defaultValue: 'focus' },
      { key: 'nfe_api_token', label: 'Token da API', description: 'Token do provedor', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'nfe_auto_emit', label: 'Emitir Automaticamente', description: 'Emite NF ao finalizar pedido', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false },
      { key: 'nfe_environment', label: 'Ambiente', description: 'Produção ou homologação', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'production', label: 'Produção' }, { value: 'homologation', label: 'Homologação (testes)' }], defaultValue: 'homologation' }
    ]
  },
  {
    id: 'bling',
    name: 'Bling ERP',
    description: 'Gestão empresarial',
    longDescription: 'Sincronize pedidos, estoque e produtos com o Bling ERP.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    settings: [
      { key: 'bling_enabled', label: 'Ativar Bling', description: 'Sincroniza com Bling ERP', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: false },
      { key: 'bling_api_key', label: 'API Key', description: 'Chave da API Bling', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'bling_sync_products', label: 'Sincronizar Produtos', description: 'Importa produtos do Bling', type: 'toggle', icon: <Package className="w-4 h-4" />, defaultValue: true },
      { key: 'bling_sync_orders', label: 'Sincronizar Pedidos', description: 'Envia pedidos para o Bling', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true },
      { key: 'bling_sync_stock', label: 'Sincronizar Estoque', description: 'Atualiza estoque bidirecionalmente', type: 'toggle', icon: <Archive className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'tiny',
    name: 'Tiny ERP',
    description: 'Gestão empresarial',
    longDescription: 'Sincronize pedidos, estoque e produtos com o Tiny ERP.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'integrations',
    settings: [
      { key: 'tiny_enabled', label: 'Ativar Tiny', description: 'Sincroniza com Tiny ERP', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: false },
      { key: 'tiny_token', label: 'Token', description: 'Token da API Tiny', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'tiny_sync_orders', label: 'Enviar Pedidos', description: 'Envia pedidos para o Tiny', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true }
    ]
  },

  // === INTEGRAÇÕES - COMUNICAÇÃO ===
  {
    id: 'whatsapp_api',
    name: 'WhatsApp Business API',
    description: 'Mensagens automáticas',
    longDescription: 'Envie mensagens automáticas de status do pedido. Requer conta Meta Business verificada. Custo: ~R$0.40/msg.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    settings: [
      { key: 'whatsapp_api_enabled', label: 'Ativar WhatsApp API', description: 'Envia mensagens automáticas', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false },
      { key: 'whatsapp_provider', label: 'Provedor', description: 'Serviço de envio', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'meta', label: 'Meta (Oficial)' }, { value: 'zapi', label: 'Z-API' }, { value: 'evolution', label: 'Evolution API' }, { value: 'wppconnect', label: 'WPPConnect' }], defaultValue: 'meta' },
      { key: 'whatsapp_api_token', label: 'Token da API', description: 'Token de acesso', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'whatsapp_phone_id', label: 'Phone Number ID', description: 'ID do número (Meta)', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: 'ID...', defaultValue: '' },
      { key: 'whatsapp_business_id', label: 'Business Account ID', description: 'ID da conta Business', type: 'text', icon: <Building2 className="w-4 h-4" />, placeholder: 'ID...', defaultValue: '' },
      { key: 'whatsapp_notify_order_created', label: 'Notificar Pedido Criado', description: 'Confirma recebimento', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'whatsapp_notify_order_ready', label: 'Notificar Pedido Pronto', description: 'Avisa quando está pronto', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'whatsapp_notify_out_for_delivery', label: 'Notificar Saiu p/ Entrega', description: 'Avisa que saiu para entrega', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true },
      { key: 'whatsapp_notify_delivered', label: 'Notificar Entregue', description: 'Confirma entrega + pede avaliação', type: 'toggle', icon: <Star className="w-4 h-4" />, defaultValue: true }
    ]
  },

  // === INTEGRAÇÕES - ANALYTICS ===
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Rastrear visitantes',
    longDescription: 'Acompanhe visitantes, conversões e comportamento no seu cardápio digital.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    settings: [
      { key: 'ga_enabled', label: 'Ativar Analytics', description: 'Rastreia visitantes do cardápio', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: false },
      { key: 'ga_measurement_id', label: 'Measurement ID', description: 'ID do GA4 (G-XXXXXXX)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'G-XXXXXXXXXX', defaultValue: '' },
      { key: 'ga_track_purchases', label: 'Rastrear Compras', description: 'Envia conversões de pedidos', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel (Facebook)',
    description: 'Remarketing e conversões',
    longDescription: 'Rastreie conversões e crie públicos para anúncios no Facebook e Instagram.',
    icon: <Facebook className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    settings: [
      { key: 'pixel_enabled', label: 'Ativar Meta Pixel', description: 'Rastreia para Facebook Ads', type: 'toggle', icon: <Facebook className="w-4 h-4" />, defaultValue: false },
      { key: 'pixel_id', label: 'Pixel ID', description: 'ID do Pixel', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '1234567890', defaultValue: '' },
      { key: 'pixel_track_purchases', label: 'Rastrear Compras', description: 'Envia evento Purchase', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true },
      { key: 'pixel_track_add_to_cart', label: 'Rastrear Add to Cart', description: 'Envia evento AddToCart', type: 'toggle', icon: <ShoppingCart className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'google_business',
    name: 'Google Meu Negócio',
    description: 'Avaliações do Google',
    longDescription: 'Conecte seu Google Meu Negócio para gerenciar e responder avaliações. Requer autorização OAuth.',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    configPage: '/dashboard/reviews/integrations',
    settings: [
      { key: 'google_business_enabled', label: 'Conectar Google', description: 'Gerencia avaliações do Google', type: 'toggle', icon: <Building2 className="w-4 h-4" />, defaultValue: false },
      { key: 'google_place_id', label: 'Place ID', description: 'ID do local no Google Maps', type: 'text', icon: <MapPin className="w-4 h-4" />, placeholder: 'ChIJ...', defaultValue: '' },
      { key: 'google_auto_reply', label: 'Resposta Automática', description: 'Responde avaliações automaticamente', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false }
    ]
  },

  // === INTEGRAÇÕES - IMPRESSÃO ===
  {
    id: 'printer',
    name: 'Impressora',
    description: 'Imprimir pedidos',
    longDescription: 'Configure impressoras térmicas para imprimir cupons e comandas automaticamente.',
    icon: <Printer className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'integrations',
    settings: [
      { key: 'printer_enabled', label: 'Ativar Impressão', description: 'Habilita impressão de pedidos', type: 'toggle', icon: <Printer className="w-4 h-4" />, defaultValue: false },
      { key: 'printer_type', label: 'Tipo de Conexão', description: 'Como a impressora está conectada', type: 'select', icon: <Printer className="w-4 h-4" />, options: [{ value: 'usb', label: 'USB (local)' }, { value: 'network', label: 'Rede (IP)' }, { value: 'bluetooth', label: 'Bluetooth' }, { value: 'qztray', label: 'QZ Tray (navegador)' }], defaultValue: 'usb' },
      { key: 'printer_name', label: 'Nome da Impressora', description: 'Nome no sistema', type: 'text', icon: <Printer className="w-4 h-4" />, placeholder: 'EPSON TM-T20', defaultValue: '' },
      { key: 'printer_ip', label: 'IP da Impressora', description: 'Endereço IP (se rede)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '192.168.1.100', defaultValue: '' },
      { key: 'printer_width', label: 'Largura do Papel', description: 'Largura em mm', type: 'select', icon: <Printer className="w-4 h-4" />, options: [{ value: '58', label: '58mm' }, { value: '80', label: '80mm' }], defaultValue: '80' },
      { key: 'printer_auto_cut', label: 'Corte Automático', description: 'Corta papel após imprimir', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: true },
      { key: 'printer_open_drawer', label: 'Abrir Gaveta', description: 'Abre gaveta ao imprimir', type: 'toggle', icon: <Archive className="w-4 h-4" />, defaultValue: false },
      { key: 'printer_copies', label: 'Cópias', description: 'Quantas vias imprimir', type: 'select', icon: <Receipt className="w-4 h-4" />, options: [{ value: '1', label: '1 via' }, { value: '2', label: '2 vias (cliente + cozinha)' }, { value: '3', label: '3 vias' }], defaultValue: '1' }
    ]
  },

  // === INTEGRAÇÕES - MAPAS ===
  {
    id: 'google_maps',
    name: 'Google Maps',
    description: 'Cálculo de distância',
    longDescription: 'Calcule distâncias e taxas de entrega automaticamente. Custo: ~$5/1000 requisições.',
    icon: <MapPin className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'maps',
    requiresSuperadmin: true,
    settings: [
      { key: 'gmaps_enabled', label: 'Ativar Google Maps', description: 'Calcula distância e taxa', type: 'toggle', icon: <MapPin className="w-4 h-4" />, defaultValue: false },
      { key: 'gmaps_api_key', label: 'API Key', description: 'Chave da API Google Maps', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'AIza...', defaultValue: '' },
      { key: 'gmaps_distance_matrix', label: 'Usar Distance Matrix', description: 'Calcula tempo de entrega', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'mapbox',
    name: 'Mapbox',
    description: 'Alternativa ao Google Maps',
    longDescription: 'Mapas e cálculo de rotas. Mais barato que Google Maps. 100k requisições grátis/mês.',
    icon: <MapPin className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'maps',
    settings: [
      { key: 'mapbox_enabled', label: 'Ativar Mapbox', description: 'Usa Mapbox para mapas', type: 'toggle', icon: <MapPin className="w-4 h-4" />, defaultValue: false },
      { key: 'mapbox_access_token', label: 'Access Token', description: 'Token público do Mapbox', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'pk.eyJ1...', defaultValue: '' }
    ]
  },
  {
    id: 'here_maps',
    name: 'HERE Maps',
    description: 'Rotas e logística',
    longDescription: 'Especializado em rotas de entrega e logística. 250k requisições grátis/mês.',
    icon: <MapPin className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'integrations',
    subcategory: 'maps',
    settings: [
      { key: 'here_enabled', label: 'Ativar HERE', description: 'Usa HERE para rotas', type: 'toggle', icon: <MapPin className="w-4 h-4" />, defaultValue: false },
      { key: 'here_api_key', label: 'API Key', description: 'Chave da API HERE', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - DELIVERY EXTRA ===
  {
    id: '99food',
    name: '99Food',
    description: 'Receba pedidos do 99Food',
    longDescription: 'Integre com o 99Food para receber pedidos. Popular em grandes capitais.',
    icon: <Car className="w-6 h-6" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'integrations',
    subcategory: 'delivery_platforms',
    settings: [
      { key: '99food_enabled', label: 'Ativar 99Food', description: 'Recebe pedidos do 99Food', type: 'toggle', icon: <Car className="w-4 h-4" />, defaultValue: false },
      { key: '99food_store_id', label: 'Store ID', description: 'ID da loja no 99Food', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID da loja', defaultValue: '' },
      { key: '99food_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },
  {
    id: 'james_delivery',
    name: 'James Delivery',
    description: 'Receba pedidos do James',
    longDescription: 'Integre com o James Delivery. Popular no Sul e Sudeste.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    subcategory: 'delivery_platforms',
    settings: [
      { key: 'james_enabled', label: 'Ativar James', description: 'Recebe pedidos do James', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: false },
      { key: 'james_store_id', label: 'Store ID', description: 'ID da loja', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID', defaultValue: '' },
      { key: 'james_token', label: 'Token', description: 'Token de integração', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' }
    ]
  },
  {
    id: 'delivery_much',
    name: 'Delivery Much',
    description: 'Receba pedidos do Much',
    longDescription: 'Integre com o Delivery Much. Forte no interior do Brasil.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'integrations',
    subcategory: 'delivery_platforms',
    settings: [
      { key: 'much_enabled', label: 'Ativar Delivery Much', description: 'Recebe pedidos do Much', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: false },
      { key: 'much_store_id', label: 'Store ID', description: 'ID da loja', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID', defaultValue: '' },
      { key: 'much_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },
  {
    id: 'anota_ai',
    name: 'Anota AI',
    description: 'Atendimento WhatsApp com IA',
    longDescription: 'Automatize pedidos via WhatsApp com inteligência artificial. Os pedidos entram automaticamente.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'delivery_platforms',
    settings: [
      { key: 'anotaai_enabled', label: 'Ativar Anota AI', description: 'Recebe pedidos do Anota AI', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false },
      { key: 'anotaai_store_id', label: 'Store ID', description: 'ID da loja no Anota AI', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID', defaultValue: '' },
      { key: 'anotaai_token', label: 'Token', description: 'Token de integração', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' }
    ]
  },
  {
    id: 'goomer',
    name: 'Goomer',
    description: 'Cardápio digital avançado',
    longDescription: 'Cardápio digital com QR Code e integração de pedidos.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    subcategory: 'delivery_platforms',
    settings: [
      { key: 'goomer_enabled', label: 'Ativar Goomer', description: 'Integra com Goomer', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: false },
      { key: 'goomer_api_key', label: 'API Key', description: 'Chave da API Goomer', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - PAGAMENTOS EXTRA ===
  {
    id: 'picpay',
    name: 'PicPay',
    description: 'Pagamento via PicPay',
    longDescription: 'Aceite pagamentos via PicPay. Popular entre jovens. Taxa: 1.99%.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'payment_gateways',
    settings: [
      { key: 'picpay_enabled', label: 'Ativar PicPay', description: 'Aceita pagamentos PicPay', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: false },
      { key: 'picpay_token', label: 'Token', description: 'Token do PicPay', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'picpay_seller_token', label: 'Seller Token', description: 'Token do vendedor', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Seller Token...', defaultValue: '' }
    ]
  },
  {
    id: 'ame_digital',
    name: 'Ame Digital',
    description: 'Pagamento com cashback',
    longDescription: 'Aceite pagamentos via Ame Digital. Oferece cashback aos clientes.',
    icon: <Wallet className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'integrations',
    subcategory: 'payment_gateways',
    settings: [
      { key: 'ame_enabled', label: 'Ativar Ame', description: 'Aceita Ame Digital', type: 'toggle', icon: <Wallet className="w-4 h-4" />, defaultValue: false },
      { key: 'ame_client_id', label: 'Client ID', description: 'ID do cliente', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID...', defaultValue: '' },
      { key: 'ame_client_secret', label: 'Client Secret', description: 'Chave secreta', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' }
    ]
  },
  {
    id: 'pagarme',
    name: 'Pagar.me',
    description: 'Gateway simples',
    longDescription: 'Gateway de pagamento simples e fácil de integrar. PIX, cartão e boleto.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'payment_gateways',
    settings: [
      { key: 'pagarme_enabled', label: 'Ativar Pagar.me', description: 'Aceita via Pagar.me', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'pagarme_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ak_live_...', defaultValue: '' },
      { key: 'pagarme_encryption_key', label: 'Encryption Key', description: 'Chave de criptografia', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ek_live_...', defaultValue: '' }
    ]
  },
  {
    id: 'iugu',
    name: 'Iugu',
    description: 'Cobrança recorrente',
    longDescription: 'Especializado em assinaturas e cobranças recorrentes.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'payment_gateways',
    settings: [
      { key: 'iugu_enabled', label: 'Ativar Iugu', description: 'Aceita via Iugu', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'iugu_account_id', label: 'Account ID', description: 'ID da conta', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Account ID...', defaultValue: '' },
      { key: 'iugu_api_token', label: 'API Token', description: 'Token da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' }
    ]
  },
  {
    id: 'vindi',
    name: 'Vindi',
    description: 'Assinaturas e recorrência',
    longDescription: 'Plataforma para cobranças recorrentes e assinaturas.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'integrations',
    subcategory: 'payment_gateways',
    settings: [
      { key: 'vindi_enabled', label: 'Ativar Vindi', description: 'Aceita via Vindi', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'vindi_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },
  {
    id: 'paygo_c6',
    name: 'PayGo C6',
    description: 'Maquininha C6 Bank',
    longDescription: 'Integre sua maquininha PayGo do C6 Bank para vendas presenciais.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'integrations',
    subcategory: 'payment_machines',
    settings: [
      { key: 'paygo_enabled', label: 'Ativar PayGo C6', description: 'Integra maquininha C6', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'paygo_terminal_id', label: 'Terminal ID', description: 'ID do terminal', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'ID do terminal', defaultValue: '' },
      { key: 'paygo_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'Maquininha Stone',
    longDescription: 'Integre sua maquininha Stone para vendas presenciais.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'payment_machines',
    settings: [
      { key: 'stone_enabled', label: 'Ativar Stone', description: 'Integra maquininha Stone', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'stone_stone_code', label: 'Stone Code', description: 'Código Stone', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Stone Code...', defaultValue: '' },
      { key: 'stone_sak', label: 'SAK', description: 'Chave de ativação', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'SAK...', defaultValue: '' }
    ]
  },
  {
    id: 'cielo',
    name: 'Cielo',
    description: 'Maquininha Cielo',
    longDescription: 'Integre sua maquininha Cielo para vendas presenciais.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'payment_machines',
    settings: [
      { key: 'cielo_enabled', label: 'Ativar Cielo', description: 'Integra maquininha Cielo', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'cielo_merchant_id', label: 'Merchant ID', description: 'ID do lojista', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Merchant ID...', defaultValue: '' },
      { key: 'cielo_merchant_key', label: 'Merchant Key', description: 'Chave do lojista', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Merchant Key...', defaultValue: '' }
    ]
  },
  {
    id: 'getnet',
    name: 'Getnet',
    description: 'Maquininha Getnet',
    longDescription: 'Integre sua maquininha Getnet (Santander) para vendas presenciais.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    subcategory: 'payment_machines',
    settings: [
      { key: 'getnet_enabled', label: 'Ativar Getnet', description: 'Integra maquininha Getnet', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'getnet_seller_id', label: 'Seller ID', description: 'ID do vendedor', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Seller ID...', defaultValue: '' },
      { key: 'getnet_client_id', label: 'Client ID', description: 'OAuth Client ID', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID...', defaultValue: '' },
      { key: 'getnet_client_secret', label: 'Client Secret', description: 'OAuth Secret', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' }
    ]
  },
  {
    id: 'rede',
    name: 'Rede',
    description: 'Maquininha Rede',
    longDescription: 'Integre sua maquininha Rede (Itaú) para vendas presenciais.',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    subcategory: 'payment_machines',
    settings: [
      { key: 'rede_enabled', label: 'Ativar Rede', description: 'Integra maquininha Rede', type: 'toggle', icon: <CreditCard className="w-4 h-4" />, defaultValue: false },
      { key: 'rede_pv', label: 'PV (Nº Filiação)', description: 'Número de filiação', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'PV...', defaultValue: '' },
      { key: 'rede_token', label: 'Token', description: 'Token de integração', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - ANALYTICS EXTRA ===
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Mapas de calor',
    longDescription: 'Veja onde os clientes clicam e como navegam no seu cardápio. Gratuito até 35 sessões/dia.',
    icon: <Eye className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    subcategory: 'analytics',
    settings: [
      { key: 'hotjar_enabled', label: 'Ativar Hotjar', description: 'Rastreia comportamento', type: 'toggle', icon: <Eye className="w-4 h-4" />, defaultValue: false },
      { key: 'hotjar_site_id', label: 'Site ID', description: 'ID do site no Hotjar', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '1234567', defaultValue: '' }
    ]
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    description: 'Analytics gratuito',
    longDescription: 'Mapas de calor e gravação de sessões. 100% gratuito da Microsoft.',
    icon: <Eye className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'analytics',
    settings: [
      { key: 'clarity_enabled', label: 'Ativar Clarity', description: 'Analytics gratuito', type: 'toggle', icon: <Eye className="w-4 h-4" />, defaultValue: false },
      { key: 'clarity_project_id', label: 'Project ID', description: 'ID do projeto', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'abc123xyz', defaultValue: '' }
    ]
  },
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    description: 'Gerenciador de tags',
    longDescription: 'Gerencie todas as tags (Analytics, Pixel, etc) em um só lugar.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'analytics',
    requiresSuperadmin: true,
    settings: [
      { key: 'gtm_enabled', label: 'Ativar GTM', description: 'Usa Google Tag Manager', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: false },
      { key: 'gtm_container_id', label: 'Container ID', description: 'ID do container (GTM-XXXX)', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'GTM-XXXXXXX', defaultValue: '' }
    ]
  },
  {
    id: 'tiktok_pixel',
    name: 'TikTok Pixel',
    description: 'Anúncios TikTok',
    longDescription: 'Rastreie conversões para campanhas no TikTok Ads.',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    category: 'integrations',
    subcategory: 'analytics',
    settings: [
      { key: 'tiktok_enabled', label: 'Ativar TikTok Pixel', description: 'Rastreia para TikTok Ads', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false },
      { key: 'tiktok_pixel_id', label: 'Pixel ID', description: 'ID do Pixel TikTok', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Pixel ID...', defaultValue: '' }
    ]
  },
  {
    id: 'pinterest_tag',
    name: 'Pinterest Tag',
    description: 'Anúncios Pinterest',
    longDescription: 'Rastreie conversões para campanhas no Pinterest Ads.',
    icon: <Image className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    subcategory: 'analytics',
    settings: [
      { key: 'pinterest_enabled', label: 'Ativar Pinterest Tag', description: 'Rastreia para Pinterest Ads', type: 'toggle', icon: <Image className="w-4 h-4" />, defaultValue: false },
      { key: 'pinterest_tag_id', label: 'Tag ID', description: 'ID da Tag Pinterest', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Tag ID...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - CRM ===
  {
    id: 'rdstation',
    name: 'RD Station',
    description: 'Marketing e CRM',
    longDescription: 'Capture leads e automatize marketing com RD Station.',
    icon: <Users className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'crm',
    requiresSuperadmin: true,
    settings: [
      { key: 'rdstation_enabled', label: 'Ativar RD Station', description: 'Integra CRM RD', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: false },
      { key: 'rdstation_api_token', label: 'API Token', description: 'Token da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'rdstation_client_id', label: 'Client ID', description: 'OAuth Client ID', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID...', defaultValue: '' },
      { key: 'rdstation_client_secret', label: 'Client Secret', description: 'OAuth Secret', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM completo',
    longDescription: 'CRM, marketing e vendas em uma única plataforma.',
    icon: <Users className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    subcategory: 'crm',
    requiresSuperadmin: true,
    settings: [
      { key: 'hubspot_enabled', label: 'Ativar HubSpot', description: 'Integra CRM HubSpot', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: false },
      { key: 'hubspot_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'hubspot_portal_id', label: 'Portal ID', description: 'ID do portal', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Portal ID...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - ERP/FINANCEIRO EXTRA ===
  {
    id: 'omie',
    name: 'Omie',
    description: 'ERP robusto',
    longDescription: 'Sistema de gestão empresarial completo. Financeiro, fiscal, estoque.',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'erp',
    settings: [
      { key: 'omie_enabled', label: 'Ativar Omie', description: 'Sincroniza com Omie', type: 'toggle', icon: <BarChart3 className="w-4 h-4" />, defaultValue: false },
      { key: 'omie_app_key', label: 'App Key', description: 'Chave do aplicativo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'App Key...', defaultValue: '' },
      { key: 'omie_app_secret', label: 'App Secret', description: 'Segredo do aplicativo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'App Secret...', defaultValue: '' },
      { key: 'omie_sync_orders', label: 'Sincronizar Pedidos', description: 'Envia pedidos para Omie', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'contaazul',
    name: 'ContaAzul',
    description: 'Contabilidade online',
    longDescription: 'Gestão financeira e contábil para pequenas empresas.',
    icon: <FileText className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    subcategory: 'erp',
    settings: [
      { key: 'contaazul_enabled', label: 'Ativar ContaAzul', description: 'Sincroniza com ContaAzul', type: 'toggle', icon: <FileText className="w-4 h-4" />, defaultValue: false },
      { key: 'contaazul_client_id', label: 'Client ID', description: 'OAuth Client ID', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Client ID...', defaultValue: '' },
      { key: 'contaazul_client_secret', label: 'Client Secret', description: 'OAuth Secret', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' }
    ]
  },
  {
    id: 'nibo',
    name: 'Nibo',
    description: 'Gestão financeira',
    longDescription: 'Software de gestão financeira para escritórios contábeis.',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    subcategory: 'erp',
    settings: [
      { key: 'nibo_enabled', label: 'Ativar Nibo', description: 'Sincroniza com Nibo', type: 'toggle', icon: <DollarSign className="w-4 h-4" />, defaultValue: false },
      { key: 'nibo_api_token', label: 'API Token', description: 'Token da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' }
    ]
  },
  {
    id: 'granatum',
    name: 'Granatum',
    description: 'Gestão financeira',
    longDescription: 'Controle financeiro, fluxo de caixa e conciliação bancária.',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    subcategory: 'erp',
    settings: [
      { key: 'granatum_enabled', label: 'Ativar Granatum', description: 'Sincroniza com Granatum', type: 'toggle', icon: <DollarSign className="w-4 h-4" />, defaultValue: false },
      { key: 'granatum_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' }
    ]
  },

  // === INTEGRAÇÕES - COMUNICAÇÃO EXTRA ===
  {
    id: 'discord',
    name: 'Discord',
    description: 'Notificações Discord',
    longDescription: 'Receba notificações de pedidos no Discord via webhook. Gratuito.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'integrations',
    subcategory: 'communication',
    settings: [
      { key: 'discord_enabled', label: 'Ativar Discord', description: 'Envia notificações no Discord', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false },
      { key: 'discord_webhook_url', label: 'Webhook URL', description: 'URL do webhook do canal', type: 'text', icon: <Link2 className="w-4 h-4" />, placeholder: 'https://discord.com/api/webhooks/...', defaultValue: '' },
      { key: 'discord_notify_orders', label: 'Novos Pedidos', description: 'Notifica pedidos', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true },
      { key: 'discord_notify_reviews', label: 'Avaliações', description: 'Notifica avaliações', type: 'toggle', icon: <Star className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações Slack',
    longDescription: 'Receba notificações de pedidos no Slack via webhook.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'integrations',
    subcategory: 'communication',
    settings: [
      { key: 'slack_enabled', label: 'Ativar Slack', description: 'Envia notificações no Slack', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false },
      { key: 'slack_webhook_url', label: 'Webhook URL', description: 'URL do webhook', type: 'text', icon: <Link2 className="w-4 h-4" />, placeholder: 'https://hooks.slack.com/...', defaultValue: '' },
      { key: 'slack_channel', label: 'Canal', description: 'Nome do canal', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '#pedidos', defaultValue: '' }
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
    id: 'email_notifications',
    name: 'E-mail Transacional',
    description: 'E-mails automáticos',
    longDescription: 'Configure e-mails automáticos para confirmação de pedidos, atualizações de status e promoções.',
    icon: <Mail className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'notifications',
    settings: [
      { key: 'email_enabled', label: 'Ativar E-mails', description: 'Habilita envio de e-mails', type: 'toggle', icon: <Mail className="w-4 h-4" />, defaultValue: false },
      { key: 'email_provider', label: 'Provedor', description: 'Serviço de envio de e-mail', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'smtp', label: 'SMTP (próprio)' }, { value: 'sendgrid', label: 'SendGrid' }, { value: 'mailgun', label: 'Mailgun' }, { value: 'ses', label: 'Amazon SES' }, { value: 'resend', label: 'Resend' }], defaultValue: 'smtp' },
      { key: 'email_smtp_host', label: 'Servidor SMTP', description: 'Host do servidor', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'smtp.gmail.com', defaultValue: '' },
      { key: 'email_smtp_port', label: 'Porta SMTP', description: '587 (TLS) ou 465 (SSL)', type: 'number', icon: <Hash className="w-4 h-4" />, placeholder: '587', defaultValue: 587 },
      { key: 'email_smtp_user', label: 'Usuário SMTP', description: 'Geralmente o e-mail', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'seu@email.com', defaultValue: '' },
      { key: 'email_smtp_pass', label: 'Senha SMTP', description: 'Senha ou App Password', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '********', defaultValue: '' },
      { key: 'email_from_name', label: 'Nome do Remetente', description: 'Ex: Açaí do João', type: 'text', icon: <Users className="w-4 h-4" />, placeholder: 'Minha Loja', defaultValue: '' },
      { key: 'email_from_address', label: 'E-mail do Remetente', description: 'E-mail que aparece para o cliente', type: 'text', icon: <Mail className="w-4 h-4" />, placeholder: 'pedidos@minhaloja.com', defaultValue: '' },
      { key: 'email_notify_order_created', label: 'Pedido Criado', description: 'Envia confirmação ao cliente', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'email_notify_order_ready', label: 'Pedido Pronto', description: 'Avisa que está pronto', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'email_notify_order_delivered', label: 'Pedido Entregue', description: 'Confirma entrega', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true },
      { key: 'email_notify_owner', label: 'Notificar Dono', description: 'Cópia para o e-mail do responsável', type: 'toggle', icon: <Users className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Notificações por SMS',
    longDescription: 'Envie SMS para clientes sobre status do pedido. Custo por mensagem.',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'notifications',
    settings: [
      { key: 'sms_enabled', label: 'Ativar SMS', description: 'Habilita envio de SMS', type: 'toggle', icon: <Smartphone className="w-4 h-4" />, defaultValue: false },
      { key: 'sms_provider', label: 'Provedor', description: 'Serviço de SMS', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'twilio', label: 'Twilio' }, { value: 'zenvia', label: 'Zenvia' }, { value: 'infobip', label: 'Infobip' }, { value: 'comtele', label: 'Comtele' }], defaultValue: 'twilio' },
      { key: 'sms_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'sms_api_secret', label: 'API Secret', description: 'Chave secreta', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Secret...', defaultValue: '' },
      { key: 'sms_from_number', label: 'Número Remetente', description: 'Número que envia', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: '+5511999999999', defaultValue: '' },
      { key: 'sms_notify_order_created', label: 'Pedido Criado', description: 'SMS de confirmação', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'sms_notify_out_delivery', label: 'Saiu para Entrega', description: 'SMS quando sai', type: 'toggle', icon: <Truck className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'push_notifications',
    name: 'Push Notifications',
    description: 'Notificações no navegador',
    longDescription: 'Envie notificações push para o navegador dos clientes. Gratuito.',
    icon: <Bell className="w-6 h-6" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'notifications',
    settings: [
      { key: 'push_enabled', label: 'Ativar Push', description: 'Habilita notificações push', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: false },
      { key: 'push_provider', label: 'Provedor', description: 'Serviço de push', type: 'select', icon: <Building2 className="w-4 h-4" />, options: [{ value: 'onesignal', label: 'OneSignal' }, { value: 'firebase', label: 'Firebase (FCM)' }, { value: 'pusher', label: 'Pusher' }], defaultValue: 'onesignal' },
      { key: 'push_app_id', label: 'App ID', description: 'ID do aplicativo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'App ID...', defaultValue: '' },
      { key: 'push_api_key', label: 'API Key', description: 'Chave da API', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'API Key...', defaultValue: '' },
      { key: 'push_ask_permission', label: 'Pedir Permissão', description: 'Solicita permissão ao visitar', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'push_notify_promotions', label: 'Promoções', description: 'Envia ofertas e cupons', type: 'toggle', icon: <Tag className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot do Telegram',
    longDescription: 'Receba notificações de pedidos no Telegram via bot. Gratuito.',
    icon: <Send className="w-6 h-6" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    category: 'notifications',
    settings: [
      { key: 'telegram_enabled', label: 'Ativar Telegram', description: 'Habilita bot do Telegram', type: 'toggle', icon: <Send className="w-4 h-4" />, defaultValue: false },
      { key: 'telegram_bot_token', label: 'Bot Token', description: 'Token do @BotFather', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '123456789:ABC...', defaultValue: '' },
      { key: 'telegram_chat_id', label: 'Chat ID', description: 'ID do chat/grupo', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: '-123456789', defaultValue: '' },
      { key: 'telegram_notify_orders', label: 'Novos Pedidos', description: 'Notifica pedidos novos', type: 'toggle', icon: <ShoppingBag className="w-4 h-4" />, defaultValue: true },
      { key: 'telegram_notify_reviews', label: 'Avaliações', description: 'Notifica novas avaliações', type: 'toggle', icon: <Star className="w-4 h-4" />, defaultValue: true }
    ]
  },
  {
    id: 'sounds',
    name: 'Alertas Sonoros',
    description: 'Sons no painel',
    longDescription: 'Configure sons para alertar novos pedidos e outras notificações no dashboard.',
    icon: <Volume2 className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    category: 'notifications',
    settings: [
      { key: 'sounds_enabled', label: 'Ativar Sons', description: 'Habilita alertas sonoros', type: 'toggle', icon: <Volume2 className="w-4 h-4" />, defaultValue: true },
      { key: 'sound_new_order', label: 'Novo Pedido', description: 'Som ao receber pedido', type: 'select', icon: <Bell className="w-4 h-4" />, options: [{ value: 'bell', label: '🔔 Sino' }, { value: 'chime', label: '🎵 Chime' }, { value: 'alert', label: '⚠️ Alerta' }, { value: 'notification', label: '📱 Notificação' }, { value: 'none', label: '🔇 Nenhum' }], defaultValue: 'bell' },
      { key: 'sound_order_ready', label: 'Pedido Pronto', description: 'Som quando fica pronto', type: 'select', icon: <ChefHat className="w-4 h-4" />, options: [{ value: 'bell', label: '🔔 Sino' }, { value: 'chime', label: '🎵 Chime' }, { value: 'success', label: '✅ Sucesso' }, { value: 'none', label: '🔇 Nenhum' }], defaultValue: 'chime' },
      { key: 'sound_volume', label: 'Volume', description: 'Nível do som', type: 'select', icon: <Volume2 className="w-4 h-4" />, options: [{ value: '25', label: '25%' }, { value: '50', label: '50%' }, { value: '75', label: '75%' }, { value: '100', label: '100%' }], defaultValue: '75' },
      { key: 'sound_repeat', label: 'Repetir Alerta', description: 'Repete até confirmar', type: 'toggle', icon: <Bell className="w-4 h-4" />, defaultValue: true },
      { key: 'sound_repeat_interval', label: 'Intervalo Repetição', description: 'Segundos entre repetições', type: 'number', icon: <Timer className="w-4 h-4" />, placeholder: '30', suffix: 'seg', defaultValue: 30 }
    ]
  }
]
