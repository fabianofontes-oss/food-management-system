'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Pizza, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getProductWithModifiers } from '@/modules/menu'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import type { ProductWithModifiers, ModifierGroup, SelectedModifier, CartItemFlavor } from '@/types/menu'

// Produto simples para seleção de 2º sabor
interface SimpleProduct {
  id: string
  name: string
  base_price: number
  image_url?: string | null
}

interface ProductModalProps {
  productId: string
  storeSlug: string
  isOpen: boolean
  onClose: () => void
  categoryName?: string // Nome da categoria para verificar se é pizza
  categoryProducts?: SimpleProduct[] // Produtos da mesma categoria para meio-a-meio
}

export function ProductModal({ productId, storeSlug, isOpen, onClose, categoryName, categoryProducts }: ProductModalProps) {
  const [product, setProduct] = useState<ProductWithModifiers | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Estado para Meio a Meio (Pizza)
  const [isHalfHalf, setIsHalfHalf] = useState(false)
  const [secondFlavor, setSecondFlavor] = useState<SimpleProduct | null>(null)
  const [showFlavorPicker, setShowFlavorPicker] = useState(false)
  
  // Estado para Wizard de Montagem (Açaí)
  const [wizardStep, setWizardStep] = useState(0)
  
  const addItem = useCartStore((state) => state.addItem)
  
  // Verifica se a categoria permite frações (Pizza)
  const allowsFractions = categoryName?.toLowerCase().includes('pizza') || 
                          categoryName?.toLowerCase().includes('pizzas')
  
  // Detecta se deve usar modo Wizard (tem grupos obrigatórios)
  const requiredGroups = product?.modifier_groups.filter(g => g.required) || []
  const optionalGroups = product?.modifier_groups.filter(g => !g.required) || []
  const useWizardMode = requiredGroups.length >= 2 // Ativa wizard se tiver 2+ grupos obrigatórios
  const totalWizardSteps = requiredGroups.length + (optionalGroups.length > 0 ? 1 : 0) // +1 para opcionais
  
  // Grupo atual no wizard
  const currentWizardGroup = useWizardMode 
    ? (wizardStep < requiredGroups.length ? requiredGroups[wizardStep] : null)
    : null
  const isOnOptionalStep = useWizardMode && wizardStep >= requiredGroups.length

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

    // Calcular preço (média se for meio a meio)
    let finalPrice = product.base_price
    let productName = product.name
    let flavors: CartItemFlavor[] | undefined = undefined
    
    if (isHalfHalf && secondFlavor) {
      // Preço = média dos dois sabores
      finalPrice = (product.base_price + secondFlavor.base_price) / 2
      productName = `${product.name} + ${secondFlavor.name}`
      flavors = [
        { product_id: product.id, product_name: product.name, fraction: 0.5, price: product.base_price },
        { product_id: secondFlavor.id, product_name: secondFlavor.name, fraction: 0.5, price: secondFlavor.base_price }
      ]
    }

    for (let i = 0; i < quantity; i++) {
      addItem(
        storeSlug,
        product.id,
        productName,
        product.image_url,
        finalPrice,
        selectedModifiers,
        notes || undefined,
        flavors,
        isHalfHalf
      )
    }

    onClose()
    resetState()
  }
  
  function resetState() {
    setQuantity(1)
    setSelectedModifiers([])
    setNotes('')
    setIsHalfHalf(false)
    setSecondFlavor(null)
    setShowFlavorPicker(false)
    setWizardStep(0)
  }
  
  // Navegação do Wizard
  function canGoNextStep() {
    if (!currentWizardGroup) return true
    const selectedInGroup = selectedModifiers.filter(m => 
      currentWizardGroup.options.some(o => o.id === m.option_id)
    )
    return selectedInGroup.length >= currentWizardGroup.min_quantity
  }
  
  function handleNextStep() {
    if (wizardStep < totalWizardSteps - 1) {
      setWizardStep(prev => prev + 1)
    }
  }
  
  function handlePrevStep() {
    if (wizardStep > 0) {
      setWizardStep(prev => prev - 1)
    }
  }

  function calculateTotal() {
    if (!product) return 0
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + mod.extra_price, 0)
    
    // Se for meio a meio, usa a média dos preços
    let basePrice = product.base_price
    if (isHalfHalf && secondFlavor) {
      basePrice = (product.base_price + secondFlavor.base_price) / 2
    }
    
    return (basePrice + modifiersTotal) * quantity
  }
  
  function handleSelectSecondFlavor(flavor: SimpleProduct) {
    setSecondFlavor(flavor)
    setIsHalfHalf(true)
    setShowFlavorPicker(false)
  }
  
  function handleRemoveSecondFlavor() {
    setSecondFlavor(null)
    setIsHalfHalf(false)
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

              {/* 🍕 PIZZA BUILDER - Meio a Meio */}
              {allowsFractions && categoryProducts && categoryProducts.length > 1 && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                  <div className="flex items-center gap-2">
                    <Pizza className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-lg text-gray-900">Meio a Meio</h3>
                  </div>
                  
                  {!isHalfHalf ? (
                    <button
                      onClick={() => setShowFlavorPicker(true)}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-orange-300 bg-white hover:bg-orange-50 hover:border-orange-400 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Adicionar 2º Sabor</span>
                          <p className="text-sm text-gray-500">Preço será a média dos dois sabores</p>
                        </div>
                      </div>
                    </button>
                  ) : secondFlavor && (
                    <div className="p-4 rounded-xl border-2 border-orange-400 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">½ {product.name}</span>
                            <span className="mx-2 text-orange-500">+</span>
                            <span className="font-semibold text-gray-900">½ {secondFlavor.name}</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleRemoveSecondFlavor}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Preço: ({formatCurrency(product.base_price)} + {formatCurrency(secondFlavor.base_price)}) ÷ 2 = <strong className="text-orange-600">{formatCurrency((product.base_price + secondFlavor.base_price) / 2)}</strong>
                      </div>
                    </div>
                  )}
                  
                  {/* Modal de seleção do segundo sabor */}
                  {showFlavorPicker && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Escolha o 2º sabor:</h4>
                        <button onClick={() => setShowFlavorPicker(false)} className="p-1 hover:bg-gray-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {categoryProducts
                          .filter(p => p.id !== product.id)
                          .map(flavor => (
                            <button
                              key={flavor.id}
                              onClick={() => handleSelectSecondFlavor(flavor)}
                              className="w-full p-3 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900">{flavor.name}</span>
                              <span className="text-sm text-gray-500">{formatCurrency(flavor.base_price)}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== MODO WIZARD (Açaí) ========== */}
              {useWizardMode ? (
                <>
                  {/* Barra de Progresso */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700">
                        Etapa {wizardStep + 1} de {totalWizardSteps}
                      </span>
                      <span className="text-sm text-purple-600">
                        {currentWizardGroup?.name || 'Opcionais'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: totalWizardSteps }).map((_, i) => (
                        <div 
                          key={i}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            i < wizardStep ? 'bg-purple-500' :
                            i === wizardStep ? 'bg-purple-400 animate-pulse' :
                            'bg-purple-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Grupo Atual do Wizard */}
                  {currentWizardGroup && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{currentWizardGroup.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            Obrigatório
                          </span>
                          <span className="text-sm text-gray-600">
                            {currentWizardGroup.max_quantity === 1 
                              ? 'Escolha 1' 
                              : `Escolha ${currentWizardGroup.min_quantity} a ${currentWizardGroup.max_quantity}`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {currentWizardGroup.options.map(option => {
                          const isSelected = selectedModifiers.some(m => m.option_id === option.id)
                          return (
                            <button
                              key={option.id}
                              onClick={() => toggleModifier(currentWizardGroup.id, option.id, option.name, option.extra_price, currentWizardGroup)}
                              className={`w-full p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] text-left ${
                                isSelected
                                  ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="font-semibold text-gray-900">{option.name}</span>
                                </div>
                                {option.extra_price > 0 && (
                                  <span className="text-purple-600 font-bold">
                                    + {formatCurrency(option.extra_price)}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Opcionais (última etapa do wizard) */}
                  {isOnOptionalStep && optionalGroups.length > 0 && (
                    <>
                      {optionalGroups.map(group => (
                        <div key={group.id} className="space-y-3 p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                            <span className="text-sm text-gray-600">
                              Escolha até {group.max_quantity} (opcional)
                            </span>
                          </div>
                          <div className="space-y-2">
                            {group.options.map(option => {
                              const isSelected = selectedModifiers.some(m => m.option_id === option.id)
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => toggleModifier(group.id, option.id, option.name, option.extra_price, group)}
                                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-white hover:border-green-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className="font-semibold text-gray-900">{option.name}</span>
                                    </div>
                                    {option.extra_price > 0 && (
                                      <span className="text-green-600 font-bold">+ {formatCurrency(option.extra_price)}</span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {/* Observações só aparecem na última etapa */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ex: Sem granola, mais leite condensado..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                          rows={2}
                        />
                      </div>
                      
                      {/* Quantidade */}
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <span className="font-bold text-gray-900">Quantidade</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-purple-500">
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-10 text-center font-bold text-xl text-purple-600">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-purple-500">
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* ========== MODO NORMAL ========== */
                <>
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
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="font-semibold text-gray-900">{option.name}</span>
                                </div>
                                {option.extra_price > 0 && (
                                  <span className="text-green-600 font-bold">+ {formatCurrency(option.extra_price)}</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
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
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all">
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-10 text-center font-bold text-xl text-green-600">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-full bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ========== FOOTER COM BOTÕES ========== */}
            <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
              {useWizardMode ? (
                <div className="flex gap-3">
                  {wizardStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="h-14 px-6"
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Voltar
                    </Button>
                  )}
                  
                  {wizardStep < totalWizardSteps - 1 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={!canGoNextStep()}
                      className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Próximo
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canAddToCart()}
                      className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                    >
                      Adicionar • {formatCurrency(calculateTotal())}
                    </Button>
                  )}
                </div>
              ) : (
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
              )}
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
