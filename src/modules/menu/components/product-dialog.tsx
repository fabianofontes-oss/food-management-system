'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ProductForm } from './product-form'
import type { CategoryRow, ProductWithDetails } from '../types'

interface ProductDialogProps {
  storeId: string
  storeSlug: string
  categories: CategoryRow[]
  productToEdit?: ProductWithDetails
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function ProductDialog({
  storeId,
  storeSlug,
  categories,
  productToEdit,
  onSuccess,
  trigger,
}: ProductDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!productToEdit

  const handleSuccess = () => {
    setOpen(false)
    onSuccess()
  }

  const defaultTrigger = isEditing ? (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Pencil className="w-4 h-4" />
    </Button>
  ) : (
    <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg shadow-orange-500/25">
      <Plus className="w-4 h-4 mr-2" />
      Novo Produto
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ProductForm
            storeId={storeId}
            storeSlug={storeSlug}
            categories={categories}
            defaultValues={productToEdit}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Componente separado para o botão de edição (usado no ProductCard)
interface EditProductButtonProps {
  product: ProductWithDetails
  storeId: string
  storeSlug: string
  categories: CategoryRow[]
  onSuccess: () => void
}

export function EditProductButton({
  product,
  storeId,
  storeSlug,
  categories,
  onSuccess,
}: EditProductButtonProps) {
  return (
    <ProductDialog
      storeId={storeId}
      storeSlug={storeSlug}
      categories={categories}
      productToEdit={product}
      onSuccess={onSuccess}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      }
    />
  )
}
