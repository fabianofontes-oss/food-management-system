import { 
  Monitor, Truck, Store, UtensilsCrossed, Calendar, Clock, MapPin, 
  DollarSign, ShoppingBag, Timer, Percent, Gift, Hash, Smartphone, Users,
  LayoutGrid, Grid3X3, Image, Package, Bell, ScanBarcode, Scale, FileText,
  Printer, Receipt, Archive, Volume2, Zap, CreditCard, Banknote, EyeOff
} from 'lucide-react'
import type { Module } from './types'

export const SALES_MODULES: Module[] = [
  {
    id: 'pdv',
    name: 'PDV (Ponto de Venda)',
    description: 'Sistema de caixa completo',
    longDescription: 'Configure o comportamento do sistema de caixa, impressão, descontos e interface.',
    icon: <Monitor className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'sales',
    configPage: '/dashboard/settings/pdv',
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
  }
]
