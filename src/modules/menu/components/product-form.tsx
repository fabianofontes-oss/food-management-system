'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { createProductAction, updateProductAction } from '../actions'
import type { CategoryRow, ProductWithDetails } from '../types'

// Schema de validação
const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  category_id: z.string().uuid('Selecione uma categoria'),
  base_price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
  unit_type: z.enum(['unit', 'weight'], {
    required_error: 'Selecione o tipo de unidade',
  }),
  price_per_unit: z.coerce.number().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  track_inventory: z.boolean(),
  stock_quantity: z.coerce.number().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  storeId: string
  storeSlug: string
  categories: CategoryRow[]
  defaultValues?: ProductWithDetails
  onSuccess: () => void
  onCancel?: () => void
}

export function ProductForm({
  storeId,
  storeSlug,
  categories,
  defaultValues,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!defaultValues

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      category_id: defaultValues?.category_id || '',
      base_price: defaultValues?.base_price || 0,
      unit_type: defaultValues?.unit_type || 'unit',
      price_per_unit: defaultValues?.price_per_unit || undefined,
      image_url: defaultValues?.image_url || '',
      is_active: defaultValues?.is_active ?? true,
      track_inventory: defaultValues?.track_inventory ?? false,
      stock_quantity: defaultValues?.stock_quantity || undefined,
    },
  })

  const watchUnitType = form.watch('unit_type')
  const watchTrackInventory = form.watch('track_inventory')

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true)

    try {
      const payload = {
        store_id: storeId,
        name: data.name,
        description: data.description || undefined,
        category_id: data.category_id,
        base_price: data.base_price,
        unit_type: data.unit_type,
        price_per_unit: data.unit_type === 'weight' ? data.price_per_unit : undefined,
        image_url: data.image_url || undefined,
        is_active: data.is_active,
        track_inventory: data.track_inventory,
        stock_quantity: data.track_inventory ? (data.stock_quantity || 0) : undefined,
      }

      let result

      if (isEditing && defaultValues) {
        result = await updateProductAction(storeSlug, defaultValues.id, payload)
      } else {
        result = await createProductAction(storeSlug, payload as any)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!')
      onSuccess()
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      toast.error(error.message || 'Erro ao salvar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Imagem URL */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://exemplo.com/imagem.jpg"
                      {...field}
                    />
                  </div>
                  {field.value && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={field.value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: X-Burger Especial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o produto..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preço e Tipo de Unidade */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Base (R$) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Unidade *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unit">Por Unidade</SelectItem>
                    <SelectItem value="weight">Por Peso (kg)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Preço por kg (apenas se unit_type === 'weight') */}
        {watchUnitType === 'weight' && (
          <FormField
            control={form.control}
            name="price_per_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço por kg (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Controle de Estoque */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
          <FormField
            control={form.control}
            name="track_inventory"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="cursor-pointer">Controlar Estoque</FormLabel>
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchTrackInventory && (
            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Estoque</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Status Ativo */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <FormLabel className="cursor-pointer">Produto Ativo</FormLabel>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
