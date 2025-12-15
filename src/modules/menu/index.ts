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
