'use client'

import { Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { TopProduct } from '@/types/reports'

interface TopProductsTableProps {
  products: TopProduct[]
  topN: number
  onTopNChange: (n: number) => void
}

export function TopProductsTable({ products, topN, onTopNChange }: TopProductsTableProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h2>
        </div>
        <select
          value={topN}
          onChange={(e) => onTopNChange(Number(e.target.value))}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
        </select>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum produto vendido no período selecionado</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-700">Produto</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Quantidade</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Receita</th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">Nº Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.product_name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-600">#{index + 1}</span>
                      <span className="font-medium">{product.product_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{product.total_quantity}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(product.total_revenue)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{product.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
