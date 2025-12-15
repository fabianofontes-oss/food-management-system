'use client'

import Image from 'next/image'
import { Tag } from 'lucide-react'
import type { Product } from '@/types/menu'

interface ProductCardListProps {
  product: Product
  onClick: () => void
}

export function ProductCardList({ product, onClick }: ProductCardListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex gap-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-current hover:shadow-lg transition-all text-left group"
      style={{ borderColor: 'var(--theme-primary, #10B981)' }}
    >
      {product.image_url && (
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="128px"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-xl line-clamp-1" style={{ color: 'var(--theme-text, #111827)' }}>
              {product.name}
            </h3>
            {product.unit_type === 'weight' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full flex-shrink-0">
                <Tag className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Por peso</span>
              </div>
            )}
          </div>
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-2xl" style={{ color: 'var(--theme-primary, #10B981)' }}>
              {formatPrice(product.base_price)}
            </span>
            {product.unit_type === 'weight' && (
              <span className="text-sm text-gray-500">/kg</span>
            )}
          </div>
          
          <div 
            className="px-6 py-2 rounded-lg text-white font-semibold group-hover:scale-105 transition-transform"
            style={{ backgroundColor: 'var(--theme-accent, #F59E0B)' }}
          >
            Adicionar
          </div>
        </div>
      </div>
    </button>
  )
}
