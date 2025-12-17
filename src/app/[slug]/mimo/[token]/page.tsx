'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Heart, Clock, ShoppingBag, CreditCard, 
  CheckCircle, XCircle, Loader2, Gift,
  AlertTriangle, Copy, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface MimoData {
  valid: boolean
  error?: string
  order_id?: string
  total?: number
  target_name?: string
  message?: string
  expires_at?: string
  store?: {
    name: string
    logo_url?: string
    slug: string
  }
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function MimoPaymentPage() {
  const params = useParams()
  const slug = params.slug as string
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [mimoData, setMimoData] = useState<MimoData | null>(null)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [pixCode, setPixCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadMimoData()
  }, [token])

  useEffect(() => {
    if (!mimoData?.expires_at) return
    
    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(mimoData.expires_at!)
      const diff = expires.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [mimoData?.expires_at])

  async function loadMimoData() {
    try {
      // Buscar loja pelo slug
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, logo_url, slug')
        .eq('slug', slug)
        .single()
      
      if (!store) {
        setMimoData({ valid: false, error: 'Loja não encontrada' })
        return
      }

      // Buscar pedido pelo token
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          mimo_token,
          mimo_expires_at,
          mimo_target_name,
          mimo_message,
          order_items (
            quantity,
            unit_price,
            product:products (name)
          )
        `)
        .eq('store_id', store.id)
        .eq('mimo_token', token)
        .single()

      if (!order) {
        setMimoData({ valid: false, error: 'Link inválido ou não encontrado' })
        return
      }

      // Validar status
      if (order.status === 'mimo_expired') {
        setMimoData({ valid: false, error: 'Este link expirou. Peça para enviar um novo!' })
        return
      }

      if (order.status !== 'awaiting_mimo') {
        setPaid(true)
        setMimoData({ 
          valid: false, 
          error: 'Este mimo já foi pago! ❤️',
          target_name: order.mimo_target_name
        })
        return
      }

      // Validar expiração
      if (new Date(order.mimo_expires_at) < new Date()) {
        setMimoData({ valid: false, error: 'Este link expirou. Peça para enviar um novo!' })
        return
      }

      setMimoData({
        valid: true,
        order_id: order.id,
        total: order.total,
        target_name: order.mimo_target_name,
        message: order.mimo_message,
        expires_at: order.mimo_expires_at,
        store: {
          name: store.name,
          logo_url: store.logo_url,
          slug: store.slug
        },
        items: order.order_items?.map((item: any) => ({
          name: item.product?.name || 'Produto',
          quantity: item.quantity,
          price: item.unit_price
        }))
      })
    } catch (error) {
      console.error('Erro ao carregar MIMO:', error)
      setMimoData({ valid: false, error: 'Erro ao carregar dados do pedido' })
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment() {
    if (!mimoData?.order_id) return
    
    setPaying(true)
    
    try {
      // Simular geração de PIX (integrar com gateway real)
      const pixCodeGenerated = `00020126580014BR.GOV.BCB.PIX0136${mimoData.order_id}5204000053039865406${mimoData.total?.toFixed(2)}5802BR5913PEDIU APP6008BRASILIA62070503***6304`
      setPixCode(pixCodeGenerated)
      
      // Em produção, aqui seria a integração com Mercado Pago, PagSeguro, etc.
      // Após confirmação do pagamento, atualizar o pedido:
      // await supabase.from('orders').update({ 
      //   status: 'pending',
      //   mimo_paid_at: new Date().toISOString(),
      //   mimo_payer_name: 'Nome do pagador'
      // }).eq('id', mimoData.order_id)
      
    } catch (error) {
      console.error('Erro no pagamento:', error)
    } finally {
      setPaying(false)
    }
  }

  async function simulatePayment() {
    if (!mimoData?.order_id) return
    
    setPaying(true)
    
    try {
      // Simular pagamento (em produção, isso viria do webhook do gateway)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'pending',
          payment_status: 'paid',
          mimo_paid_at: new Date().toISOString(),
          mimo_payer_name: 'Pagador'
        })
        .eq('id', mimoData.order_id)
      
      if (!error) {
        setPaid(true)
      }
    } catch (error) {
      console.error('Erro ao confirmar:', error)
    } finally {
      setPaying(false)
    }
  }

  function copyPixCode() {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Tela de erro
  if (!mimoData?.valid && !paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h1>
            <p className="text-gray-600 mb-6">{mimoData?.error}</p>
            <Button 
              onClick={() => window.location.href = `/${slug}`}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Ir para a loja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de sucesso (já pago)
  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mimo Pago! ❤️</h1>
            <p className="text-gray-600 mb-2">
              Você acabou de fazer alguém muito feliz!
            </p>
            {mimoData?.target_name && (
              <p className="text-lg font-medium text-green-600 mb-6">
                {mimoData.target_name} vai adorar! 🎉
              </p>
            )}
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-700">
                O pedido já está sendo preparado!
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = `/${slug}`}
              variant="outline"
            >
              Conhecer a loja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela principal de pagamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header com coração */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg animate-pulse">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Paga pra mim? 🥺
          </h1>
          {mimoData?.store && (
            <p className="text-gray-600 mt-1">
              Pedido em <strong>{mimoData.store.name}</strong>
            </p>
          )}
        </div>

        {/* Mensagem do solicitante */}
        {mimoData?.message && (
          <Card className="border-pink-200 bg-pink-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-pink-700 mb-1">
                    Mensagem de {mimoData.target_name || 'alguém especial'}:
                  </p>
                  <p className="text-gray-700 italic">&ldquo;{mimoData.message}&rdquo;</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Tempo restante</span>
              </div>
              <span className="font-mono font-bold text-amber-600">
                {timeLeft}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Itens do pedido */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-gray-700">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold">Itens do pedido</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {mimoData?.items?.map((item, index) => (
                <div key={index} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2 text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-600">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-pink-600">
                {formatCurrency(mimoData?.total || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PIX Code (se gerado) */}
        {pixCode && (
          <Card className="border-violet-200">
            <CardContent className="pt-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">PIX Copia e Cola</p>
                <div className="bg-gray-100 rounded-lg p-3 break-all text-xs font-mono text-gray-700">
                  {pixCode.substring(0, 50)}...
                </div>
              </div>
              <Button 
                onClick={copyPixCode}
                variant="outline"
                className="w-full mb-3"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>
              <Button 
                onClick={simulatePayment}
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Já paguei!
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Botão de pagamento */}
        {!pixCode && (
          <Button 
            onClick={handlePayment}
            disabled={paying}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg"
          >
            {paying ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            Pagar agora
          </Button>
        )}

        {/* Aviso de segurança */}
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/50 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Pagamento 100% seguro. Após a confirmação, o pedido será preparado imediatamente.
          </p>
        </div>
      </div>
    </div>
  )
}
