'use client'

import { useState, useEffect } from 'react'
import { 
  Wand2, Pizza, Trash2, Store, Package, ArrowLeft, 
  Loader2, Check, AlertTriangle, RefreshCw 
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface StoreOption {
  id: string
  name: string
  slug: string
}

// ============================================
// DADOS DE SEED
// ============================================

const SEED_CATEGORIES = [
  { name: '🍔 Lanches', color: 'red', sort_order: 0 },
  { name: '🥤 Bebidas', color: 'blue', sort_order: 1 },
  { name: '🍰 Sobremesas', color: 'pink', sort_order: 2 },
  { name: '🍱 Combos', color: 'amber', sort_order: 3 },
  { name: '🏷️ Promoções', color: 'green', sort_order: 4 }
]

const SEED_PRODUCTS: Record<string, { name: string; description: string; price: number; image: string }[]> = {
  '🍔 Lanches': [
    { name: 'X-Tudo Monstro', description: 'Hambúrguer artesanal 200g, queijo cheddar, bacon crocante, ovo, presunto, salada completa e molho especial', price: 38.90, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { name: 'X-Bacon Supremo', description: 'Hambúrguer 180g com camadas de bacon defumado e queijo derretido', price: 32.90, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80' },
    { name: 'X-Salada Fitness', description: 'Hambúrguer grelhado com salada fresca, tomate e molho de iogurte', price: 28.90, image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80' },
    { name: 'Smash Burger Duplo', description: 'Dois hambúrgueres smash com queijo americano e cebola caramelizada', price: 34.90, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chicken Crispy', description: 'Frango empanado crocante com maionese temperada e alface', price: 26.90, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hot Dog Especial', description: 'Salsicha premium com purê, batata palha, milho e ervilha', price: 18.90, image: 'https://images.unsplash.com/photo-1612392062126-2f0e559ceb58?auto=format&fit=crop&w=800&q=80' },
    { name: 'Wrap Mexicano', description: 'Tortilha com carne moída, queijo, pico de gallo e guacamole', price: 24.90, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80' },
    { name: 'X-Costela BBQ', description: 'Hambúrguer de costela desfiada com molho barbecue e onion rings', price: 42.90, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Veggie Burger', description: 'Hambúrguer de grão de bico com cogumelos e molho tahine', price: 29.90, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80' },
    { name: 'X-Picanha Premium', description: 'Hambúrguer de picanha com queijo brie e cebola roxa grelhada', price: 45.90, image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&w=800&q=80' }
  ],
  '🥤 Bebidas': [
    { name: 'Suco Detox Verde', description: 'Couve, limão, gengibre e maçã verde', price: 12.90, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80' },
    { name: 'Limonada Suíça', description: 'Limão siciliano batido com leite condensado', price: 10.90, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80' },
    { name: 'Milk Shake Ovomaltine', description: 'Sorvete de creme com Ovomaltine crocante', price: 16.90, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
    { name: 'Coca-Cola 600ml', description: 'Refrigerante gelado', price: 8.00, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80' },
    { name: 'Guaraná Antarctica 600ml', description: 'O sabor brasileiro', price: 7.50, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=80' },
    { name: 'Água Mineral 500ml', description: 'Com ou sem gás', price: 4.00, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Suco de Laranja Natural', description: 'Feito na hora com laranjas selecionadas', price: 9.90, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chá Gelado de Pêssego', description: 'Refrescante e levemente adoçado', price: 7.90, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80' },
    { name: 'Café Gelado Premium', description: 'Espresso com gelo e leite', price: 11.90, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cerveja Artesanal IPA', description: 'Long neck 355ml', price: 14.90, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80' }
  ],
  '🍰 Sobremesas': [
    { name: 'Açaí Vulcão 500ml', description: 'Açaí cremoso com banana, granola, leite em pó e nutella', price: 24.90, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80' },
    { name: 'Petit Gateau', description: 'Bolo de chocolate com centro derretido e sorvete de creme', price: 22.90, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Brownie com Sorvete', description: 'Brownie quentinho com sorvete de baunilha e calda de chocolate', price: 19.90, image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cheesecake de Frutas Vermelhas', description: 'Cheesecake cremoso com calda de frutas vermelhas', price: 18.90, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pudim de Leite', description: 'Receita tradicional da vovó com calda de caramelo', price: 12.90, image: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mousse de Maracujá', description: 'Mousse aerado com calda de maracujá', price: 14.90, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80' },
    { name: 'Torta de Limão', description: 'Massa crocante com creme de limão e merengue maçaricado', price: 16.90, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80' },
    { name: 'Banana Split', description: 'Banana com 3 bolas de sorvete, chantilly e coberturas', price: 21.90, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Churros com Doce de Leite', description: '4 unidades crocantes recheadas', price: 15.90, image: 'https://images.unsplash.com/photo-1624371414361-e670edf4892c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Sorvete Artesanal 2 Bolas', description: 'Escolha seus sabores favoritos', price: 13.90, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80' }
  ],
  '🍱 Combos': [
    { name: 'Combo Família', description: '4 X-Burgers + Batata Grande + 4 Refrigerantes', price: 89.90, image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Casal', description: '2 X-Tudo + Batata Média + 2 Refrigerantes', price: 59.90, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Kids', description: 'Mini Burger + Batata Kids + Suco + Brinquedo', price: 29.90, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Fitness', description: 'Salada Caesar + Wrap Grelhado + Suco Detox', price: 42.90, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Executivo', description: 'X-Bacon + Batata + Refrigerante + Sobremesa', price: 49.90, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Amigos (4 pessoas)', description: '4 Lanches variados + 2 Batatas + 1 Balde Refrigerante', price: 99.90, image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Madrugada', description: '2 Hot Dogs + 2 Refrigerantes (após 22h)', price: 34.90, image: 'https://images.unsplash.com/photo-1612392062126-2f0e559ceb58?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Açaí Duplo', description: '2 Açaís 300ml + 4 Adicionais', price: 39.90, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Sobremesas', description: '2 Sobremesas à escolha + 2 Cafés', price: 44.90, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80' },
    { name: 'Combo Cerveja', description: '4 Cervejas Long Neck + Porção de Fritas', price: 54.90, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80' }
  ],
  '🏷️ Promoções': [
    { name: '[PROMO] X-Burger Simples', description: 'Hambúrguer 120g com queijo e salada - Só hoje!', price: 14.90, image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] 2 por 1 Hot Dog', description: 'Leve 2, pague 1! Válido até às 18h', price: 15.90, image: 'https://images.unsplash.com/photo-1612392062126-2f0e559ceb58?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Batata Gigante', description: 'Porção família com preço especial', price: 19.90, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Refrigerante R$ 1', description: 'Na compra de qualquer lanche', price: 1.00, image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Sobremesa Grátis', description: 'Acima de R$ 50, ganhe um brownie', price: 0.00, image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Terça do Açaí', description: 'Açaí 500ml pela metade do preço', price: 12.45, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Happy Hour', description: 'Cerveja + Porção por preço fixo (17h-20h)', price: 29.90, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Combo Aniversariante', description: 'Combo especial para quem faz aniversário hoje', price: 0.01, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Frete Grátis', description: 'Pedidos acima de R$ 40 (cupom FRETEZERO)', price: 0.00, image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80' },
    { name: '[PROMO] Desconto PIX 10%', description: 'Pague com PIX e ganhe 10% off automático', price: 0.00, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80' }
  ]
}

export default function BuilderPage() {
  const [stores, setStores] = useState<StoreOption[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  // Estados das ações
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)
  const [creatingPizza, setCreatingPizza] = useState(false)
  const [pizzaSuccess, setPizzaSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    loadStores()
  }, [])

  async function loadStores() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, slug')
      .order('name')

    if (!error && data) {
      setStores(data)
      if (data.length > 0) {
        setSelectedStoreId(data[0].id)
      }
    }
    setLoading(false)
  }

  // ============================================
  // 🪄 GERADOR DE CARDÁPIO (50 PRODUTOS)
  // ============================================
  async function handleSeedStore() {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja')
      return
    }

    setSeeding(true)
    setSeedSuccess(false)

    try {
      const supabase = createClient()
      const categoryIds: Record<string, string> = {}

      // 1. Criar categorias
      for (const cat of SEED_CATEGORIES) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            store_id: selectedStoreId,
            name: cat.name,
            color: cat.color,
            sort_order: cat.sort_order,
            is_active: true
          })
          .select('id')
          .single()

        if (error) {
          console.error('Erro ao criar categoria:', error)
          throw error
        }

        categoryIds[cat.name] = data.id
      }

      // 2. Criar produtos
      let productCount = 0
      for (const [categoryName, products] of Object.entries(SEED_PRODUCTS)) {
        const categoryId = categoryIds[categoryName]
        if (!categoryId) continue

        for (let i = 0; i < products.length; i++) {
          const product = products[i]
          const { error } = await supabase
            .from('products')
            .insert({
              store_id: selectedStoreId,
              category_id: categoryId,
              name: product.name,
              description: product.description,
              base_price: product.price,
              image_url: product.image,
              is_active: true,
              sort_order: i
            })

          if (error) {
            console.error('Erro ao criar produto:', error)
          } else {
            productCount++
          }
        }
      }

      setSeedSuccess(true)
      toast.success(`🎉 ${productCount} produtos criados em 5 categorias!`)

    } catch (error: any) {
      console.error('Erro no seed:', error)
      toast.error(error.message || 'Erro ao popular loja')
    } finally {
      setSeeding(false)
    }
  }

  // ============================================
  // 🍕 SIMULADOR DE PIZZA MEIO A MEIO
  // ============================================
  async function handleCreatePizzaOrder() {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja')
      return
    }

    setCreatingPizza(true)
    setPizzaSuccess(false)

    try {
      const supabase = createClient()

      // 1. Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: selectedStoreId,
          customer_name: 'Cliente Teste Pizza',
          customer_phone: '31999999999',
          status: 'pending',
          order_type: 'delivery',
          subtotal: 65.90,
          delivery_fee: 8.00,
          total: 73.90,
          notes: 'TESTE: Pedido de pizza meio a meio gerado automaticamente'
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      // 2. Criar item do pedido (a pizza)
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: null, // Pizza customizada não tem product_id fixo
          product_name: 'Pizza Grande (2 Sabores)',
          quantity: 1,
          unit_price: 65.90,
          total_price: 65.90,
          notes: '1/2 Calabresa + 1/2 Frango com Catupiry'
        })
        .select('id')
        .single()

      if (itemError) throw itemError

      // 3. Criar sabores (se tabela existir)
      try {
        await supabase
          .from('order_item_flavors')
          .insert([
            {
              order_item_id: orderItem.id,
              flavor_name: 'Calabresa',
              fraction: 0.5,
              price: 55.90
            },
            {
              order_item_id: orderItem.id,
              flavor_name: 'Frango com Catupiry',
              fraction: 0.5,
              price: 59.90
            }
          ])
      } catch (e) {
        console.warn('Tabela order_item_flavors não existe, pulando...')
      }

      setPizzaSuccess(true)
      toast.success('🍕 Pedido de pizza meio a meio criado!')

    } catch (error: any) {
      console.error('Erro ao criar pedido:', error)
      toast.error(error.message || 'Erro ao criar pedido de pizza')
    } finally {
      setCreatingPizza(false)
    }
  }

  // ============================================
  // 🧹 LIMPADOR (RESET STORE)
  // ============================================
  async function handleDeleteStoreData() {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja')
      return
    }

    if (deleteConfirm !== 'DELETAR') {
      toast.error('Digite DELETAR para confirmar')
      return
    }

    setDeleting(true)

    try {
      const supabase = createClient()

      // 1. Deletar order_items (via orders)
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', selectedStoreId)

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o: any) => o.id)
        await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds)
      }

      // 2. Deletar orders
      await supabase
        .from('orders')
        .delete()
        .eq('store_id', selectedStoreId)

      // 3. Deletar products
      await supabase
        .from('products')
        .delete()
        .eq('store_id', selectedStoreId)

      // 4. Deletar categories
      await supabase
        .from('categories')
        .delete()
        .eq('store_id', selectedStoreId)

      // 5. Deletar customers (se existir)
      try {
        await supabase
          .from('customers')
          .delete()
          .eq('store_id', selectedStoreId)
      } catch (e) {
        console.warn('Tabela customers não existe ou erro ao deletar')
      }

      setDeleteConfirm('')
      toast.success('🧹 Todos os dados da loja foram apagados!')

    } catch (error: any) {
      console.error('Erro ao deletar:', error)
      toast.error(error.message || 'Erro ao limpar loja')
    } finally {
      setDeleting(false)
    }
  }

  const selectedStore = stores.find(s => s.id === selectedStoreId)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/diagnostics"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Diagnósticos
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Wand2 className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">🏗️ Builder Tools</h1>
          </div>
          <p className="text-slate-600">
            Ferramentas para acelerar o desenvolvimento e testes.
          </p>
        </div>

        {/* Seletor de Loja */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Store className="w-4 h-4 inline mr-2" />
            Selecionar Loja
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.slug})
              </option>
            ))}
          </select>
          {selectedStore && (
            <p className="mt-2 text-sm text-slate-500">
              URL: <code className="bg-slate-100 px-2 py-1 rounded">/{selectedStore.slug}</code>
            </p>
          )}
        </div>

        {/* Grid de Ferramentas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 🪄 Gerador de Cardápio */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-violet-200">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">🪄 Gerador de Cardápio</h2>
            <p className="text-slate-600 text-sm mb-4">
              Popula a loja com 50 produtos em 5 categorias para testar o layout iFood.
            </p>
            <ul className="text-xs text-slate-500 mb-4 space-y-1">
              <li>• 🍔 Lanches (10 produtos)</li>
              <li>• 🥤 Bebidas (10 produtos)</li>
              <li>• 🍰 Sobremesas (10 produtos)</li>
              <li>• 🍱 Combos (10 produtos)</li>
              <li>• 🏷️ Promoções (10 produtos)</li>
            </ul>
            <button
              onClick={handleSeedStore}
              disabled={seeding || !selectedStoreId}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                seedSuccess
                  ? 'bg-emerald-100 text-emerald-700'
                  : seeding
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
            >
              {seedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Pronto!
                </>
              ) : seeding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando 50 produtos...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Popular Loja (50 Produtos)
                </>
              )}
            </button>
          </div>

          {/* 🍕 Simulador de Pizza */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-amber-200">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Pizza className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">🍕 Simulador de Pizza</h2>
            <p className="text-slate-600 text-sm mb-4">
              Gera um pedido de pizza meio a meio para testar KDS e impressão de frações.
            </p>
            <ul className="text-xs text-slate-500 mb-4 space-y-1">
              <li>• Cria pedido com status "pending"</li>
              <li>• Item: Pizza Grande (2 Sabores)</li>
              <li>• 1/2 Calabresa + 1/2 Frango</li>
              <li>• Registra em order_item_flavors</li>
            </ul>
            <button
              onClick={handleCreatePizzaOrder}
              disabled={creatingPizza || !selectedStoreId}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                pizzaSuccess
                  ? 'bg-emerald-100 text-emerald-700'
                  : creatingPizza
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {pizzaSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Pedido Criado!
                </>
              ) : creatingPizza ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando pedido...
                </>
              ) : (
                <>
                  <Pizza className="w-5 h-5" />
                  Gerar Pedido Meio a Meio
                </>
              )}
            </button>
          </div>

          {/* 🧹 Limpador */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">🧹 Limpador (Reset)</h2>
            <p className="text-slate-600 text-sm mb-4">
              Apaga TODOS os dados da loja (produtos, categorias, pedidos). Mantém configurações.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-red-600 mb-1">
                Digite "DELETAR" para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                placeholder="DELETAR"
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-center font-mono focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              onClick={handleDeleteStoreData}
              disabled={deleting || !selectedStoreId || deleteConfirm !== 'DELETAR'}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                deleting
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : deleteConfirm === 'DELETAR'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Apagando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  APAGAR TUDO DA LOJA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Aviso */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Atenção:</strong> Estas são ferramentas de desenvolvimento. 
              Use apenas em ambientes de teste ou desenvolvimento.
              As ações são irreversíveis.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Builder Tools v1.0 | Ferramentas de Produtividade
        </div>
      </div>
    </div>
  )
}
