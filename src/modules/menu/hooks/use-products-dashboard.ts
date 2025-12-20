'use client'

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
    if (!storeId) {
      setProducts([])
      setLoading(false)
      setError(null)
      return
    }

    fetchProducts()
  }, [storeId])

  async function fetchProducts() {
    try {
      if (!storeId) {
        setProducts([])
        return
      }

      setLoading(true)
      const query = supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name')

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
    const { data, error } = await supabase.from('products').insert([product]).select().single()

    if (error) throw error

    await fetchProducts()
    return data
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    const { error } = await supabase.from('products').update(updates).eq('id', id)

    if (error) throw error

    await fetchProducts()
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) throw error

    await fetchProducts()
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
