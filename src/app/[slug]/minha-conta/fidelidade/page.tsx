'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Gift, Star, Trophy, Clock, ArrowLeft, Loader2, Sparkles,
  ShoppingBag, Calendar, TrendingUp
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LoyaltyData {
  stamps_current: number
  stamps_completed: number
  points_balance: number
  total_orders: number
  total_spent: number
  last_order_at?: string
}

interface StoreConfig {
  name: string
  logo_url?: string
  primary_color: string
  loyalty_stamps_to_reward: number
  loyalty_reward_type: string
  loyalty_reward_value: number
}

interface Transaction {
  id: string
  transaction_type: string
  points_amount: number
  stamps_amount: number
  description?: string
  created_at: string
}

export default function FidelidadePage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      // Buscar config da loja
      const { data: store } = await supabase
        .from('stores')
        .select(`
          id, name, logo_url, primary_color,
          loyalty_stamps_to_reward, loyalty_reward_type, loyalty_reward_value
        `)
        .eq('slug', slug)
        .single()

      if (!store) {
        setLoading(false)
        return
      }

      setStoreConfig({
        name: store.name,
        logo_url: store.logo_url,
        primary_color: store.primary_color || '#7C3AED',
        loyalty_stamps_to_reward: store.loyalty_stamps_to_reward || 10,
        loyalty_reward_type: store.loyalty_reward_type || 'credit',
        loyalty_reward_value: store.loyalty_reward_value || 15
      })

      // Buscar usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Buscar customer vinculado
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('store_id', store.id)
          .eq('user_id', user.id)
          .single()

        if (customer) {
          setCustomerId(customer.id)

          // Buscar dados de fidelidade
          const { data: loyalty } = await supabase
            .from('customer_loyalty')
            .select('*')
            .eq('customer_id', customer.id)
            .eq('store_id', store.id)
            .single()

          if (loyalty) {
            setLoyaltyData({
              stamps_current: loyalty.stamps_current || 0,
              stamps_completed: loyalty.stamps_completed || 0,
              points_balance: loyalty.points_balance || 0,
              total_orders: loyalty.total_orders || 0,
              total_spent: loyalty.total_spent || 0,
              last_order_at: loyalty.last_order_at
            })

            // Buscar histórico
            const { data: txns } = await supabase
              .from('loyalty_transactions')
              .select('*')
              .eq('customer_loyalty_id', loyalty.id)
              .order('created_at', { ascending: false })
              .limit(20)

            if (txns) setTransactions(txns)
          }
        }
      }

      setLoading(false)
    }

    loadData()
  }, [slug, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando seu cartão...</p>
        </div>
      </div>
    )
  }

  if (!storeConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600">Loja não encontrada</p>
          <Link href={`/${slug}`} className="text-violet-600 hover:underline mt-2 inline-block">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  const stampsToReward = storeConfig.loyalty_stamps_to_reward
  const currentStamps = loyaltyData?.stamps_current || 0
  const progress = (currentStamps / stampsToReward) * 100
  const stampsRemaining = stampsToReward - currentStamps

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href={`/${slug}/minha-conta`}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-800">Meu Cartão Fidelidade</h1>
            <p className="text-sm text-slate-500">{storeConfig.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Cartão Principal */}
        <div 
          className="relative rounded-3xl p-6 text-white overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${storeConfig.primary_color} 0%, ${storeConfig.primary_color}dd 100%)`
          }}
        >
          {/* Decoração */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            {/* Header do Cartão */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6" />
                <span className="font-semibold">Cartão Fidelidade</span>
              </div>
              {loyaltyData && loyaltyData.stamps_completed > 0 && (
                <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">{loyaltyData.stamps_completed}x resgatado</span>
                </div>
              )}
            </div>

            {/* Grade de Selos */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Array.from({ length: stampsToReward }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    i < currentStamps
                      ? 'bg-white shadow-lg'
                      : 'bg-white/20 border-2 border-dashed border-white/40'
                  }`}
                >
                  {i < currentStamps ? (
                    <Star className="w-6 h-6" style={{ color: storeConfig.primary_color }} fill={storeConfig.primary_color} />
                  ) : (
                    <span className="text-white/50 font-bold">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Barra de Progresso */}
            <div className="mb-4">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              {currentStamps >= stampsToReward ? (
                <div className="bg-white/20 rounded-2xl p-4">
                  <Sparkles className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-bold text-lg">Parabéns! 🎉</p>
                  <p className="text-white/80 text-sm">
                    Você tem {formatCurrency(storeConfig.loyalty_reward_value)} de desconto disponível!
                  </p>
                  <p className="text-xs text-white/60 mt-2">Use no seu próximo pedido</p>
                </div>
              ) : (
                <>
                  <p className="text-white/80 text-sm">
                    Faltam <span className="font-bold text-white">{stampsRemaining} selos</span> para ganhar
                  </p>
                  <p className="font-bold text-xl mt-1">
                    {formatCurrency(storeConfig.loyalty_reward_value)} de desconto
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <ShoppingBag className="w-6 h-6 text-violet-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{loyaltyData?.total_orders || 0}</p>
            <p className="text-xs text-slate-500">Pedidos</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(loyaltyData?.total_spent || 0).replace('R$', '').trim()}
            </p>
            <p className="text-xs text-slate-500">Total Gasto</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-800">{loyaltyData?.stamps_completed || 0}</p>
            <p className="text-xs text-slate-500">Resgates</p>
          </div>
        </div>

        {/* Como Funciona */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600" />
            Como Funciona
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-600 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">Faça pedidos</p>
                <p className="text-sm text-slate-500">Cada pedido = 1 selo no seu cartão</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">Complete {stampsToReward} selos</p>
                <p className="text-sm text-slate-500">Acompanhe seu progresso aqui</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Ganhe {formatCurrency(storeConfig.loyalty_reward_value)}</p>
                <p className="text-sm text-slate-500">Desconto aplicado automaticamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              Histórico
            </h3>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.transaction_type === 'earn' || tx.transaction_type === 'bonus'
                        ? 'bg-emerald-100'
                        : 'bg-violet-100'
                    }`}>
                      {tx.transaction_type === 'earn' || tx.transaction_type === 'bonus' ? (
                        <Star className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Gift className="w-5 h-5 text-violet-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {tx.transaction_type === 'earn' ? 'Pedido' :
                         tx.transaction_type === 'bonus' ? 'Bônus' :
                         tx.transaction_type === 'redeem' ? 'Resgate' : 'Outro'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${
                    tx.points_amount > 0 ? 'text-emerald-600' : 'text-violet-600'
                  }`}>
                    {tx.points_amount > 0 ? '+' : ''}{tx.stamps_amount} selo{Math.abs(tx.stamps_amount) !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/${slug}`}
          className="block w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-center font-semibold rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
        >
          Fazer um Pedido
        </Link>
      </main>
    </div>
  )
}
