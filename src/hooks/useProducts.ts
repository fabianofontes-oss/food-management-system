import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Product {
  id: string
  store_id: string
  category_id: string
  name: string
  description: string
  base_price: number
  image_url: string | null
  is_active: boolean
  created_at: string
}

export function useProducts(storeId?: string) {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [storeId])

  async function fetchProducts() {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()

      if (error) throw error
      await fetchProducts()
      return data
    } catch (err) {
      throw err
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await fetchProducts()
    } catch (err) {
      throw err
    }
  }

  async function deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchProducts()
    } catch (err) {
      throw err
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  }
}
