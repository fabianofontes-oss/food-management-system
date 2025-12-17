'use client'

import { Clock, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StoreStatusBannerProps {
  isOpen: boolean
  nextOpenFormatted: string | null
  schedulingEnabled: boolean
  storeSlug: string
  primaryColor?: string
}

export function StoreStatusBanner({
  isOpen,
  nextOpenFormatted,
  schedulingEnabled,
  storeSlug,
  primaryColor = '#ea1d2c',
}: StoreStatusBannerProps) {
  // Se a loja está aberta, não mostrar banner
  if (isOpen) {
    return null
  }

  return (
    <div className="bg-orange-50 border-b border-orange-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-orange-800">
                Estamos fechados no momento
              </p>
              {nextOpenFormatted && (
                <p className="text-sm text-orange-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Abrimos {nextOpenFormatted}
                </p>
              )}
            </div>
          </div>

          {schedulingEnabled && (
            <Link
              href={`/${storeSlug}/checkout`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-4 h-4" />
              Agendar pedido
            </Link>
          )}
        </div>

        {schedulingEnabled && (
          <p className="mt-2 text-xs text-orange-600 pl-12">
            Aceitamos pedidos agendados para quando estivermos abertos
          </p>
        )}
      </div>
    </div>
  )
}
