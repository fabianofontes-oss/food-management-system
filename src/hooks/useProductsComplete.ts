import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, ProductFormData, ProductCategory, MeasurementUnit, AddonGroup } from '@/types/products'

export const useProductsComplete = (storeId: string | null) => {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([])
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

      const [productsRes, categoriesRes, unitsRes, addonGroupsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            variations:product_variations(*),
            addon_groups:product_addon_groups(
              *,
              addon_group:addon_groups(
                *,
                addons(*)
              )
            )
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
          .order('name'),
        supabase
          .from('addon_groups')
          .select(`
            *,
            addons(*)
          `)
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('sort_order')
      ])

      console.log('[useProductsComplete] Respostas recebidas:', {
        products: productsRes.data?.length || 0,
        productsError: productsRes.error,
        categories: categoriesRes.data?.length || 0,
        categoriesError: categoriesRes.error,
        units: unitsRes.data?.length || 0,
        unitsError: unitsRes.error,
        addonGroups: addonGroupsRes.data?.length || 0,
        addonGroupsError: addonGroupsRes.error
      })

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (unitsRes.error) throw unitsRes.error

      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setUnits(unitsRes.data || [])
      setAddonGroups(addonGroupsRes.data || [])
    } catch (err: any) {
      console.error('[useProductsComplete] Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (data: ProductFormData) => {
    try {
      const { ingredients, variations, addon_group_ids, ...productData } = data
      
      // Mapear price para base_price
      const insertData = {
        ...productData,
        base_price: productData.price,
        store_id: storeId
      }
      delete (insertData as any).price
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single()

      if (productError) throw productError

      // Salvar ingredientes
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

      // Salvar variações
      if (data.has_variations && variations.length > 0) {
        const variationsData = variations.map((v, index) => ({
          product_id: product.id,
          name: v.name,
          price: v.price,
          is_default: v.is_default,
          sort_order: index
        }))

        const { error: variationsError } = await supabase
          .from('product_variations')
          .insert(variationsData)

        if (variationsError) console.warn('Erro ao salvar variações:', variationsError)
      }

      // Salvar grupos de adicionais
      if (addon_group_ids.length > 0) {
        const addonGroupsData = addon_group_ids.map((groupId, index) => ({
          product_id: product.id,
          addon_group_id: groupId,
          sort_order: index
        }))

        const { error: addonGroupsError } = await supabase
          .from('product_addon_groups')
          .insert(addonGroupsData)

        if (addonGroupsError) console.warn('Erro ao salvar grupos de adicionais:', addonGroupsError)
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
      const { ingredients, variations, addon_group_ids, ...productData } = data
      
      // Mapear price para base_price
      const updateData: any = { ...productData }
      if (updateData.price !== undefined) {
        updateData.base_price = updateData.price
        delete updateData.price
      }
      
      const { error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

      if (productError) throw productError

      // Atualizar ingredientes
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

      // Atualizar variações
      if (data.has_variations !== undefined && variations) {
        await supabase
          .from('product_variations')
          .delete()
          .eq('product_id', id)

        if (variations.length > 0) {
          const variationsData = variations.map((v, index) => ({
            product_id: id,
            name: v.name,
            price: v.price,
            is_default: v.is_default,
            sort_order: index
          }))

          const { error: variationsError } = await supabase
            .from('product_variations')
            .insert(variationsData)

          if (variationsError) console.warn('Erro ao salvar variações:', variationsError)
        }
      }

      // Atualizar grupos de adicionais
      if (addon_group_ids !== undefined) {
        await supabase
          .from('product_addon_groups')
          .delete()
          .eq('product_id', id)

        if (addon_group_ids.length > 0) {
          const addonGroupsData = addon_group_ids.map((groupId, index) => ({
            product_id: id,
            addon_group_id: groupId,
            sort_order: index
          }))

          const { error: addonGroupsError } = await supabase
            .from('product_addon_groups')
            .insert(addonGroupsData)

          if (addonGroupsError) console.warn('Erro ao salvar grupos de adicionais:', addonGroupsError)
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

  const updateCategory = async (id: string, data: Partial<ProductCategory>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (err: any) {
      console.error('Erro ao atualizar categoria:', err)
      throw err
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      // Primeiro, remove a categoria dos produtos
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id)

      // Depois, deleta a categoria
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (err: any) {
      console.error('Erro ao deletar categoria:', err)
      throw err
    }
  }

  const reorderCategories = async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('categories')
          .update({ sort_order: index })
          .eq('id', id)
      )
      
      await Promise.all(updates)
      await fetchData()
    } catch (err: any) {
      console.error('Erro ao reordenar categorias:', err)
      throw err
    }
  }

  return {
    products,
    categories,
    units,
    addonGroups,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refreshData: fetchData
  }
}
