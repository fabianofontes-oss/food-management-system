import { 
  Bike, Archive, ChefHat, Printer, BarChart3, Clock, DollarSign, Percent,
  Timer, Hash, Gift, Banknote, Bell, Package, Users, FileText, Layers, Volume2, Mail
} from 'lucide-react'
import type { Module } from './types'

export const OPERATIONS_MODULES: Module[] = [
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
  }
]
