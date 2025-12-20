'use client'

import { useState } from 'react'
import { Link2, Users, Clock, DollarSign, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ReferralData } from '../../types'

interface AffiliatesTabProps {
  referralData: ReferralData | null
  baseUrl: string
  onCreateAffiliate?: () => void
}

export function AffiliatesTab({ referralData, baseUrl, onCreateAffiliate }: AffiliatesTabProps) {
  const [copied, setCopied] = useState(false)

  function copyLink(code: string) {
    const link = `${baseUrl}/r/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!referralData?.partner) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block p-4 bg-violet-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Seja um Afiliado!
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Indique outros motoboys e ganhe 80% de comissão sobre as indicações.
          </p>
          {onCreateAffiliate && (
            <Button onClick={onCreateAffiliate}>
              Criar meu link de afiliado
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const mainCode = referralData.codes?.[0]?.code

  return (
    <div className="space-y-4">
      {/* Meu Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Meu Link de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mainCode ? (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-sm text-slate-500 mb-1">Compartilhe este link:</p>
                  <p className="text-lg font-mono font-semibold text-violet-600 truncate">
                    {baseUrl}/r/{mainCode}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(mainCode)}
                  className="p-3 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors flex-shrink-0 ml-2"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-violet-600" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Nenhum código gerado</p>
          )}
        </CardContent>
      </Card>

      {/* Stats de Afiliado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Indicações</p>
                <p className="text-2xl font-bold">{referralData.referralsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendente</p>
                <p className="text-2xl font-bold">
                  R$ {(referralData.pendingCommission / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(referralData.availableCommission / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-violet-50 border-violet-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-violet-900 mb-2">Como funciona?</h3>
          <ul className="text-sm text-violet-800 space-y-1">
            <li>• Você recebe <strong>80%</strong> da comissão por cada indicação</li>
            <li>• A loja que te cadastrou recebe os outros 20% como crédito</li>
            <li>• Comissões ficam pendentes por 60 dias (D+60)</li>
            <li>• Após 60 dias, o valor fica disponível para saque</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
