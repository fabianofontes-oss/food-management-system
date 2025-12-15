'use client'

import Image from 'next/image'
import type { Product } from '@/types/menu'

interface ProductCardGridProps {
  product: Product
  onClick: () => void
}

export function ProductCardGrid({ product, onClick }: ProductCardGridProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border-2 border-gray-100 hover:border-current hover:shadow-xl transition-all overflow-hidden text-left group"
      style={{ borderColor: 'var(--theme-primary, #10B981)' }}
    >
      {product.image_url ? (
        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1" style={{ color: 'var(--theme-text, #111827)' }}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        )}
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
            className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: 'var(--theme-accent, #F59E0B)' }}
          >
            Ver mais
          </div>
        </div>
      </div>
    </button>
  )
}
