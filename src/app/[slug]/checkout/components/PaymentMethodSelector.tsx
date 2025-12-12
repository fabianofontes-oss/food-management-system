import type { PaymentMethod } from '../types'

interface PaymentMethodSelectorProps {
  availableMethods: PaymentMethod[]
  selectedMethod: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ availableMethods, selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  if (availableMethods.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-lg">Forma de pagamento</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>⚠️ Atenção:</strong> Nenhum método de pagamento configurado. Entre em contato com a loja.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Forma de pagamento</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {availableMethods.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onSelect(method)}
            className={`p-4 rounded-lg border-2 font-medium ${
              selectedMethod === method
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {method === 'PIX' && 'PIX'}
            {method === 'CASH' && 'Dinheiro'}
            {method === 'CARD' && 'Cartão na Entrega'}
          </button>
        ))}
      </div>
    </div>
  )
}
