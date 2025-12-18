import { Star, Tag, Users, Megaphone, DollarSign, Gift, Percent, Bell } from 'lucide-react'
import type { Module } from './types'

export const MARKETING_MODULES: Module[] = [
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
  }
]
