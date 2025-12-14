'use client'

import { useState, useRef } from 'react'
import { 
  X, Tag, Plus, Pencil, Trash2, GripVertical, Check, 
  Pizza, Coffee, Salad, IceCream, Beef, Fish, Sandwich,
  Cookie, Wine, Beer, Soup, Cake, Apple, Carrot, Egg,
  ChevronDown, Palette, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCategory } from '@/types/products'

const CATEGORY_ICONS = [
  { name: 'Pizza', icon: Pizza },
  { name: 'Coffee', icon: Coffee },
  { name: 'Salad', icon: Salad },
  { name: 'IceCream', icon: IceCream },
  { name: 'Beef', icon: Beef },
  { name: 'Fish', icon: Fish },
  { name: 'Sandwich', icon: Sandwich },
  { name: 'Cookie', icon: Cookie },
  { name: 'Wine', icon: Wine },
  { name: 'Beer', icon: Beer },
  { name: 'Soup', icon: Soup },
  { name: 'Cake', icon: Cake },
  { name: 'Apple', icon: Apple },
  { name: 'Carrot', icon: Carrot },
  { name: 'Egg', icon: Egg },
  { name: 'Tag', icon: Tag },
]

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b'
]

interface CategoryManagerProps {
  categories: ProductCategory[]
  products: { category_id: string | null }[]
  onCreateCategory: (data: Partial<ProductCategory>) => Promise<void>
  onUpdateCategory: (id: string, data: Partial<ProductCategory>) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onReorderCategories: (orderedIds: string[]) => Promise<void>
  onClose: () => void
}

