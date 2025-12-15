'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, FolderOpen, GripVertical } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CategoryDialog } from './category-dialog'
import { deleteCategoryAction } from '../actions'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  store_id: string
  sort_order?: number
  _count?: {
    products: number
  }
}

interface CategoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  storeSlug: string
  categories: Category[]
  onRefresh: () => void
}

export function CategoryManager({
  open,
  onOpenChange,
  storeId,
  storeSlug,
  categories,
  onRefresh
}: CategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNewCategory = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    const hasProducts = category._count && category._count.products > 0
    const message = hasProducts
      ? `Tem certeza que deseja excluir "${category.name}"?\n\n⚠️ Esta categoria possui ${category._count?.products} produto(s) vinculado(s).`
      : `Tem certeza que deseja excluir "${category.name}"?`

    if (!confirm(message)) return

    setDeletingId(category.id)
    try {
      const result = await deleteCategoryAction(storeSlug, category.id)
      if (result.success) {
        toast.success('Categoria excluída!')
        onRefresh()
      } else {
        toast.error(result.error || 'Erro ao excluir categoria')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ocorreu um erro inesperado')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDialogSuccess = () => {
    onRefresh()
  }

  const sortedCategories = [...categories].sort((a, b) => 
    (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Gerenciar Categorias
            </SheetTitle>
            <SheetDescription>
              Organize seus produtos em categorias para facilitar a navegação no cardápio.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Button onClick={handleNewCategory} className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>

            {sortedCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma categoria</p>
                <p className="text-sm mt-1">Crie categorias para organizar seus produtos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors group"
                  >
                    <div className="text-gray-400 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {category.name}
                      </p>
                      {category._count && (
                        <p className="text-xs text-gray-500">
                          {category._count.products} {category._count.products === 1 ? 'produto' : 'produtos'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={deletingId === category.id}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        storeId={storeId}
        storeSlug={storeSlug}
        category={editingCategory}
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}
