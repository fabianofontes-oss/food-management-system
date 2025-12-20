'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Share2, Copy, Users, DollarSign, Check, Clock, X, ChevronRight, Gift } from 'lucide-react'
import { DriverCard, DriverCardContent } from '@/modules/driver/components/ui/DriverCard'
import { DriverButton } from '@/modules/driver/components/ui/DriverButton'
import { DriverStatusBadge } from '@/modules/driver/components/ui/DriverStatusBadge'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface ReferralData {
  code: string
  totalReferrals: number
  totalEarnings: number
  referrals: Array<{
    id: string
    name: string
    status: 'aprovado' | 'em_analise' | 'pendente' | 'incompleto'
    date: string
    earnings?: number
  }>
}

export default function IndicacoesPage() {
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.slug as string

  const [driver, setDriver] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Simulated referral data
  const [referralData] = useState<ReferralData>({
    code: 'MOTO9921',
    totalReferrals: 12,
    totalEarnings: 15000, // in cents
    referrals: [
      { id: '1', name: 'João Silva', status: 'aprovado', date: '12 Out', earnings: 5000 },
      { id: '2', name: 'Burger King - Centro', status: 'em_analise', date: '14 Out' },
      { id: '3', name: 'Marcos Oliveira', status: 'pendente', date: '15 Out' },
      { id: '4', name: 'Roberto Junior', status: 'incompleto', date: '01 Out' },
    ]
  })

  useEffect(() => {
    const driverData = localStorage.getItem(`driver_${storeSlug}`)
    if (!driverData) {
      router.push(`/${storeSlug}/motorista`)
      return
    }
    const parsed = JSON.parse(driverData)
    setDriver(parsed.driver)
    setLoading(false)
  }, [storeSlug, router])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.code)
    setCopied(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Venha fazer entregas!',
      text: `Use meu código ${referralData.code} e ganhe R$ 50,00 de bônus na primeira entrega!`,
      url: `https://pediu.food/r/${referralData.code}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      handleCopyCode()
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'aprovado':
        return { icon: Check, color: 'text-green-400', bg: 'bg-green-500/20' }
      case 'em_analise':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
      case 'pendente':
        return { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20' }
      case 'incompleto':
        return { icon: X, color: 'text-red-400', bg: 'bg-red-500/20' }
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <Gift className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-driver-background/95 backdrop-blur-md border-b border-driver-surface">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-white text-xl font-bold">Indicações</h1>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        {/* Hero Section */}
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-2">Indique e Ganhe!</h2>
          <p className="text-driver-text-secondary">
            Compartilhe seu código com lojistas e ganhe{' '}
            <span className="text-driver-primary font-bold">R$ 50,00</span> por cada indicado aprovado na plataforma.
          </p>
        </div>

        {/* Code Card */}
        <DriverCard variant="gradient">
          <DriverCardContent className="p-5">
            <p className="text-driver-text-secondary text-sm mb-2">Seu código de indicação</p>
            <div className="flex items-center justify-between bg-driver-background/50 rounded-xl p-4 mb-4">
              <span className="text-2xl font-mono font-bold text-white tracking-wider">
                {referralData.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-driver-surface-lighter hover:bg-driver-primary transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <DriverButton variant="primary" size="lg" className="w-full" onClick={handleShare}>
              <Share2 className="w-5 h-5" /> Compartilhar Convite
            </DriverButton>
          </DriverCardContent>
        </DriverCard>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <DriverCard>
            <DriverCardContent className="p-4 text-center">
              <div className="size-12 mx-auto mb-2 rounded-full bg-driver-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-driver-primary" />
              </div>
              <p className="text-3xl font-bold text-white">{referralData.totalReferrals}</p>
              <p className="text-driver-text-secondary text-xs uppercase tracking-wide">INDICADOS</p>
            </DriverCardContent>
          </DriverCard>
          <DriverCard>
            <DriverCardContent className="p-4 text-center">
              <div className="size-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(referralData.totalEarnings)}</p>
              <p className="text-driver-text-secondary text-xs uppercase tracking-wide">GANHOS</p>
            </DriverCardContent>
          </DriverCard>
        </div>

        {/* Referrals List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Meus Indicados</h3>
            <button className="text-driver-primary text-sm font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {referralData.referrals.map((referral) => {
              const statusConfig = getStatusConfig(referral.status)
              const StatusIcon = statusConfig.icon

              return (
                <DriverCard key={referral.id}>
                  <DriverCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full ${statusConfig.bg} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{referral.name}</p>
                          <p className="text-driver-text-secondary text-xs">
                            Cadastrado em {referral.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <DriverStatusBadge status={referral.status} />
                        {referral.earnings && (
                          <p className="text-green-400 text-sm font-bold mt-1">
                            +{formatCurrency(referral.earnings)}
                          </p>
                        )}
                      </div>
                    </div>
                  </DriverCardContent>
                </DriverCard>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
