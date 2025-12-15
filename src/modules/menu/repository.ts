import { createClient } from '@/lib/supabase/client'
import type { 
  MenuCatalog, 
  ProductWithDetails, 
  CategoryRow,
  ProductRow,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput
} from './types'

const supabase = createClient()

export const MenuRepository = {
  /**
   * Busca o catálogo completo de uma loja (categorias + produtos com relacionamentos)
   */
  async getCatalog(storeId: string): Promise<MenuCatalog> {
    // Buscar categorias ativas
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (catError) throw catError

    // Buscar produtos com categoria e grupos de modificadores
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        product_modifier_groups(
          modifier_group:modifier_groups(
            *,
            options:modifier_options(*)
          )
        )
      `)
      .eq('store_id', storeId)
      .order('name', { ascending: true })

    if (prodError) throw prodError

    // Transformar estrutura de produtos para incluir modifier_groups diretamente
    const transformedProducts: ProductWithDetails[] = (products || []).map((product: any) => {
      const modifierGroups = (product.product_modifier_groups || [])
        .map((pmg: any) => pmg.modifier_group)
        .filter(Boolean)
        .map((group: any) => ({
          ...group,
          options: (group.options || [])
            .filter((opt: any) => opt.is_active)
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
        }))
        .sort((a: any, b: any) => a.sort_order - b.sort_order)

      return {
        ...product,
        category: product.category,
        modifier_groups: modifierGroups,
        product_modifier_groups: undefined // Remove campo intermediário
      }
    })

    return {
      categories: categories || [],
      products: transformedProducts
    }
  },

  /**
   * Busca um produto específico com todos os relacionamentos
   */
  async getProduct(productId: string): Promise<ProductWithDetails | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        product_modifier_groups(
          modifier_group:modifier_groups(
            *,
            options:modifier_options(*)
          )
        )
      `)
      .eq('id', productId)
      .single()

    if (error || !data) return null

    const modifierGroups = (data.product_modifier_groups || [])
      .map((pmg: any) => pmg.modifier_group)
      .filter(Boolean)
      .map((group: any) => ({
        ...group,
        options: (group.options || [])
          .filter((opt: any) => opt.is_active)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
      }))

    return {
      ...data,
      category: data.category,
      modifier_groups: modifierGroups
    } as ProductWithDetails
  },

  /**
   * Cria um novo produto
   */
  async createProduct(data: CreateProductInput): Promise<ProductRow> {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return product
  },

  /**
   * Atualiza um produto existente
   */
  async updateProduct(productId: string, data: UpdateProductInput): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', productId)

    if (error) throw error
  },

  /**
   * Ativa/Desativa um produto rapidamente
   */
  async toggleProductStatus(productId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)

    if (error) throw error
  },

  /**
   * Remove um produto (soft delete via is_active ou hard delete)
   */
  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
  },

  // ============================================
  // CATEGORIAS
  // ============================================

  /**
   * Cria uma nova categoria
   */
  async createCategory(data: CreateCategoryInput): Promise<CategoryRow> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return category
  },

  /**
   * Atualiza uma categoria
   */
  async updateCategory(categoryId: string, data: UpdateCategoryInput): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', categoryId)

    if (error) throw error
  },

  /**
   * Remove uma categoria
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
  },

  /**
   * Reordena categorias
   */
  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => 
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
    )

    await Promise.all(updates)
  }
}
