'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  MapPin, Clock, Phone, Truck, CheckCircle, Package, 
  ChefHat, User, ArrowLeft, Loader2, Navigation, Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Delivery {
  id: string
  status: string
  driver_name: string | null
  driver_phone: string | null
  address: string
  estimated_time: number
  delivery_fee: number
  created_at: string
  updated_at: string
  order?: {
    order_code: string
    customer_name: string
    total_amount: number
    status: string
    notes: string | null
  }
}

export default function RastreioPage() {
  const params = useParams()
  const slug = params.slug as string
  const id = params.id as string
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar loja
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, name')
          .eq('slug', slug)
          .single()
        
        if (storeData) {
          setStoreName(storeData.name)
          
          // Buscar entrega
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('deliveries')
            .select(`
              *,
              order:orders(order_code, customer_name, total_amount, status, notes)
            `)
            .eq('id', id)
            .single()

          if (deliveryError || !deliveryData) {
            // Tentar buscar por order_id
            const { data: deliveryByOrder } = await supabase
              .from('deliveries')
              .select(`
                *,
                order:orders(order_code, customer_name, total_amount, status, notes)
              `)
              .eq('order_id', id)
              .single()

            if (deliveryByOrder) {
              setDelivery(deliveryByOrder)
            } else {
              setError('Entrega não encontrada')
            }
          } else {
            setDelivery(deliveryData)
          }
        }
      } catch (err) {
        console.error('Erro:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    if (slug && id) fetchData()

    // Realtime updates
    const channel = supabase
      .channel('tracking-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `id=eq.${id}` },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [slug, id, supabase])

  const getStatusStep = (status: string) => {
    const steps: Record<string, number> = {
      pending: 1,
      assigned: 2,
      picked_up: 3,
      in_transit: 4,
      delivered: 5
    }
    return steps[status] || 1
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      assigned: 'Motorista a caminho',
      picked_up: 'Pedido coletado',
      in_transit: 'Em trânsito',
      delivered: 'Entregue'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando rastreio...</p>
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <MapPin className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Entrega não encontrada</h1>
          <p className="text-slate-500 mb-6">Verifique o código e tente novamente</p>
          <Link href={`/${slug}`}>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              Voltar ao cardápio
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStep = getStatusStep(delivery.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/${slug}/minha-conta`} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <span className="text-sm opacity-90">{storeName}</span>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">Rastreio da Entrega</h1>
            <p className="text-purple-100">Pedido #{delivery.order?.order_code}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Status atual */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              delivery.status === 'delivered' 
                ? 'bg-emerald-100' 
                : 'bg-purple-100 animate-pulse'
            }`}>
              {delivery.status === 'delivered' ? (
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              ) : (
                <Truck className="w-10 h-10 text-purple-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {getStatusLabel(delivery.status)}
            </h2>
            {delivery.status !== 'delivered' && (
              <p className="text-sm text-slate-500 mt-1">
                Tempo estimado: ~{delivery.estimated_time} min
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="relative">
            {[
              { step: 1, icon: Package, label: 'Pedido recebido' },
              { step: 2, icon: User, label: 'Motorista designado' },
              { step: 3, icon: ChefHat, label: 'Pedido coletado' },
              { step: 4, icon: Truck, label: 'Em trânsito' },
              { step: 5, icon: CheckCircle, label: 'Entregue' }
            ].map(({ step, icon: Icon, label }, index) => (
              <div key={step} className="flex items-center gap-4 mb-4 last:mb-0">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                  step <= currentStep 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${
                    step <= currentStep ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {label}
                  </span>
                  {step === currentStep && step < 5 && (
                    <span className="ml-2 text-xs text-purple-600 animate-pulse">● Agora</span>
                  )}
                </div>
                {index < 4 && (
                  <div className={`absolute left-[19px] top-10 w-0.5 h-8 ${
                    step < currentStep ? 'bg-purple-600' : 'bg-slate-200'
                  }`} style={{ marginTop: `${index * 48}px` }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Motorista */}
        {delivery.driver_name && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Seu Entregador
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800">{delivery.driver_name}</div>
                {delivery.driver_phone && (
                  <a 
                    href={`tel:${delivery.driver_phone}`}
                    className="text-sm text-purple-600 flex items-center gap-1 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {delivery.driver_phone}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-amber-500" />
                <span className="font-bold">4.8</span>
              </div>
            </div>
          </div>
        )}

        {/* Endereço de Entrega */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Endereço de Entrega
          </h3>
          <p className="text-slate-600">{delivery.address}</p>
          {delivery.order?.notes && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Obs:</strong> {delivery.order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Resumo
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency((delivery.order?.total_amount || 0) - delivery.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(delivery.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(delivery.order?.total_amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Botão de contato */}
        <a 
          href={`https://wa.me/55${delivery.driver_phone?.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold rounded-2xl transition-colors shadow-lg"
        >
          💬 Falar com o Entregador
        </a>
      </div>
    </div>
  )
}
