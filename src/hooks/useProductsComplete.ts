import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product, ProductFormData, ProductCategory, MeasurementUnit } from '@/types/products'

export const useProductsComplete = (storeId: string | null) => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (storeId) {
      fetchData()
    }
  }, [storeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useProductsComplete] Iniciando fetchData com storeId:', storeId)

      const [productsRes, categoriesRes, unitsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('store_id', storeId)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeId)
          .order('sort_order'),
        supabase
          .from('measurement_units')
          .select('*')
          .order('name')
      ])

      console.log('[useProductsComplete] Respostas recebidas:', {
        products: productsRes.data?.length || 0,
        productsError: productsRes.error,
        categories: categoriesRes.data?.length || 0,
        categoriesError: categoriesRes.error,
        units: unitsRes.data?.length || 0,
        unitsError: unitsRes.error
      })

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (unitsRes.error) throw unitsRes.error

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setUnits(unitsRes.data || [])
    } catch (err: any) {
      console.error('[useProductsComplete] Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (data: ProductFormData) => {
    try {
      const { ingredients, ...productData } = data
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{ ...productData, store_id: storeId }])
        .select()
        .single()

      if (productError) throw productError

      if (data.is_composed && ingredients.length > 0) {
        const ingredientsData = ingredients.map(ing => ({
          product_id: product.id,
          ...ing
        }))

        const { error: ingredientsError } = await supabase
          .from('product_ingredients')
          .insert(ingredientsData)

        if (ingredientsError) throw ingredientsError
      }

      await fetchData()
      return product
    } catch (err: any) {
      console.error('Erro ao criar produto:', err)
      throw err
    }
  }

  const updateProduct = async (id: string, data: Partial<ProductFormData>) => {
    try {
      const { ingredients, ...productData } = data
      
      const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)

      if (productError) throw productError

      if (data.is_composed !== undefined && ingredients) {
        await supabase
          .from('product_ingredients')
          .delete()
          .eq('product_id', id)

        if (ingredients.length > 0) {
          const ingredientsData = ingredients.map(ing => ({
            product_id: id,
            ...ing
          }))

          const { error: ingredientsError } = await supabase
            .from('product_ingredients')
            .insert(ingredientsData)

          if (ingredientsError) throw ingredientsError
        }
      }

      await fetchData()
    } catch (err: any) {
      console.error('Erro ao atualizar produto:', err)
      throw err
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (err: any) {
      console.error('Erro ao deletar produto:', err)
      throw err
    }
  }

  const createCategory = async (data: Partial<ProductCategory>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...data, store_id: storeId }])

      if (error) throw error
      await fetchData()
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err)
      throw err
    }
  }

  return {
    products,
    categories,
    units,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    refreshData: fetchData
  }
}
