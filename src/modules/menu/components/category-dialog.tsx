'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
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

// Cores pré-definidas para categorias
const CATEGORY_COLORS = [
  { id: 'red', name: 'Vermelho', bg: 'bg-red-500', ring: 'ring-red-500' },
  { id: 'orange', name: 'Laranja', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'amber', name: 'Amarelo', bg: 'bg-amber-400', ring: 'ring-amber-400' },
  { id: 'green', name: 'Verde', bg: 'bg-green-500', ring: 'ring-green-500' },
  { id: 'blue', name: 'Azul', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'purple', name: 'Roxo', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'stone', name: 'Marrom', bg: 'bg-stone-600', ring: 'ring-stone-600' },
  { id: 'slate', name: 'Preto', bg: 'bg-slate-900', ring: 'ring-slate-900' },
]

interface Category {
  id: string
  name: string
  store_id: string
  sort_order?: number
  color?: string | null
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
  const [color, setColor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!category

  useEffect(() => {
    if (open) {
      setName(category?.name || '')
      setColor(category?.color || null)
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
        const result = await updateCategoryAction(storeSlug, category.id, { 
          name: name.trim(),
          color: color || undefined
        })
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
          store_id: storeId,
          color: color || undefined
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
                ? 'Altere o nome e a cor da categoria.' 
                : 'Crie uma nova categoria para organizar seus produtos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Nome */}
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

            {/* Seletor de Cor - Bolinhas Clicáveis */}
            <div className="grid gap-3">
              <Label>Cor da Categoria (opcional)</Label>
              <div className="flex flex-wrap gap-3">
                {/* Opção sem cor */}
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  className={`
                    w-10 h-10 rounded-full border-2 border-dashed border-slate-300
                    flex items-center justify-center transition-all
                    hover:border-slate-400 hover:scale-110
                    ${color === null ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}
                  `}
                  title="Sem cor"
                >
                  {color === null && (
                    <Check className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                
                {/* Bolinhas de cores */}
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`
                      w-10 h-10 rounded-full ${c.bg}
                      flex items-center justify-center transition-all
                      hover:scale-110 shadow-md
                      ${color === c.id ? `ring-2 ring-offset-2 ${c.ring} scale-110` : ''}
                    `}
                    title={c.name}
                  >
                    {color === c.id && (
                      <Check className="w-5 h-5 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A cor aparece no cardápio para destacar a categoria
              </p>
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
