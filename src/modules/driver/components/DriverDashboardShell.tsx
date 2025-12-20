'use client'

import { useState, useCallback } from 'react'
import { Truck, Package, History, DollarSign, Link2, Zap, Volume2, VolumeX, ArrowLeft, Star, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useDriverDeliveries } from '../hooks/useDriverDeliveries'
import { useDriverStats } from '../hooks/useDriverStats'
import { useDriverRealtime } from '../hooks/useDriverRealtime'
import { DeliveriesTab } from './tabs/DeliveriesTab'
import { HistoryTab } from './tabs/HistoryTab'
import { EarningsTab } from './tabs/EarningsTab'
import { AffiliatesTab } from './tabs/AffiliatesTab'
import type { DriverTab, ReferralData } from '../types'

interface DriverDashboardShellProps {
  driverName: string
  storeId: string
  storeName?: string
  storeSlug?: string
  commissionPercent: number
  referralData: ReferralData | null
  showBackLink?: boolean
  backLinkHref?: string
  onCreateAffiliate?: () => void
}

export function DriverDashboardShell({
  driverName,
  storeId,
  storeName,
  storeSlug,
  commissionPercent,
  referralData,
  showBackLink = false,
  backLinkHref,
  onCreateAffiliate
}: DriverDashboardShellProps) {
  const [activeTab, setActiveTab] = useState<DriverTab>('entregas')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const { 
    deliveries, 
    pendingDeliveries, 
    loading, 
    refresh, 
    updateStatus 
  } = useDriverDeliveries(storeId, driverName)

  const { stats } = useDriverStats(deliveries, commissionPercent)
  
  const handleNewDelivery = useCallback(() => {
    refresh()
  }, [refresh])

  const { isConnected } = useDriverRealtime(storeId, handleNewDelivery, soundEnabled)

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://pediu.food'

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      await updateStatus(deliveryId, newStatus)
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {showBackLink && backLinkHref ? (
              <a href={backLinkHref} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </a>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              {/* Indicador Realtime */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
              }`}>
                <Zap className="w-3 h-3" />
                {isConnected ? 'Ao vivo' : 'Offline'}
              </div>
              {/* Toggle Som */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{driverName}</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {stats.rating.toFixed(1)} • {stats.totalDeliveries} entregas
                {storeName && <span className="opacity-75">• {storeName}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="max-w-2xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="text-sm text-slate-500 mb-1">Hoje</div>
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.todayEarnings)}</div>
            <div className="text-xs text-slate-400">{stats.todayDeliveries} entregas</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="text-sm text-slate-500 mb-1">Esta Semana</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.weekEarnings)}</div>
            <div className="text-xs text-slate-400">{stats.weekDeliveries} entregas</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('entregas')}
            className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-[80px] ${
              activeTab === 'entregas' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Entregas</span>
            <span className="sm:hidden">{pendingDeliveries.length}</span>
            <span className="hidden sm:inline">({pendingDeliveries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-[80px] ${
              activeTab === 'historico' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </button>
          <button
            onClick={() => setActiveTab('ganhos')}
            className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-[80px] ${
              activeTab === 'ganhos' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Ganhos</span>
          </button>
          <button
            onClick={() => setActiveTab('afiliados')}
            className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-[80px] ${
              activeTab === 'afiliados' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Afiliados</span>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-md">
            <Truck className="w-12 h-12 text-indigo-500 animate-pulse mx-auto mb-4" />
            <p className="text-slate-500">Carregando entregas...</p>
          </div>
        ) : (
          <>
            {activeTab === 'entregas' && (
              <DeliveriesTab
                deliveries={pendingDeliveries}
                commissionPercent={commissionPercent}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
            {activeTab === 'historico' && (
              <HistoryTab
                deliveries={deliveries}
                commissionPercent={commissionPercent}
              />
            )}
            {activeTab === 'ganhos' && (
              <EarningsTab
                stats={stats}
                commissionPercent={commissionPercent}
              />
            )}
            {activeTab === 'afiliados' && (
              <AffiliatesTab
                referralData={referralData}
                baseUrl={baseUrl}
                onCreateAffiliate={onCreateAffiliate}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
