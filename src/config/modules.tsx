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
  configPage?: string
  isCore?: boolean
  hasCustomCard?: boolean
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

  // === INTEGRAÇÕES ===
  {
    id: 'ifood',
    name: 'iFood',
    description: 'Integração com iFood',
    longDescription: 'Receba pedidos do iFood diretamente no seu painel.',
    icon: <Bike className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'integrations',
    settings: [
      { key: 'ifood_enabled', label: 'Integrar com iFood', description: 'Recebe pedidos do iFood', type: 'toggle', icon: <Bike className="w-4 h-4" />, defaultValue: false },
      { key: 'ifood_merchant_id', label: 'Merchant ID', description: 'ID do restaurante no iFood', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Seu ID iFood', defaultValue: '' },
      { key: 'ifood_auto_accept', label: 'Aceitar Automaticamente', description: 'Aceita pedidos sem revisão', type: 'toggle', icon: <Zap className="w-4 h-4" />, defaultValue: false }
    ]
  },
  {
    id: 'rappi',
    name: 'Rappi',
    description: 'Integração com Rappi',
    longDescription: 'Receba pedidos da Rappi diretamente no seu painel.',
    icon: <Car className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'integrations',
    settings: [
      { key: 'rappi_enabled', label: 'Integrar com Rappi', description: 'Recebe pedidos da Rappi', type: 'toggle', icon: <Car className="w-4 h-4" />, defaultValue: false },
      { key: 'rappi_store_id', label: 'Store ID', description: 'ID da loja na Rappi', type: 'text', icon: <Hash className="w-4 h-4" />, placeholder: 'Seu ID Rappi', defaultValue: '' }
    ]
  },
  {
    id: 'google_business',
    name: 'Google Meu Negócio',
    description: 'Avaliações do Google',
    longDescription: 'Conecte seu Google Meu Negócio para gerenciar avaliações.',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'integrations',
    configPage: '/dashboard/reviews/integrations',
    settings: [
      { key: 'google_enabled', label: 'Integrar com Google', description: 'Conecta Google Meu Negócio', type: 'toggle', icon: <Building2 className="w-4 h-4" />, defaultValue: false },
      { key: 'google_place_id', label: 'Place ID', description: 'ID do local no Google', type: 'text', icon: <MapPin className="w-4 h-4" />, placeholder: 'ChIJ...', defaultValue: '' }
    ]
  },
  {
    id: 'whatsapp_api',
    name: 'WhatsApp Business API',
    description: 'API oficial do WhatsApp',
    longDescription: 'Use a API oficial do WhatsApp para enviar notificações automáticas.',
    icon: <MessageSquare className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'integrations',
    settings: [
      { key: 'whatsapp_api_enabled', label: 'Usar API WhatsApp', description: 'Ativa API oficial', type: 'toggle', icon: <MessageSquare className="w-4 h-4" />, defaultValue: false },
      { key: 'whatsapp_api_token', label: 'Token da API', description: 'Token de acesso', type: 'text', icon: <Zap className="w-4 h-4" />, placeholder: 'Token...', defaultValue: '' },
      { key: 'whatsapp_phone_id', label: 'Phone Number ID', description: 'ID do número', type: 'text', icon: <Phone className="w-4 h-4" />, placeholder: 'ID...', defaultValue: '' }
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
