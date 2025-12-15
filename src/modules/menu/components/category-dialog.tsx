'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategoryAction, updateCategoryAction } from '../actions'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  store_id: string
  sort_order?: number
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string
  storeSlug: string
  category?: Category | null
  onSuccess?: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  storeId,
  storeSlug,
  category,
  onSuccess
}: CategoryDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!category

  useEffect(() => {
    if (open) {
      setName(category?.name || '')
    }
  }, [open, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('O nome da categoria é obrigatório')
      return
    }

    setLoading(true)
    try {
      if (isEditing && category) {
        const result = await updateCategoryAction(storeSlug, category.id, { name: name.trim() })
        if (result.success) {
          toast.success('Categoria atualizada!')
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(result.error || 'Erro ao atualizar categoria')
        }
      } else {
        const result = await createCategoryAction(storeSlug, { 
          name: name.trim(),
          store_id: storeId
        })
        if (result.success) {
          toast.success('Categoria criada!')
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(result.error || 'Erro ao criar categoria')
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Altere o nome da categoria.' 
                : 'Crie uma nova categoria para organizar seus produtos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Hambúrgueres, Bebidas, Sobremesas..."
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
