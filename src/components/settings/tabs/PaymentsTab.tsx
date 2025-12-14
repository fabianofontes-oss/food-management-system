'use client'

import { CreditCard, DollarSign, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { ConfigField } from '../ConfigField'
import type { PaymentSettings } from '@/types/settings'

interface PaymentsTabProps {
  payments: PaymentSettings
  onChange: (payments: Partial<PaymentSettings>) => void
}

export function PaymentsTab({ payments, onChange }: PaymentsTabProps) {
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
            <button onClick={() => onChange({ cash: !payments.cash })} className="focus:outline-none">
              {payments.cash ? <ToggleRight className="w-10 h-10 text-violet-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Cartão de Crédito</span>
            </div>
            <button onClick={() => onChange({ credit: !payments.credit })} className="focus:outline-none">
              {payments.credit ? <ToggleRight className="w-10 h-10 text-violet-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Cartão de Débito</span>
            </div>
            <button onClick={() => onChange({ debit: !payments.debit })} className="focus:outline-none">
              {payments.debit ? <ToggleRight className="w-10 h-10 text-violet-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>

      <ModuleCard
        icon={<Smartphone className="w-5 h-5" />}
        title="PIX"
        description="Pagamento instantâneo"
        enabled={payments.pix.enabled}
        onToggle={() => onChange({ pix: { ...payments.pix, enabled: !payments.pix.enabled } })}
        color="green"
      >
        <ConfigField 
          label="Tipo de chave" 
          value={payments.pix.keyType} 
          onChange={v => onChange({ pix: { ...payments.pix, keyType: v } })} 
          type="select"
          options={[
            { value: 'cpf', label: 'CPF' },
            { value: 'cnpj', label: 'CNPJ' },
            { value: 'email', label: 'E-mail' },
            { value: 'phone', label: 'Telefone' },
            { value: 'random', label: 'Chave Aleatória' }
          ]}
        />
        <ConfigField label="Chave PIX" value={payments.pix.key} onChange={v => onChange({ pix: { ...payments.pix, key: v } })} placeholder="Sua chave PIX" />
        <ConfigField label="Nome do titular" value={payments.pix.name} onChange={v => onChange({ pix: { ...payments.pix, name: v } })} placeholder="Nome que aparece no PIX" />
      </ModuleCard>
    </div>
  )
}
