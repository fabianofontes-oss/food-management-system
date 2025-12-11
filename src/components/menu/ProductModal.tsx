'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getProductWithModifiers } from '@/lib/actions/menu'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import type { ProductWithModifiers, ModifierGroup, SelectedModifier } from '@/types/menu'

interface ProductModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export function ProductModal({ productId, isOpen, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<ProductWithModifiers | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct()
    }
  }, [isOpen, productId])

  async function loadProduct() {
    setLoading(true)
    const data = await getProductWithModifiers(productId)
    setProduct(data)
    setLoading(false)
  }

  function toggleModifier(groupId: string, optionId: string, name: string, price: number, group: ModifierGroup) {
    setSelectedModifiers(prev => {
      const existingInGroup = prev.filter(m => 
        product?.modifier_groups.find(g => g.id === groupId)?.options.some(o => o.id === m.option_id)
      )

      const isSelected = prev.some(m => m.option_id === optionId)

      if (isSelected) {
        return prev.filter(m => m.option_id !== optionId)
      }

      if (existingInGroup.length >= group.max_quantity) {
        if (group.max_quantity === 1) {
          return [...prev.filter(m => !existingInGroup.some(e => e.option_id === m.option_id)), { option_id: optionId, name, extra_price: price }]
        }
        return prev
      }

      return [...prev, { option_id: optionId, name, extra_price: price }]
    })
  }

  function handleAddToCart() {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addItem(
        product.id,
        product.name,
        product.image_url,
        product.base_price,
        selectedModifiers,
        notes || undefined
      )
    }

    onClose()
    setQuantity(1)
    setSelectedModifiers([])
    setNotes('')
  }

  function calculateTotal() {
    if (!product) return 0
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + mod.extra_price, 0)
    return (product.base_price + modifiersTotal) * quantity
  }

  function canAddToCart() {
    if (!product) return false
    
    for (const group of product.modifier_groups) {
      const selectedInGroup = selectedModifiers.filter(m => 
        group.options.some(o => o.id === m.option_id)
      )
      
      if (group.required && selectedInGroup.length < group.min_quantity) {
        return false
      }
    }
    
    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : product ? (
          <>
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between shadow-md">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {product.image_url && (
                <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {product.description && (
                <p className="text-gray-600">{product.description}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-green-600">
                  {formatCurrency(product.base_price)}
                </span>
                <span className="text-sm text-gray-500">preço base</span>
              </div>

              {product.modifier_groups.map(group => (
                <div key={group.id} className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {group.required && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Obrigatório</span>
                      )}
                      <span className="text-sm text-gray-600">
                        {group.max_quantity === 1 ? 'Escolha 1' : `Escolha até ${group.max_quantity}`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.options.map(option => {
                      const isSelected = selectedModifiers.some(m => m.option_id === option.id)
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleModifier(group.id, option.id, option.name, option.extra_price, group)}
                          className={`w-full p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] text-left ${
                            isSelected
                              ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-md'
                              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-semibold text-gray-900">{option.name}</span>
                            </div>
                            {option.extra_price > 0 && (
                              <span className="text-green-600 font-bold">
                                + {formatCurrency(option.extra_price)}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl">
                <span className="font-bold text-gray-900">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-10 text-center font-bold text-xl text-green-600">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Adicionar • {formatCurrency(calculateTotal())}
                </span>
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Produto não encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
