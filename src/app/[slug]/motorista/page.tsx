'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Truck, Phone, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DriverDashboardShell } from '@/modules/driver'

interface StoreData {
  id: string
  name: string
  slug: string
}

interface DriverData {
  id: string
  name: string
  phone: string
  commission_percent: number
}

export default function MotoristaPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<StoreData | null>(null)
  const [driverPhone, setDriverPhone] = useState('')
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()
      
      if (data) {
        setStore(data)
      }
      setLoading(false)
    }
    if (slug) fetchStore()
  }, [slug, supabase])

  const handleLogin = async () => {
    if (!driverPhone || driverPhone.length < 10) {
      setLoginError('Digite um telefone válido')
      return
    }

    setLoading(true)
    setLoginError('')
    
    try {
      // Buscar motorista cadastrado
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, name, phone, commission_percent')
        .eq('store_id', store?.id)
        .eq('phone', driverPhone)
        .single()

      if (driverData) {
        setDriver(driverData)
        setIsLoggedIn(true)
      } else {
        // Fallback: buscar por entregas com esse telefone
        const { data: deliveriesData } = await supabase
          .from('deliveries')
          .select('driver_name')
          .eq('store_id', store?.id)
          .eq('driver_phone', driverPhone)
          .limit(1)

        if (deliveriesData && deliveriesData.length > 0) {
          setDriver({
            id: '',
            name: deliveriesData[0].driver_name || 'Motorista',
            phone: driverPhone,
            commission_percent: 10
          })
          setIsLoggedIn(true)
        } else {
          setLoginError('Motorista não encontrado. Verifique o telefone.')
        }
      }
    } catch (err) {
      console.error('Erro:', err)
      setLoginError('Erro ao acessar. Tente novamente.')
    } finally {
      setLoading(false)
    }
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

  // Login screen
  if (!isLoggedIn || !driver || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Área do Motorista</h1>
              <p className="text-slate-500 mt-2">{store?.name || 'Carregando...'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seu telefone cadastrado
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="(31) 99914-0095"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg"
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {loginError}
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-4 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {loading ? 'Entrando...' : 'Acessar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard usando o Shell unificado
  return (
    <DriverDashboardShell
      driverName={driver.name}
      storeId={store.id}
      storeName={store.name}
      storeSlug={store.slug}
      commissionPercent={driver.commission_percent}
      referralData={null}
      showBackLink={true}
      backLinkHref={`/${slug}`}
    />
  )
}
