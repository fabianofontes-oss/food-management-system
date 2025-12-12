import type { CheckoutFormData, CheckoutMode } from '../types'

interface CustomerSectionProps {
  formData: CheckoutFormData
  checkoutMode: CheckoutMode
  onChange: (field: keyof CheckoutFormData, value: string) => void
}

export function CustomerSection({ formData, checkoutMode, onChange }: CustomerSectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Dados pessoais</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone {checkoutMode === 'phone_required' ? '*' : '(opcional)'}
        </label>
        <input
          type="tel"
          required={checkoutMode === 'phone_required'}
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="(11) 99999-9999"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        {checkoutMode === 'guest' && (
          <p className="text-xs text-gray-500 mt-1">Opcional: informe para receber atualizações do pedido</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail (opcional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )
}
