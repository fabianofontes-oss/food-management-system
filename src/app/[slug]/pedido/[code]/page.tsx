import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderStatusClient } from './OrderStatusClient'

type PageProps = {
  params: {
    slug: string
    code: string
  }
}

type OrderItemModifier = {
  id: string
  name_snapshot: string
  extra_price: string | number
}

type OrderItem = {
  id: string
  title_snapshot: string
  unit_price: string | number
  quantity: number
  unit_type: 'unit' | 'weight'
  weight: string | number | null
  subtotal: string | number
  modifiers?: OrderItemModifier[]
}

type Order = {
  id: string
  code: string
  status: string
  total_amount: string | number
  channel: string
  payment_method: string
  created_at: string
  items?: OrderItem[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return Number(value ?? 0)
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toUpperCase()
  if (s.includes('CANCEL')) return 'destructive'
  if (s.includes('DELIVER')) return 'default'
  if (s.includes('READY') || s.includes('COMPLET')) return 'default'
  if (s.includes('PENDING')) return 'secondary'
  return 'outline'
}

export default async function PedidoConfirmadoPage({ params }: PageProps) {
  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id,slug,name')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) notFound()

  const storeId = (store as { id: string }).id

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
        id,
        code,
        status,
        channel,
        payment_method,
        total_amount,
        created_at,
        items:order_items(
          id,
          title_snapshot,
          unit_price,
          quantity,
          unit_type,
          weight,
          subtotal,
          modifiers:order_item_modifiers(
            id,
            name_snapshot,
            extra_price
          )
        )
      `
    )
    .eq('store_id', storeId)
    .eq('code', params.code)
    .single()

  if (orderError || !order) notFound()

  const typedOrder = order as unknown as Order
  const total = toNumber(typedOrder.total_amount)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Pedido confirmado</div>
            <div className="text-xl font-semibold tracking-tight">#{typedOrder.code}</div>
          </div>

          <Badge variant={statusVariant(typedOrder.status)}>{typedOrder.status}</Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Status e link</span>
              <span className="text-base font-semibold">{formatCurrency(total)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusClient
              slug={params.slug}
              code={typedOrder.code}
              storeId={storeId}
              initialStatus={typedOrder.status}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(typedOrder.items || []).map((item) => {
                const itemSubtotal = toNumber(item.subtotal)
                return (
                  <div key={item.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium leading-tight">{item.title_snapshot}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.unit_type === 'weight'
                            ? `Peso: ${toNumber(item.weight).toFixed(3)}`
                            : `Qtd: ${item.quantity}`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(itemSubtotal)}
                      </div>
                    </div>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Adicionais</div>
                        <div className="space-y-1">
                          {item.modifiers.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">+ {m.name_snapshot}</span>
                              <span className="text-muted-foreground">{formatCurrency(toNumber(m.extra_price))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link href={`/${params.slug}`}>Voltar ao cardápio</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
