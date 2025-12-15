'use client'

import Image from 'next/image'
import type { Product } from '@/types/menu'

interface ProductCardCompactProps {
  product: Product
  onClick: () => void
}

export function ProductCardCompact({ product, onClick }: ProductCardCompactProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-100 hover:border-current hover:shadow-md transition-all text-left"
      style={{ borderColor: 'var(--theme-primary, #10B981)' }}
    >
      {product.image_url && (
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--theme-text, #111827)' }}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-sm" style={{ color: 'var(--theme-primary, #10B981)' }}>
            {formatPrice(product.base_price)}
          </span>
          {product.unit_type === 'weight' && (
            <span className="text-xs text-gray-500">/kg</span>
          )}
        </div>
      </div>
    </button>
  )
}
