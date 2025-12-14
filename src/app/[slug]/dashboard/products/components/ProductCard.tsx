import { Edit, Trash2, Clock, Package, DollarSign, AlertCircle, FileText } from 'lucide-react'
import { Product } from '@/types/products'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onRecipe?: (product: Product) => void
}

export const ProductCard = ({ product, onEdit, onDelete, onRecipe }: ProductCardProps) => {
  const isLowStock = (product.stock_quantity || 0) <= (product.min_stock || 0) && (product.min_stock || 0) > 0
  const margin = (product.base_price || 0) > 0 && (product.cost_price || 0) > 0 
    ? (((product.base_price || 0) - (product.cost_price || 0)) / (product.base_price || 0) * 100).toFixed(1)
    : null

  return (
    <div className={`bg-white rounded-xl shadow-lg p-5 border-2 transition-all hover:shadow-xl ${
      !product.is_active ? 'opacity-60 border-gray-300' : 'border-transparent'
    } ${isLowStock ? 'border-red-300' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
          {product.category && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {product.category.name}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {onRecipe && (
            <button
              onClick={() => onRecipe(product)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Ficha Técnica"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Deletar ${product.name}?`)) {
                onDelete(product.id)
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Deletar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {product.is_composed && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            🍽️ Composto
          </span>
        )}
        {product.requires_kitchen && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            👨‍🍳 Cozinha
          </span>
        )}
        {product.prep_time > 0 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {product.prep_time} min
          </span>
        )}
        {isLowStock && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Estoque Baixo
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Preço</span>
          </div>
          <div className="text-xl font-bold text-green-900">{formatCurrency(product.base_price)}</div>
          {margin && (
            <div className="text-xs text-green-600 mt-1">Margem: {margin}%</div>
          )}
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Estoque</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {product.stock_quantity?.toFixed(2) || '0.00'}
          </div>
          {product.unit && (
            <div className="text-xs text-blue-600 mt-1">{product.unit.name}</div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {product.is_composed && product.ingredients && product.ingredients.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs font-semibold text-orange-900 mb-2">Ingredientes:</div>
          <div className="space-y-1">
            {product.ingredients.slice(0, 3).map(ing => (
              <div key={ing.id} className="text-xs text-orange-700 flex items-center gap-1">
                <span>•</span>
                <span>{ing.ingredient?.name}</span>
                <span className="text-orange-500">
                  ({ing.quantity} {ing.unit?.code || ''})
                </span>
              </div>
            ))}
            {product.ingredients.length > 3 && (
              <div className="text-xs text-orange-600 font-medium">
                +{product.ingredients.length - 3} mais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {product.sku && <span>SKU: {product.sku}</span>}
        </div>
        <div className={`text-xs font-medium ${product.is_active ? 'text-green-600' : 'text-red-600'}`}>
          {product.is_active ? '✓ Ativo' : '✗ Inativo'}
        </div>
      </div>
    </div>
  )
}
