'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
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
      className="w-full bg-white rounded-2xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-2xl transition-all overflow-hidden text-left group active:scale-[0.98]"
    >
      {/* Imagem - 60% do card */}
      {product.image_url ? (
        <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        {/* Nome */}
        <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Descrição */}
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
        )}
        
        {/* Preço - Destaque Verde */}
        <div className="flex items-baseline gap-1">
          <span className="font-extrabold text-2xl text-emerald-600">
            {formatPrice(product.base_price)}
          </span>
          {product.unit_type === 'weight' && (
            <span className="text-sm text-slate-400">/kg</span>
          )}
        </div>
        
        {/* Botão Adicionar - Full Width */}
        <div className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center gap-2 group-hover:from-emerald-600 group-hover:to-green-700 shadow-lg shadow-emerald-500/25 transition-all">
          <Plus className="w-5 h-5" />
          Adicionar
        </div>
      </div>
    </button>
  )
}
