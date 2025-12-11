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
      className="group w-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left transform hover:-translate-y-1"
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {product.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(product.base_price)}
            </p>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
