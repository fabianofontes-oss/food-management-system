import { ShoppingCart } from 'lucide-react'
import type { UseFormSetValue, FieldValues } from 'react-hook-form'

interface CheckoutSectionProps {
  checkoutMode: 'guest' | 'phone_required'
  setValue: UseFormSetValue<any>
}

export function CheckoutSection({ checkoutMode, setValue }: CheckoutSectionProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modo de Checkout
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Escolha como os clientes devem finalizar pedidos no cardápio público
          </p>
          <select
            value={checkoutMode || 'phone_required'}
            onChange={(e) => setValue('checkout.mode', e.target.value as 'guest' | 'phone_required')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
          >
            <option value="phone_required">Telefone obrigatório (sem OTP)</option>
            <option value="guest">Guest (telefone opcional)</option>
          </select>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              {checkoutMode === 'guest' 
                ? '✓ Clientes podem finalizar pedidos sem informar telefone'
                : '✓ Clientes devem informar telefone para finalizar pedidos'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
