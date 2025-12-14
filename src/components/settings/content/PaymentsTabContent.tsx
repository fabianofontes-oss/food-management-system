'use client'

import { CreditCard, DollarSign, Smartphone } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'
import { ToggleSwitch } from '../ToggleSwitch'

interface PaymentsData {
  cash_enabled: boolean
  credit_enabled: boolean
  debit_enabled: boolean
  pix_enabled: boolean
  pix_key_type: string
  pix_key: string
  pix_name: string
}

interface PaymentsTabContentProps {
  payments: PaymentsData
  setPayments: (fn: (p: PaymentsData) => PaymentsData) => void
}

export function PaymentsTabContent({ payments, setPayments }: PaymentsTabContentProps) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          Formas de Pagamento Aceitas
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium">Dinheiro</span>
            </div>
            <ToggleSwitch enabled={payments.cash_enabled} onToggle={() => setPayments(p => ({ ...p, cash_enabled: !p.cash_enabled }))} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Cartão de Crédito</span>
            </div>
            <ToggleSwitch enabled={payments.credit_enabled} onToggle={() => setPayments(p => ({ ...p, credit_enabled: !p.credit_enabled }))} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Cartão de Débito</span>
            </div>
            <ToggleSwitch enabled={payments.debit_enabled} onToggle={() => setPayments(p => ({ ...p, debit_enabled: !p.debit_enabled }))} />
          </div>
        </div>
      </div>

      <ModuleCard
        icon={<Smartphone className="w-5 h-5" />}
        title="PIX"
        description="Pagamento instantâneo"
        enabled={payments.pix_enabled}
        onToggle={() => setPayments(p => ({ ...p, pix_enabled: !p.pix_enabled }))}
        color="green"
      >
        <ConfigField 
          label="Tipo de chave" 
          value={payments.pix_key_type} 
          onChange={v => setPayments(p => ({ ...p, pix_key_type: v }))} 
          type="select"
          options={[
            { value: 'cpf', label: 'CPF' },
            { value: 'cnpj', label: 'CNPJ' },
            { value: 'email', label: 'E-mail' },
            { value: 'phone', label: 'Telefone' },
            { value: 'random', label: 'Chave Aleatória' }
          ]}
        />
        <ConfigField label="Chave PIX" value={payments.pix_key} onChange={v => setPayments(p => ({ ...p, pix_key: v }))} placeholder="Sua chave PIX" />
        <ConfigField label="Nome do titular" value={payments.pix_name} onChange={v => setPayments(p => ({ ...p, pix_name: v }))} placeholder="Nome que aparece no PIX" />
      </ModuleCard>
    </div>
  )
}
