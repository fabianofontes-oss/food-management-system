'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Loader2, Package, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ConfirmarEntregaPage() {
  const params = useParams()
  const slug = params.slug as string
  const deliveryId = params.deliveryId as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [delivery, setDelivery] = useState<{
    id: string
    status: string
    order?: { order_code: string; customer_name: string }
  } | null>(null)
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    fetchDelivery()
  }, [deliveryId])

  async function fetchDelivery() {
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
        const { data } = await supabase
          .from('deliveries')
          .select(`
            id, status,
            order:orders(order_code, customer_name)
          `)
          .eq('id', deliveryId)
          .single()

        if (data) {
          setDelivery(data as typeof delivery)
          
          // Já foi confirmada pelo cliente?
          if (data.status === 'delivered') {
            setConfirmed(true)
          }
        } else {
          setError('Entrega não encontrada')
        }
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      // Atualizar status para entregue e marcar confirmação do cliente
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          customer_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (updateError) throw updateError

      setConfirmed(true)
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao confirmar. Tente novamente.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Ops!</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link href={`/${slug}`}>
            <Button>Voltar ao cardápio</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Entrega Confirmada!</h1>
          <p className="text-slate-500 mb-2">
            Pedido #{delivery?.order?.order_code} recebido com sucesso.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Obrigado por confirmar o recebimento!
          </p>
          
          <div className="space-y-3">
            <Link href={`/${slug}/avaliar/${deliveryId}`}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Avaliar entrega
              </Button>
            </Link>
            <Link href={`/${slug}`}>
              <Button variant="outline" className="w-full">
                Voltar ao cardápio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
          <Package className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirmar Recebimento</h1>
        <p className="text-slate-500 mb-2">
          Pedido #{delivery?.order?.order_code}
        </p>
        <p className="text-sm text-slate-400 mb-6">
          {storeName}
        </p>

        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <p className="text-indigo-700 font-medium">
            Você recebeu este pedido?
          </p>
          <p className="text-sm text-indigo-500 mt-1">
            Clique no botão abaixo para confirmar
          </p>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full py-4 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          {confirming ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Sim, recebi meu pedido!
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
