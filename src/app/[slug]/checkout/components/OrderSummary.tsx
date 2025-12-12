import { formatCurrency } from '@/lib/utils'

interface OrderSummaryProps {
  subtotal: number
  deliveryFee: number
  total: number
  showDeliveryFee: boolean
}

export function OrderSummary({ subtotal, deliveryFee, total, showDeliveryFee }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {showDeliveryFee && (
        <div className="flex justify-between text-gray-600">
          <span>Taxa de entrega</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
      )}
      <div className="border-t pt-3 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span className="text-green-600">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
