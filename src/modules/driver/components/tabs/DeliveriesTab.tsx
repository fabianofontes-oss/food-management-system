'use client'

import { useState } from 'react'
import { Truck, MapPin, Package, DollarSign, Play, CheckCheck, Navigation, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Delivery } from '../../types'
import { STATUS_LABELS, STATUS_COLORS } from '../../types'
import { getGoogleMapsLink } from '../../repository'
import { DeliveryProofCapture } from '../DeliveryProofCapture'

interface DeliveriesTabProps {
  deliveries: Delivery[]
  commissionPercent: number
  storeId: string
  onUpdateStatus: (deliveryId: string, newStatus: string) => Promise<void>
}

export function DeliveriesTab({ deliveries, commissionPercent, storeId, onUpdateStatus }: DeliveriesTabProps) {
  const [showProofCapture, setShowProofCapture] = useState<string | null>(null)

  const handleDeliverWithPhoto = (deliveryId: string) => {
    setShowProofCapture(deliveryId)
  }

  const handleProofComplete = async (deliveryId: string) => {
    await onUpdateStatus(deliveryId, 'delivered')
    setShowProofCapture(null)
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-md">
        <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Nenhuma entrega pendente</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deliveries.map(delivery => (
        <div key={delivery.id} className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-bold text-slate-800 text-lg">#{delivery.order?.order_code}</div>
              <div className="text-sm text-slate-500">{delivery.order?.customer_name}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[delivery.status]}`}>
              {STATUS_LABELS[delivery.status]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 mb-3">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm">{delivery.address}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-emerald-600">
                +{formatCurrency((delivery.delivery_fee || 0) * commissionPercent / 100)}
              </span>
            </div>
            <div className="flex gap-2">
              {delivery.status === 'assigned' && (
                <Button
                  onClick={() => onUpdateStatus(delivery.id, 'picked_up')}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Package className="w-4 h-4 mr-1" />
                  Coletei
                </Button>
              )}
              {delivery.status === 'picked_up' && (
                <Button
                  onClick={() => onUpdateStatus(delivery.id, 'in_transit')}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Saí
                </Button>
              )}
              {delivery.status === 'in_transit' && (
                <>
                  <Button
                    onClick={() => handleDeliverWithPhoto(delivery.id)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Entregar
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(delivery.id, 'delivered')}
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-300"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                </>
              )}
              <a
                href={getGoogleMapsLink(delivery.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline">
                  <Navigation className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de Captura de Foto */}
      {showProofCapture && (
        <DeliveryProofCapture
          deliveryId={showProofCapture}
          storeId={storeId}
          onComplete={() => handleProofComplete(showProofCapture)}
          onCancel={() => setShowProofCapture(null)}
        />
      )}
    </div>
  )
}
