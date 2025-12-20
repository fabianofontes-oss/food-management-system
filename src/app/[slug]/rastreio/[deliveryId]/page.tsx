'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  Truck, MapPin, Clock, Phone, Package, CheckCircle, 
  Loader2, User, Navigation, MessageCircle, Copy, Check,
  Store, ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DeliveryData {
  id: string
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  driver_name: string | null
  driver_phone: string | null
  address: string
  estimated_time: number
  delivery_fee: number
  notes: string | null
  created_at: string
  updated_at: string
  driver_latitude?: number | null
  driver_longitude?: number | null
  driver_location_updated_at?: string | null
  order?: {
    order_code: string
    customer_name: string
    customer_phone: string
    total_amount: number
  }
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Pedido Recebido', icon: Package },
  { key: 'assigned', label: 'Motorista Atribuído', icon: User },
  { key: 'picked_up', label: 'Pedido Coletado', icon: Store },
  { key: 'in_transit', label: 'Em Trânsito', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: CheckCircle },
]

export default function RastreioPage() {
  const params = useParams()
  const slug = params.slug as string
  const deliveryId = params.deliveryId as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [storeName, setStoreName] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDelivery()
    const cleanup = setupRealtime()
    return cleanup
  }, [deliveryId])

  async function fetchDelivery() {
    try {
      setLoading(true)
      
      // Buscar loja
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, name, phone, whatsapp')
        .eq('slug', slug)
        .single()

      if (!storeData) {
        setError('Loja não encontrada')
        setLoading(false)
        return
      }

      setStoreName(storeData.name)
      setStorePhone(storeData.whatsapp || storeData.phone || '')

      // Buscar entrega
      const { data, error: deliveryError } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders(order_code, customer_name, customer_phone, total_amount)
        `)
        .eq('id', deliveryId)
        .single()

      if (deliveryError || !data) {
        setError('Entrega não encontrada')
        setLoading(false)
        return
      }

      setDelivery(data)
    } catch (err) {
      console.error('Erro ao carregar rastreio:', err)
      setError('Erro ao carregar informações')
    } finally {
      setLoading(false)
    }
  }

  function setupRealtime() {
    const channel = supabase
      .channel('delivery-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`
        },
        () => {
          fetchDelivery()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  function getStatusIndex(status: string): number {
    const index = STATUS_STEPS.findIndex(s => s.key === status)
    return index >= 0 ? index : 0
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  function getWhatsAppLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`
  }

  function getMapsLink(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando rastreio...</p>
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Entrega não encontrada</h1>
          <p className="text-slate-500 mb-6">{error || 'Verifique o link e tente novamente'}</p>
          <Link href={`/${slug}`}>
            <Button>Voltar ao cardápio</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStep = getStatusIndex(delivery.status)
  const isDelivered = delivery.status === 'delivered'
  const isCancelled = delivery.status === 'cancelled'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/${slug}`} className="text-white/80 hover:text-white text-sm">
              ← {storeName}
            </Link>
            <button onClick={copyLink} className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-1">Rastreio da Entrega</h1>
          <p className="text-white/80">Pedido #{delivery.order?.order_code}</p>
        </div>
      </div>

      {/* Card Principal */}
      <div className="max-w-lg mx-auto px-4 -mt-14">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Timeline */}
          <div className="p-6">
            <h2 className="font-bold text-slate-800 mb-6">Status da Entrega</h2>
            
            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <span className="text-red-600 font-medium">Entrega Cancelada</span>
              </div>
            ) : (
              <div className="space-y-4">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon
                  const isCompleted = index <= currentStep
                  const isCurrent = index === currentStep
                  
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && !isDelivered && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Agora
                          </p>
                        )}
                      </div>
                      {index < STATUS_STEPS.length - 1 && (
                        <div className={`w-px h-8 ${isCompleted ? 'bg-green-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Endereço */}
          <div className="p-6">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Endereço de Entrega
            </h3>
            <p className="text-slate-600 mb-3">{delivery.address}</p>
            <a 
              href={getMapsLink(delivery.address)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Navigation className="w-4 h-4" />
              Ver no mapa
            </a>
          </div>

          {/* Localização em Tempo Real do Motorista */}
          {delivery.driver_latitude && delivery.driver_longitude && delivery.status === 'in_transit' && (
            <>
              <div className="border-t border-slate-100" />
              <div className="p-6">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Localização do Motorista
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Ao vivo
                  </span>
                </h3>
                <div className="bg-slate-100 rounded-xl overflow-hidden h-48">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}&q=${delivery.driver_latitude},${delivery.driver_longitude}&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {delivery.driver_location_updated_at && (
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Atualizado às {formatTime(delivery.driver_location_updated_at)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Motorista */}
          {delivery.driver_name && (
            <>
              <div className="border-t border-slate-100" />
              <div className="p-6">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Motorista
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{delivery.driver_name}</p>
                    {delivery.driver_phone && (
                      <p className="text-sm text-slate-500">{delivery.driver_phone}</p>
                    )}
                  </div>
                  {delivery.driver_phone && (
                    <div className="flex gap-2">
                      <a
                        href={`tel:${delivery.driver_phone}`}
                        className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                      <a
                        href={getWhatsAppLink(delivery.driver_phone, `Olá! Estou acompanhando meu pedido #${delivery.order?.order_code}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Tempo Estimado */}
          {!isDelivered && !isCancelled && delivery.estimated_time > 0 && (
            <>
              <div className="border-t border-slate-100" />
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tempo estimado</p>
                    <p className="text-xl font-bold text-slate-800">{delivery.estimated_time} min</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Resumo do Pedido */}
          <div className="border-t border-slate-100" />
          <div className="p-6 bg-slate-50">
            <h3 className="font-bold text-slate-800 mb-3">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Pedido</span>
                <span className="font-medium">#{delivery.order?.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-medium">{delivery.order?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxa de entrega</span>
                <span className="font-medium">{formatCurrency(delivery.delivery_fee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatCurrency((delivery.order?.total_amount || 0) + delivery.delivery_fee)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 space-y-3 pb-8">
          {storePhone && (
            <a
              href={getWhatsAppLink(storePhone, `Olá! Tenho uma dúvida sobre meu pedido #${delivery.order?.order_code}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com a loja
            </a>
          )}

          {isDelivered && (
            <Link 
              href={`/${slug}/avaliar/${deliveryId}`}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Avaliar entrega
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          <Link 
            href={`/${slug}`}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-medium border border-slate-200 transition-colors"
          >
            Ver cardápio
          </Link>
        </div>
      </div>
    </div>
  )
}
