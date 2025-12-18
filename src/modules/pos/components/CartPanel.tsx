'use client'

import { useState } from 'react'
import { 
  ShoppingCart, Plus, Minus, Trash2, X, User, Hash, 
  MessageSquare, Percent, DollarSign, Heart, Banknote, 
  CreditCard, Smartphone, Check, Loader2, Sparkles 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { CartItem, PaymentMethod, DiscountType } from '../types'

interface CartPanelProps {
  cart: CartItem[]
  updateQuantity: (id: string, delta: number, obs?: string) => void
  removeItem: (id: string, obs?: string) => void
  addObsToItem: (id: string, obs: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  discountAmount: number
  serviceFeeAmount: number
  tipAmount: number
  total: number
  change: number
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  cashReceived: number
  setCashReceived: (value: number) => void
  discountType: DiscountType
  setDiscountType: (type: DiscountType) => void
  discountValue: number
  setDiscountValue: (value: number) => void
  serviceFee: boolean
  setServiceFee: (value: boolean) => void
  tipPercent: number
  setTipPercent: (value: number) => void
  customerName: string
  setCustomerName: (name: string) => void
  tableNumber: string
  setTableNumber: (table: string) => void
  processing: boolean
  success: boolean
  onCheckout: () => void
  darkMode: boolean
}

export function CartPanel({
  cart,
  updateQuantity,
  removeItem,
  addObsToItem,
  clearCart,
  itemCount,
  subtotal,
  discountAmount,
  serviceFeeAmount,
  tipAmount,
  total,
  change,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  serviceFee,
  setServiceFee,
  tipPercent,
  setTipPercent,
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
  processing,
  success,
  onCheckout,
  darkMode
}: CartPanelProps) {
  const [editingItemObs, setEditingItemObs] = useState<string | null>(null)
  const [tempObs, setTempObs] = useState('')

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  const handleAddObs = (id: string) => {
    if (tempObs.trim()) {
      addObsToItem(id, tempObs)
    }
    setTempObs('')
    setEditingItemObs(null)
  }

  return (
    <div className={`w-[420px] ${cardBg} border-l ${borderColor} flex flex-col`}>
      {/* Header */}
      <div className={`p-4 border-b ${borderColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className={`font-bold text-lg ${textColor}`}>Carrinho</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${textColor}`}>
              {itemCount} itens
            </span>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-gray-400 hover:text-red-500 p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cliente e Mesa */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <User className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
            <input
              type="text"
              placeholder="Cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full pl-8 pr-2 py-2 text-sm rounded-lg border ${borderColor} ${cardBg} ${textColor}`}
            />
          </div>
          <div className="relative">
            <Hash className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedText}`} />
            <input
              type="text"
              placeholder="Mesa"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className={`w-full pl-8 pr-2 py-2 text-sm rounded-lg border ${borderColor} ${cardBg} ${textColor}`}
            />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center ${mutedText}`}>
            <ShoppingCart className="w-12 h-12 mb-2" />
            <p>Carrinho vazio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${textColor}`}>{item.name}</p>
                    {item.addons?.map(addon => (
                      <p key={addon.id} className="text-xs text-blue-500">+ {addon.name} ({formatCurrency(addon.price)})</p>
                    ))}
                    {item.obs && <p className="text-xs text-orange-500">📝 {item.obs}</p>}
                  </div>
                  <div className="flex gap-1">
                    {!item.obs && (
                      <button
                        onClick={() => { setEditingItemObs(item.id); setTempObs('') }}
                        className={`p-1 ${mutedText} hover:text-orange-500`}
                        title="Adicionar observação"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => removeItem(item.id, item.obs)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {editingItemObs === item.id && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Ex: Sem cebola"
                      value={tempObs}
                      onChange={(e) => setTempObs(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddObs(item.id)}
                      className={`flex-1 px-2 py-1 text-sm rounded border ${borderColor} ${cardBg} ${textColor}`}
                      autoFocus
                    />
                    <button onClick={() => handleAddObs(item.id)} className="px-2 py-1 bg-orange-500 text-white rounded text-sm">OK</button>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1, item.obs)}
                      className={`w-7 h-7 rounded-full ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={`w-8 text-center font-medium ${textColor}`}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1, item.obs)}
                      className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-bold text-blue-500">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Pagamento */}
      {cart.length > 0 && (
        <div className={`border-t ${borderColor} p-4 space-y-3`}>
          {/* Desconto */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
              className={`px-3 py-2 rounded-lg border ${borderColor} ${cardBg} ${textColor} text-sm`}
            >
              {discountType === 'percent' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </button>
            <input
              type="number"
              placeholder="Desconto"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className={`flex-1 px-3 py-2 rounded-lg border ${borderColor} ${cardBg} ${textColor} text-sm`}
            />
            <button
              onClick={() => setServiceFee(!serviceFee)}
              className={`px-3 py-2 rounded-lg border text-sm ${serviceFee ? 'bg-purple-100 border-purple-500 text-purple-700' : `${borderColor} ${cardBg} ${textColor}`}`}
            >
              10%
            </button>
          </div>

          {/* Gorjeta */}
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${mutedText}`} />
            <span className={`text-sm ${mutedText}`}>Gorjeta:</span>
            {[0, 5, 10, 15].map(p => (
              <button
                key={p}
                onClick={() => setTipPercent(p)}
                className={`px-2 py-1 rounded text-xs ${tipPercent === p ? 'bg-pink-100 text-pink-700 border-pink-500' : `${cardBg} ${textColor}`} border ${borderColor}`}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Resumo */}
          <div className={`space-y-1 text-sm ${textColor}`}>
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-500"><span>Desconto</span><span>-{formatCurrency(discountAmount)}</span></div>}
            {serviceFee && <div className="flex justify-between text-purple-500"><span>Taxa 10%</span><span>+{formatCurrency(serviceFeeAmount)}</span></div>}
            {tipPercent > 0 && <div className="flex justify-between text-pink-500"><span>Gorjeta {tipPercent}%</span><span>+{formatCurrency(tipAmount)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
              <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'card', 'pix'] as PaymentMethod[]).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === method 
                    ? method === 'cash' ? 'border-green-500 bg-green-50 text-green-700'
                      : method === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-teal-500 bg-teal-50 text-teal-700'
                    : `border-gray-200 ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-300'} ${textColor}`
                }`}
              >
                {method === 'cash' ? <Banknote className="w-5 h-5" /> : method === 'card' ? <CreditCard className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                <span className="text-xs font-medium">{method === 'cash' ? 'Dinheiro' : method === 'card' ? 'Cartão' : 'PIX'}</span>
              </button>
            ))}
          </div>

          {/* Troco */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <input
                type="number"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                placeholder="Valor recebido"
                className={`w-full p-3 border ${borderColor} rounded-lg ${cardBg} ${textColor}`}
              />
              {cashReceived >= total && (
                <div className="flex justify-between text-green-600 font-bold text-lg">
                  <span>Troco</span><span>{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Botão Finalizar */}
          <Button
            onClick={onCheckout}
            disabled={processing || (paymentMethod === 'cash' && cashReceived < total)}
            className={`w-full h-14 text-lg transition-all ${
              success 
                ? 'bg-green-500 hover:bg-green-500' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : success ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                Venda Concluída!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Finalizar Venda (F2)
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
