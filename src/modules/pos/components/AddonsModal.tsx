'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { CartAddon } from '../types'

interface AddonsModalProps {
  product: any
  storeId: string
  onConfirm: (addons: CartAddon[]) => void
  onClose: () => void
  darkMode: boolean
}

interface Addon {
  id: string
  name: string
  price: number
  category?: string
}

export function AddonsModal({ product, storeId, onConfirm, onClose, darkMode }: AddonsModalProps) {
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<CartAddon[]>([])
  const [loading, setLoading] = useState(true)

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'

  useEffect(() => {
    loadAddons()
  }, [])

  const loadAddons = async () => {
    try {
      const { data } = await supabase
        .from('addons')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name')
      
      if (data) setAddons(data)
    } catch (error) {
      console.error('Erro ao carregar adicionais:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAddon = (addon: Addon) => {
    const exists = selectedAddons.find(a => a.id === addon.id)
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))
    } else {
      setSelectedAddons([...selectedAddons, {
        id: addon.id,
        name: addon.name,
        price: addon.price
      }])
    }
  }

  const totalAddons = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const finalPrice = product.base_price + totalAddons

  const handleConfirm = () => {
    onConfirm(selectedAddons)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${cardBg} rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${textColor}`}>{product.name}</h2>
            <p className={mutedText}>{formatCurrency(product.base_price)}</p>
          </div>
          <button onClick={onClose} className={`p-1 hover:bg-gray-100 rounded ${mutedText}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Adicionais */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className={`text-center py-8 ${mutedText}`}>Carregando...</div>
          ) : addons.length === 0 ? (
            <div className={`text-center py-8 ${mutedText}`}>Nenhum adicional disponível</div>
          ) : (
            <div className="space-y-2">
              <p className={`text-sm font-medium ${textColor} mb-3`}>Selecione os adicionais:</p>
              {addons.map(addon => {
                const isSelected = selectedAddons.some(a => a.id === addon.id)
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : `${borderColor} hover:border-gray-300`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={textColor}>{addon.name}</span>
                    </div>
                    <span className="text-blue-600 font-medium">+{formatCurrency(addon.price)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${borderColor} space-y-3`}>
          {selectedAddons.length > 0 && (
            <div className={`flex justify-between text-sm ${textColor}`}>
              <span>Adicionais ({selectedAddons.length})</span>
              <span className="text-blue-600">+{formatCurrency(totalAddons)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold text-lg ${textColor}`}>
            <span>Total</span>
            <span className="text-blue-600">{formatCurrency(finalPrice)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setSelectedAddons([]); handleConfirm() }} className="flex-1">
              Sem Adicionais
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
