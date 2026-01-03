import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderTracking } from './OrderTracking'

interface OrderPageProps {
  params: { slug: string; code: string }
  searchParams: { t?: string }
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const supabase = await createClient()

  const token = searchParams.t

  if (!token) {
    // Token é obrigatório para rastreamento público
    notFound()
  }

  try {
    // Usar RPC security definer para buscar pedido com token
    const { data, error } = await supabase.rpc('get_public_order', {
      p_slug: params.slug,
      p_code: params.code,
      p_token: token
    })

    if (error) {
      console.error('Error fetching public order:', error)
      notFound()
    }

    if (!data) {
      notFound()
    }

    // data já vem sanitizado pela RPC (sem PII completo)
    return <OrderTracking order={data} />
  } catch (err) {
    console.error('Error in order page:', err)
    notFound()
  }
}
