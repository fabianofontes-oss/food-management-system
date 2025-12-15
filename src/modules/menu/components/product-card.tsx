'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Package, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/utils'
import { EditProductButton } from './product-dialog'
import type { ProductWithDetails, CategoryRow } from '../types'

interface ProductCardProps {
  product: ProductWithDetails
  onToggle: (productId: string, currentStatus: boolean) => void
  onDelete?: (productId: string) => void
  storeId: string
  storeSlug: string
  categories: CategoryRow[]
  onEditSuccess: () => void
}

export function ProductCard({ 
  product, 
  onToggle, 
  onDelete,
  storeId,
  storeSlug,
  categories,
  onEditSuccess
}: ProductCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    await onToggle(product.id, product.is_active)
    setIsToggling(false)
  }

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${!product.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Imagem do Produto */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-slate-300" />
              </div>
            )}
            {!product.is_active && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">Inativo</Badge>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex-1 py-3 pr-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                {product.category && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {product.category.name}
                  </Badge>
                )}
              </div>
              
              {/* Switch Ativo/Inativo */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <Switch
                  checked={product.is_active}
                  onCheckedChange={handleToggle}
                  disabled={isToggling}
                />
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              {/* Preço */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(product.base_price)}
                </span>
                {product.unit_type === 'weight' && (
                  <span className="text-xs text-slate-400">/kg</span>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-1">
                <EditProductButton
                  product={product}
                  storeId={storeId}
                  storeSlug={storeSlug}
                  categories={categories}
                  onSuccess={onEditSuccess}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete?.(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info de Estoque */}
            {product.track_inventory && product.stock_quantity !== null && (
              <div className="flex items-center gap-1 mt-2">
                <Package className="w-3 h-3 text-slate-400" />
                <span className={`text-xs ${product.stock_quantity <= 5 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {product.stock_quantity} em estoque
                </span>
              </div>
            )}

            {/* Modificadores */}
            {product.modifier_groups.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {product.modifier_groups.map((group) => (
                  <Badge key={group.id} variant="secondary" className="text-xs">
                    {group.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
