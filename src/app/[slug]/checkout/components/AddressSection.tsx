import { Loader2 } from 'lucide-react'
import { fetchAddressByCEP } from '@/lib/utils'
import type { CheckoutFormData } from '../types'

interface AddressSectionProps {
  formData: CheckoutFormData
  loadingCEP: boolean
  onChange: (field: keyof CheckoutFormData, value: string) => void
  onCEPBlur: (zipCode: string) => Promise<void>
}

export function AddressSection({ formData, loadingCEP, onChange, onCEPBlur }: AddressSectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Endereço de entrega</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={formData.zipCode}
              onChange={(e) => onChange('zipCode', e.target.value)}
              onBlur={() => onCEPBlur(formData.zipCode)}
              placeholder="00000-000"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg"
            />
            {loadingCEP && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Digite o CEP e pressione Tab para buscar automaticamente</p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rua *
          </label>
          <input
            type="text"
            required
            value={formData.street}
            onChange={(e) => onChange('street', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número *
          </label>
          <input
            type="text"
            required
            value={formData.number}
            onChange={(e) => onChange('number', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={formData.complement}
            onChange={(e) => onChange('complement', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bairro *
          </label>
          <input
            type="text"
            required
            value={formData.district}
            onChange={(e) => onChange('district', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <input
            type="text"
            required
            value={formData.state}
            onChange={(e) => onChange('state', e.target.value)}
            placeholder="SP"
            maxLength={2}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ponto de referência
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => onChange('reference', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}
