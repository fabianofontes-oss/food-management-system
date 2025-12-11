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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : product ? (
          <>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {product.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
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

              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(product.base_price)}
              </div>

              {product.modifier_groups.map(group => (
                <div key={group.id} className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-sm text-gray-500">
                      {group.required ? 'Obrigatório' : 'Opcional'}
                      {' • '}
                      {group.max_quantity === 1 ? 'Escolha 1' : `Escolha até ${group.max_quantity}`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {group.options.map(option => {
                      const isSelected = selectedModifiers.some(m => m.option_id === option.id)
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleModifier(group.id, option.id, option.name, option.extra_price, group)}
                          className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option.name}</span>
                            {option.extra_price > 0 && (
                              <span className="text-green-600">
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

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <span className="font-medium">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-full bg-white border hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-full bg-white border hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4">
              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                className="w-full h-12 text-lg"
              >
                Adicionar • {formatCurrency(calculateTotal())}
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
