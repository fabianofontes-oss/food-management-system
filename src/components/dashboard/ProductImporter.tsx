'use client'

import { useState, useMemo } from 'react'
import { 
  Package, Check, X, Percent, Import, Search,
  ChevronRight, Sparkles, AlertCircle, Loader2,
  GlassWater, Droplets, Zap, Beer, Cherry, IceCream,
  Candy, Cookie, Beef, Salad, Pizza, Fish, Coffee,
  Leaf, Cake, LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { STARTER_PACKS, StarterPack, PresetItem, getPacksStats } from '@/data/product-presets'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const iconMap: Record<string, LucideIcon> = {
  GlassWater, Droplets, Zap, Beer, Cherry, IceCream,
  Candy, Cookie, Beef, Salad, Pizza, Fish, Coffee,
  Leaf, Cake, Package
}

interface ProductImporterProps {
  storeId: string
  onImportComplete?: (count: number) => void
}

export function ProductImporter({ storeId, onImportComplete }: ProductImporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'packs' | 'items' | 'importing'>('packs')
  const [selectedPack, setSelectedPack] = useState<StarterPack | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [bulkAdjustment, setBulkAdjustment] = useState(0)
  const [adjustedItems, setAdjustedItems] = useState<PresetItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const stats = getPacksStats()
  const supabase = createClient()

  // Filtrar packs por busca
  const filteredPacks = useMemo(() => {
    if (!searchTerm) return STARTER_PACKS
    const term = searchTerm.toLowerCase()
    return STARTER_PACKS.filter(pack => 
      pack.name.toLowerCase().includes(term) ||
      pack.description.toLowerCase().includes(term) ||
      pack.category_suggestion.toLowerCase().includes(term)
    )
  }, [searchTerm])

  // Selecionar um pack
  function handleSelectPack(pack: StarterPack) {
    setSelectedPack(pack)
    setSelectedItems(new Set(pack.items.map((_, i) => i)))
    setAdjustedItems([...pack.items])
    setBulkAdjustment(0)
    setStep('items')
  }

  // Toggle item selecionado
  function toggleItem(index: number) {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  // Selecionar todos
  function selectAll() {
    if (!selectedPack) return
    setSelectedItems(new Set(selectedPack.items.map((_, i) => i)))
  }

  // Desmarcar todos
  function deselectAll() {
    setSelectedItems(new Set())
  }

  // Aplicar ajuste em massa
  function applyBulkAdjustment() {
    if (!selectedPack) return
    
    const factor = 1 + (bulkAdjustment / 100)
    const updated = selectedPack.items.map(item => ({
      ...item,
      price: Number((item.price * factor).toFixed(2)),
      cost: item.cost ? Number((item.cost * factor).toFixed(2)) : undefined
    }))
    setAdjustedItems(updated)
  }

  // Importar produtos selecionados
  async function handleImport() {
    if (!selectedPack || selectedItems.size === 0) return
    
    setImporting(true)
    setStep('importing')
    setImportProgress(0)

    try {
      // Buscar ou criar categoria
      let categoryId: string | null = null
      
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('store_id', storeId)
        .ilike('name', selectedPack.category_suggestion)
        .single()
      
      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        // Criar categoria
        const { data: newCategory, error: catError } = await supabase
          .from('categories')
          .insert({
            store_id: storeId,
            name: selectedPack.category_suggestion,
            is_active: true,
            sort_order: 0
          })
          .select('id')
          .single()
        
        if (catError) {
          console.error('Erro ao criar categoria:', catError)
        } else {
          categoryId = newCategory?.id || null
        }
      }

      // Preparar produtos para inserção
      const productsToInsert = Array.from(selectedItems).map((index, i) => {
        const item = adjustedItems[index]
        setImportProgress(Math.round((i / selectedItems.size) * 50))
        
        return {
          store_id: storeId,
          category_id: categoryId,
          name: item.name,
          description: item.description || null,
          price: item.price,
          cost: item.cost || null,
          image_url: item.image_url || null,
          unit: item.unit || 'un',
          barcode: item.barcode || null,
          brand: item.brand || null,
          is_active: true,
          in_stock: true,
          sort_order: i
        }
      })

      // Inserir em lotes de 20
      const batchSize = 20
      let insertedCount = 0
      
      for (let i = 0; i < productsToInsert.length; i += batchSize) {
        const batch = productsToInsert.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('products')
          .insert(batch)
        
        if (error) {
          console.error('Erro ao inserir lote:', error)
          throw error
        }
        
        insertedCount += batch.length
        setImportProgress(50 + Math.round((insertedCount / productsToInsert.length) * 50))
      }

      toast.success(`${insertedCount} produtos importados com sucesso!`)
      onImportComplete?.(insertedCount)
      
      // Reset e fechar
      setTimeout(() => {
        setIsOpen(false)
        setStep('packs')
        setSelectedPack(null)
        setSelectedItems(new Set())
        setImporting(false)
      }, 1500)

    } catch (error) {
      console.error('Erro na importação:', error)
      toast.error('Erro ao importar produtos')
      setImporting(false)
      setStep('items')
    }
  }

  // Voltar para lista de packs
  function handleBack() {
    setStep('packs')
    setSelectedPack(null)
    setSelectedItems(new Set())
    setBulkAdjustment(0)
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Importar Kits
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              {step === 'packs' && 'Importador de Kits (Modo Preguiçoso)'}
              {step === 'items' && selectedPack?.name}
              {step === 'importing' && 'Importando...'}
            </DialogTitle>
            <DialogDescription>
              {step === 'packs' && `${stats.totalPacks} kits disponíveis com ${stats.totalItems} produtos prontos para importar`}
              {step === 'items' && 'Selecione os itens e ajuste os preços conforme necessário'}
              {step === 'importing' && 'Aguarde enquanto os produtos são cadastrados'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* STEP 1: Lista de Packs */}
            {step === 'packs' && (
              <div className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Buscar kits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Grid de Packs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPacks.map((pack) => {
                    const Icon = iconMap[pack.icon] || Package
                    return (
                      <Card 
                        key={pack.id}
                        className="cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
                        onClick={() => handleSelectPack(pack)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Icon className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {pack.name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {pack.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {pack.items.length} itens
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {pack.category_suggestion}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filteredPacks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum kit encontrado</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Seleção de Itens */}
            {step === 'items' && selectedPack && (
              <div className="space-y-4">
                {/* Ajuste em Massa */}
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          Ajuste em Massa:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          value={bulkAdjustment}
                          onChange={(e) => setBulkAdjustment(Number(e.target.value))}
                          className="w-24 text-center"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">%</span>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={applyBulkAdjustment}
                        >
                          Aplicar
                        </Button>
                      </div>
                      <div className="text-xs text-amber-700">
                        Ex: +20% para aumentar, -10% para reduzir
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Controles de seleção */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={selectAll}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Todos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={deselectAll}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Nenhum
                    </Button>
                  </div>
                  <Badge variant="secondary">
                    {selectedItems.size} de {selectedPack.items.length} selecionados
                  </Badge>
                </div>

                {/* Lista de Itens */}
                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {adjustedItems.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors ${
                        selectedItems.has(index) ? 'bg-amber-50' : ''
                      }`}
                    >
                      <Checkbox 
                        checked={selectedItems.has(index)}
                        onCheckedChange={() => toggleItem(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {item.name}
                          </span>
                          {item.brand && (
                            <Badge variant="outline" className="text-xs">
                              {item.brand}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-600">
                          {formatCurrency(item.price)}
                        </div>
                        {item.cost && (
                          <div className="text-xs text-gray-400">
                            Custo: {formatCurrency(item.cost)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Importando */}
            {step === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
                <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-gray-600">
                  Importando {selectedItems.size} produtos...
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {importProgress}% concluído
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'importing' && (
            <DialogFooter className="flex justify-between border-t pt-4">
              {step === 'items' ? (
                <>
                  <Button variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={selectedItems.size === 0}
                    className="bg-amber-500 hover:bg-amber-600 gap-2"
                  >
                    <Import className="w-4 h-4" />
                    Importar {selectedItems.size} produtos
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