export function CategoryManager({
  categories,
  products,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onClose
}: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<ProductCategory>>({})
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3b82f6',
    is_active: true
  })
  const [showNewForm, setShowNewForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [localCategories, setLocalCategories] = useState(categories)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const getIconComponent = (iconName: string | null | undefined) => {
    const found = CATEGORY_ICONS.find(i => i.name === iconName)
    return found ? found.icon : Tag
  }

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId).length
  }

  const handleStartEdit = (category: ProductCategory) => {
    setEditingId(category.id)
    setEditingData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Tag',
      color: category.color || '#3b82f6',
      is_active: category.is_active
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.name?.trim()) return
    
    setSaving(true)
    try {
      await onUpdateCategory(editingId, editingData)
      setEditingId(null)
      setEditingData({})
    } catch (err) {
      console.error('Erro ao salvar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData({})
  }

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return
    
    setSaving(true)
    try {
      await onCreateCategory({
        name: newCategory.name,
        description: newCategory.description || null,
        icon: newCategory.icon,
        color: newCategory.color,
        is_active: newCategory.is_active,
        sort_order: categories.length
      })
      setNewCategory({
        name: '',
        description: '',
        icon: 'Tag',
        color: '#3b82f6',
        is_active: true
      })
      setShowNewForm(false)
    } catch (err) {
      console.error('Erro ao criar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      await onDeleteCategory(id)
      setConfirmDelete(null)
    } catch (err) {
      console.error('Erro ao deletar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (category: ProductCategory) => {
    setSaving(true)
    try {
      await onUpdateCategory(category.id, { is_active: !category.is_active })
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    } finally {
      setSaving(false)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedId && draggedId !== id) {
      const draggedIndex = localCategories.findIndex(c => c.id === draggedId)
      const targetIndex = localCategories.findIndex(c => c.id === id)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newCategories = [...localCategories]
        const [removed] = newCategories.splice(draggedIndex, 1)
        newCategories.splice(targetIndex, 0, removed)
        setLocalCategories(newCategories)
      }
    }
  }

  const handleDragEnd = async () => {
    if (draggedId) {
      const orderedIds = localCategories.map(c => c.id)
      await onReorderCategories(orderedIds)
    }
    setDraggedId(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Gerenciar Categorias</h2>
                <p className="text-sm text-slate-500">{categories.length} categorias cadastradas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* New Category Button/Form */}
          {!showNewForm ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Nova Categoria
            </button>
          ) : (
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                {/* Icon Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowIconPicker(showIconPicker === 'new' ? null : 'new')}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                    style={{ backgroundColor: newCategory.color + '20', color: newCategory.color }}
                  >
                    {(() => {
                      const IconComp = getIconComponent(newCategory.icon)
                      return <IconComp className="w-6 h-6" />
                    })()}
                  </button>
                  
                  {showIconPicker === 'new' && (
                    <div className="absolute top-14 left-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3 grid grid-cols-4 gap-2 w-48">
                      {CATEGORY_ICONS.map(({ name, icon: Icon }) => (
                        <button
                          key={name}
                          onClick={() => {
                            setNewCategory({ ...newCategory, icon: name })
                            setShowIconPicker(null)
                          }}
                          className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${newCategory.icon === name ? 'bg-orange-100 text-orange-600' : ''}`}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: newCategory.color }}
                  />
                  
                  {showColorPicker === 'new' && (
                    <div className="absolute top-10 left-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3 grid grid-cols-6 gap-2 w-48">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setNewCategory({ ...newCategory, color })
                            setShowColorPicker(null)
                          }}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newCategory.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Name Input */}
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Nome da categoria"
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  autoFocus
                />
              </div>

              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descrição (opcional)"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => setNewCategory({ ...newCategory, is_active: !newCategory.is_active })}
                    className={`p-1 rounded-lg transition-colors ${newCategory.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {newCategory.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                  <span className="text-sm text-slate-600">
                    {newCategory.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </label>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newCategory.name.trim() || saving}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  >
                    {saving ? 'Salvando...' : 'Criar Categoria'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            {localCategories.map((category) => {
              const IconComp = getIconComponent(category.icon)
              const productCount = getProductCount(category.id)
              const isEditing = editingId === category.id

              return (
                <div
                  key={category.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, category.id)}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-xl border transition-all ${
                    draggedId === category.id 
                      ? 'opacity-50 border-orange-400 bg-orange-50' 
                      : isEditing
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:shadow-md'
                  } ${!category.is_active ? 'opacity-60' : ''}`}
                >
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Icon Picker */}
                        <div className="relative">
                          <button
                            onClick={() => setShowIconPicker(showIconPicker === category.id ? null : category.id)}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                            style={{ 
                              backgroundColor: (editingData.color || '#3b82f6') + '20', 
                              color: editingData.color || '#3b82f6' 
                            }}
                          >
                            {(() => {
                              const EditIcon = getIconComponent(editingData.icon)
                              return <EditIcon className="w-6 h-6" />
                            })()}
                          </button>
                          
                          {showIconPicker === category.id && (
                            <div className="absolute top-14 left-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3 grid grid-cols-4 gap-2 w-48">
                              {CATEGORY_ICONS.map(({ name, icon: Icon }) => (
                                <button
                                  key={name}
                                  onClick={() => {
                                    setEditingData({ ...editingData, icon: name })
                                    setShowIconPicker(null)
                                  }}
                                  className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${editingData.icon === name ? 'bg-blue-100 text-blue-600' : ''}`}
                                >
                                  <Icon className="w-5 h-5" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Color Picker */}
                        <div className="relative">
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === category.id ? null : category.id)}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: editingData.color || '#3b82f6' }}
                          />
                          
                          {showColorPicker === category.id && (
                            <div className="absolute top-10 left-0 z-20 bg-white rounded-xl shadow-xl border border-slate-200 p-3 grid grid-cols-6 gap-2 w-48">
                              {CATEGORY_COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => {
                                    setEditingData({ ...editingData, color })
                                    setShowColorPicker(null)
                                  }}
                                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${editingData.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                      </div>

                      <input
                        type="text"
                        value={editingData.description || ''}
                        onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                        placeholder="Descrição (opcional)"
                        className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => setEditingData({ ...editingData, is_active: !editingData.is_active })}
                            className={`p-1 rounded-lg transition-colors ${editingData.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                          >
                            {editingData.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                          </button>
                          <span className="text-sm text-slate-600">
                            {editingData.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </label>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                            Cancelar
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveEdit} 
                            disabled={!editingData.name?.trim() || saving}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {saving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center gap-4">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: (category.color || '#3b82f6') + '20', 
                          color: category.color || '#3b82f6' 
                        }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 truncate">{category.name}</span>
                          {!category.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-600 rounded-full">
                              Inativa
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-slate-500 truncate">{category.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
                          {productCount} produto{productCount !== 1 ? 's' : ''}
                        </span>
                        
                        <button
                          onClick={() => handleToggleActive(category)}
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors ${category.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                          title={category.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {category.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        
                        {confirmDelete === category.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(category.id)}
                              disabled={saving}
                              className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                              title="Confirmar exclusão"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {categories.length === 0 && !showNewForm && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Tag className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhuma categoria</h3>
              <p className="text-slate-500 mb-4">Crie categorias para organizar seus produtos</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>💡 Arraste as categorias para reordená-las</span>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
