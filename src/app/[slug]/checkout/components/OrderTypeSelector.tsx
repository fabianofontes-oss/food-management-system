interface OrderTypeSelectorProps {
  selectedChannel: 'DELIVERY' | 'TAKEAWAY'
  onSelect: (channel: 'DELIVERY' | 'TAKEAWAY') => void
}

export function OrderTypeSelector({ selectedChannel, onSelect }: OrderTypeSelectorProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Tipo de pedido</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('DELIVERY')}
          className={`p-4 rounded-lg border-2 font-medium ${
            selectedChannel === 'DELIVERY'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => onSelect('TAKEAWAY')}
          className={`p-4 rounded-lg border-2 font-medium ${
            selectedChannel === 'TAKEAWAY'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          Retirada
        </button>
      </div>
    </div>
  )
}
