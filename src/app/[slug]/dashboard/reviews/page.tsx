'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, TrendingUp,
  Loader2, AlertCircle, Filter, Search, Calendar,
  User, Clock, Reply, Flag
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Review {
  id: string
  customer_id: string | null
  customer_name: string
  order_id: string | null
  rating: number
  comment: string | null
  reply: string | null
  replied_at: string | null
  is_featured: boolean
  created_at: string
}

interface ReviewStats {
  total: number
  average: number
  distribution: { stars: number; count: number; percentage: number }[]
  responded: number
  pending: number
}

type FilterType = 'all' | 'pending' | 'responded' | 'featured'

export default function ReviewsPage() {
  const params = useParams()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    average: 0,
    distribution: [],
    responded: 0,
    pending: 0
  })
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    async function loadStore() {
      try {
        const { data, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .single()

        if (storeError || !data) {
          setError('Loja não encontrada')
          setLoading(false)
          return
        }
        setStoreId(data.id)
      } catch (err) {
        console.error('Erro ao carregar loja:', err)
        setError('Erro ao carregar loja')
        setLoading(false)
      }
    }
    loadStore()
  }, [slug, supabase])

  useEffect(() => {
    if (storeId) loadReviews()
  }, [storeId])

  async function loadReviews() {
    try {
      setLoading(true)
      
      // Simular dados de avaliações (tabela reviews não existe no schema atual)
      // Em produção, criar tabela reviews e buscar dados reais
      const mockReviews: Review[] = [
        {
          id: '1',
          customer_id: null,
          customer_name: 'João Silva',
          order_id: null,
          rating: 5,
          comment: 'Excelente açaí! Muito cremoso e bem servido. Entrega rápida.',
          reply: 'Obrigado João! Ficamos felizes que tenha gostado!',
          replied_at: new Date().toISOString(),
          is_featured: true,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          customer_id: null,
          customer_name: 'Maria Santos',
          order_id: null,
          rating: 4,
          comment: 'Bom produto, mas a entrega demorou um pouco.',
          reply: null,
          replied_at: null,
          is_featured: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          customer_id: null,
          customer_name: 'Pedro Oliveira',
          order_id: null,
          rating: 5,
          comment: 'Melhor açaí da região! Sempre peço aqui.',
          reply: null,
          replied_at: null,
          is_featured: false,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setReviews(mockReviews)
      
      // Calcular estatísticas
      const total = mockReviews.length
      const average = total > 0 
        ? mockReviews.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0
      
      const distribution = [5, 4, 3, 2, 1].map(stars => {
        const count = mockReviews.filter(r => r.rating === stars).length
        return { stars, count, percentage: total > 0 ? (count / total) * 100 : 0 }
      })
      
      const responded = mockReviews.filter(r => r.reply).length
      const pending = total - responded

      setStats({ total, average, distribution, responded, pending })
    } catch (err) {
      console.error('Erro ao carregar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    
    // Em produção, salvar no banco
    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, reply: replyText, replied_at: new Date().toISOString() }
        : r
    ))
    
    setReplyingTo(null)
    setReplyText('')
    
    // Atualizar stats
    setStats(prev => ({
      ...prev,
      responded: prev.responded + 1,
      pending: prev.pending - 1
    }))
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? !review.reply :
      filter === 'responded' ? !!review.reply :
      filter === 'featured' ? review.is_featured : true
    return matchesSearch && matchesFilter
  })

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    )
  }

  if (loading && !storeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando avaliações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-yellow-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg shadow-yellow-500/25">
              <Star className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Avaliações
          </h1>
          <p className="text-slate-500 mt-2 ml-14">Feedback dos seus clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <span className="text-2xl font-bold text-white">{stats.average.toFixed(1)}</span>
            </div>
            <div>
              {renderStars(Math.round(stats.average), 'md')}
              <p className="text-sm text-slate-500 mt-1">{stats.total} avaliações</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 col-span-2 hover:shadow-xl transition-all duration-300">
          <p className="text-sm font-medium text-slate-500 mb-3">Distribuição</p>
          <div className="space-y-2">
            {stats.distribution.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="text-sm w-12 text-slate-600">{d.stars} <Star className="w-3 h-3 inline fill-yellow-400 text-yellow-400" /></span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-8">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Respondidas</span>
              <span className="text-xl font-bold text-emerald-600">{stats.responded}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Pendentes</span>
              <span className="text-xl font-bold text-amber-600">{stats.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar avaliação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'responded', 'featured'] as FilterType[]).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25' : 'hover:shadow-md transition-all'}
            >
              {f === 'all' ? 'Todas' : 
               f === 'pending' ? 'Pendentes' : 
               f === 'responded' ? 'Respondidas' : 'Destaque'}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Star className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">Nenhuma avaliação encontrada</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{review.customer_name}</p>
                      {review.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Destaque
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, 'sm')}
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!review.reply && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Responder
                  </Button>
                )}
              </div>

              {review.comment && (
                <p className="mt-4 text-gray-700">{review.comment}</p>
              )}

              {review.reply && (
                <div className="mt-4 pl-4 border-l-2 border-purple-200 bg-purple-50 p-4 rounded-r-lg">
                  <p className="text-sm font-medium text-purple-700">Resposta da loja</p>
                  <p className="text-sm text-gray-700 mt-1">{review.reply}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {review.replied_at && new Date(review.replied_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {replyingTo === review.id && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleReply(review.id)}
                    >
                      Enviar Resposta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
