'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Loader2, CheckCircle, MessageSquare, ArrowLeft, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AvaliarEntregaPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const deliveryId = params.deliveryId as string
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [delivery, setDelivery] = useState<any>(null)
  const [storeName, setStoreName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
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
          const { data: deliveryData } = await supabase
            .from('deliveries')
            .select(`
              *,
              order:orders(order_code, customer_name)
            `)
            .eq('id', deliveryId)
            .single()

          if (deliveryData) {
            setDelivery(deliveryData)

            // Verificar se já foi avaliado (usa coluna rated_at da tabela deliveries)
            if (deliveryData.rated_at) {
              setSubmitted(true)
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

    if (slug && deliveryId) fetchData()
  }, [slug, deliveryId, supabase])

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma avaliação')
      return
    }

    setSubmitting(true)
    try {
      // Salvar avaliação diretamente na tabela deliveries
      const { error: updateError } = await supabase
        .from('deliveries')
        .update({
          driver_rating: rating,
          rating_comment: comment || null,
          rated_at: new Date().toISOString()
        })
        .eq('id', delivery.id)

      if (updateError) throw updateError

      // Atualizar média do motorista na tabela drivers
      if (delivery.driver_name && delivery.store_id) {
        const { data: allRatings } = await supabase
          .from('deliveries')
          .select('driver_rating')
          .eq('store_id', delivery.store_id)
          .eq('driver_name', delivery.driver_name)
          .not('driver_rating', 'is', null)

        if (allRatings && allRatings.length > 0) {
          const avgRating = allRatings.reduce((sum: number, d: { driver_rating: number | null }) => 
            sum + (d.driver_rating || 0), 0) / allRatings.length

          await supabase
            .from('drivers')
            .update({ 
              rating: Math.round(avgRating * 10) / 10,
              updated_at: new Date().toISOString()
            })
            .eq('store_id', delivery.store_id)
            .eq('name', delivery.driver_name)
        }
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingText = (value: number) => {
    const texts: Record<number, string> = {
      1: 'Muito ruim 😞',
      2: 'Ruim 😕',
      3: 'Regular 😐',
      4: 'Bom 🙂',
      5: 'Excelente! 🤩'
    }
    return texts[value] || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link href={`/${slug}`}>
            <Button>Voltar ao cardápio</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Obrigado!</h1>
          <p className="text-slate-500 mb-6">
            Sua avaliação foi enviada com sucesso. Isso ajuda a melhorar nosso serviço!
          </p>
          <Link href={`/${slug}`}>
            <Button className="bg-green-600 hover:bg-green-700">
              Voltar ao cardápio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
        <div className="max-w-md mx-auto">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
            {storeName}
          </Link>
          <h1 className="text-2xl font-bold">Avaliar Entrega</h1>
          <p className="text-orange-100 mt-1">Pedido #{delivery?.order?.order_code}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          {/* Motorista */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Truck className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <div className="font-bold text-slate-800">{delivery?.driver_name || 'Entregador'}</div>
              <div className="text-sm text-slate-500">Realizou sua entrega</div>
            </div>
          </div>

          {/* Estrelas */}
          <div className="text-center py-4">
            <p className="text-slate-600 mb-4">Como foi sua experiência?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      value <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="mt-3 text-lg font-medium text-slate-700">
                {getRatingText(hoverRating || rating)}
              </p>
            )}
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Deixe um comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-orange-500 outline-none resize-none"
            />
          </div>

          {/* Botão enviar */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full py-4 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
