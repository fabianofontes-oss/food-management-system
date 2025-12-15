// Barrel export - Módulo Menu (Vertical Slice)

// Types
export * from './types'

// Repository
export { MenuRepository } from './repository'

// Server Actions
export {
  createProductAction,
  updateProductAction,
  toggleProductStatusAction,
  deleteProductAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction
} from './actions'

// Hooks
export { useMenu } from './hooks/use-menu'

// Components
export { ProductCard } from './components/product-card'
export { CategoryList } from './components/category-list'
export { MenuManager } from './components/menu-manager'
export { ProductForm } from './components/product-form'
export { ProductDialog, EditProductButton } from './components/product-dialog'
export { CategoryDialog } from './components/category-dialog'
export { CategoryManager } from './components/category-manager'
