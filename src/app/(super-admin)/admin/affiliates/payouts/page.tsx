'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, DollarSign, Clock, CheckCircle, Loader2, Wallet, Send
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface PartnerPayout {
  partner_id: string
  partner_name: string
  partner_type: string
  user_email: string | null
  pending_amount: number
  available_amount: number
  paid_amount: number
}

export default function AdminAffiliatesPayoutsPage() {
  const [loading, setLoading] = useState(true)
  const [payouts, setPayouts] = useState<PartnerPayout[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    try {
      // Buscar partners
      const { data: partners } = await supabase
        .from('referral_partners')
        .select(`
          id, display_name, partner_type,
          users:user_id (email)
        `)

      // Buscar sales agrupadas por partner
      const { data: sales } = await supabase
        .from('referral_sales')
        .select('partner_id, commission_amount, status')

      // Agrupar por partner
      const payoutMap = new Map<string, PartnerPayout>()

      partners?.forEach((p: any) => {
        payoutMap.set(p.id, {
          partner_id: p.id,
          partner_name: p.display_name,
          partner_type: p.partner_type,
          user_email: p.users?.email || null,
          pending_amount: 0,
          available_amount: 0,
          paid_amount: 0,
        })
      })

      sales?.forEach((s: any) => {
        const payout = payoutMap.get(s.partner_id)
        if (payout) {
          if (s.status === 'PENDING') {
            payout.pending_amount += s.commission_amount
          } else if (s.status === 'AVAILABLE') {
            payout.available_amount += s.commission_amount
          }
        }
      })

      // Filtrar apenas quem tem saldo
      const withBalance = Array.from(payoutMap.values()).filter(
        p => p.pending_amount > 0 || p.available_amount > 0
      )

      setPayouts(withBalance)
    } catch (e) {
      console.error('Erro ao carregar payouts:', e)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    pending: payouts.reduce((sum, p) => sum + p.pending_amount, 0),
    available: payouts.reduce((sum, p) => sum + p.available_amount, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/affiliates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repasses</h1>
          <p className="text-slate-600">Comissões disponíveis para pagamento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendente (D+60)</p>
                <p className="text-3xl font-bold">R$ {(totals.pending / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Disponível para Repasse</p>
                <p className="text-3xl font-bold text-green-600">R$ {(totals.available / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Regra de liberação:</strong> Comissões ficam pendentes por 60 dias (D+60) 
            para garantir que a assinatura do tenant indicado seja válida. Após esse período, 
            o valor fica disponível para repasse.
          </p>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Afiliado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Pendente</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Disponível</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.partner_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {payout.partner_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {payout.partner_type}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {payout.user_email || '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-600">
                      R$ {(payout.pending_amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      R$ {(payout.available_amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {payout.available_amount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum afiliado com saldo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
