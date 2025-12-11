'use client'

import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/menu'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 text-left"
    >
      <div className="flex gap-4">
        {product.image_url && (
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(product.base_price)}
          </p>
        </div>
      </div>
    </button>
  )
}
