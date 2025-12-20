'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Truck, ChevronDown, Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { DriverDashboardShell, getDriverStores, getDriverByPhone, getReferralData } from '@/modules/driver'
import type { ReferralData, StoreInfo, DriverProfile } from '@/modules/driver'

export default function DriverDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null)
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [showStoreSelector, setShowStoreSelector] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Motorista')

      // Buscar stores onde é DRIVER
      const driverStores = await getDriverStores(user.id)
      setStores(driverStores)

      // Se tem apenas uma store, seleciona automaticamente
      if (driverStores.length === 1) {
        await selectStore(driverStores[0], user.id)
      } else if (driverStores.length > 1) {
        setShowStoreSelector(true)
      }

      // Buscar dados de afiliado
      const refData = await getReferralData(user.id)
      setReferralData(refData)

    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setLoading(false)
    }
  }

  async function selectStore(store: StoreInfo, uid?: string) {
    setSelectedStore(store)
    setShowStoreSelector(false)
    
    // Buscar perfil do driver nesta loja (pelo email/nome do user)
    // Por enquanto usamos o nome do user como driverName
    // Em produção, buscaríamos pelo user_id na tabela drivers
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Sem stores vinculadas
  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma loja vinculada</h2>
            <p className="text-slate-500 mb-6">
              Você ainda não está cadastrado como motorista em nenhuma loja.
            </p>
            <Button onClick={() => router.push('/')}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Seletor de store (múltiplas lojas)
  if (showStoreSelector || !selectedStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Selecione a Loja</h1>
            <p className="text-slate-500 mt-2">Escolha qual loja deseja gerenciar entregas</p>
          </div>

          <div className="space-y-3">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => selectStore(store, userId || undefined)}
                className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="font-bold text-slate-800">{store.name}</div>
                  <div className="text-sm text-slate-500">{store.slug}.pediu.food</div>
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard principal usando o Shell unificado
  return (
    <div>
      {/* Header com seletor de loja */}
      {stores.length > 1 && (
        <div className="bg-indigo-700 text-white px-4 py-2">
          <button
            onClick={() => setShowStoreSelector(true)}
            className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100"
          >
            <Store className="w-4 h-4" />
            {selectedStore.name}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <DriverDashboardShell
        driverName={userName}
        storeId={selectedStore.id}
        storeName={selectedStore.name}
        storeSlug={selectedStore.slug}
        commissionPercent={driverProfile?.commission_percent || 10}
        referralData={referralData}
        showBackLink={false}
      />
    </div>
  )
}
