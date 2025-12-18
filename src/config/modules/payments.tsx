import { QrCode, CreditCard, Wallet, Banknote, DollarSign, Users } from 'lucide-react'
import type { Module } from './types'

export const PAYMENTS_MODULES: Module[] = [
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
  }
]
