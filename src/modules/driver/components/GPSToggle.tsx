'use client'

import { useState, useEffect } from 'react'
import { Navigation, MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useDriverLocation } from '../hooks/useDriverLocation'

interface GPSToggleProps {
  deliveryId: string
  onStatusChange?: (isTracking: boolean) => void
}

/**
 * Toggle para ativar/desativar compartilhamento de GPS
 */
export function GPSToggle({ deliveryId, onStatusChange }: GPSToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const { location, error, isTracking, startTracking, stopTracking } = useDriverLocation({
    deliveryId,
    enabled
  })

  useEffect(() => {
    onStatusChange?.(isTracking)
  }, [isTracking, onStatusChange])

  const handleToggle = () => {
    if (enabled) {
      stopTracking()
      setEnabled(false)
    } else {
      setEnabled(true)
      startTracking()
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isTracking ? 'bg-green-100' : 'bg-slate-100'
          }`}>
            {isTracking ? (
              <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
            ) : (
              <MapPin className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-800">
              {isTracking ? 'GPS Ativo' : 'Compartilhar GPS'}
            </p>
            {isTracking && location && (
              <p className="text-xs text-green-600">
                Precisão: {Math.round(location.accuracy)}m
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            isTracking ? 'bg-green-500' : 'bg-slate-300'
          }`}
        >
          <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
            isTracking ? 'translate-x-7' : 'translate-x-1'
          }`}>
            {enabled && !isTracking && (
              <Loader2 className="w-4 h-4 m-1 text-slate-400 animate-spin" />
            )}
          </span>
        </button>
      </div>

      {isTracking && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Cliente pode ver sua localização em tempo real
          </div>
        </div>
      )}
    </div>
  )
}
