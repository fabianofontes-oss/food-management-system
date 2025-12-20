'use client'

import { useState } from 'react'
import { Navigation, MapPin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationChooserProps {
  address: string
  originLat?: number
  originLng?: number
  destLat?: number
  destLng?: number
  className?: string
}

type NavigationApp = 'google' | 'waze' | 'apple'

/**
 * Gera links de navegação para diferentes apps
 */
export function getNavigationLinks(
  address: string,
  origin?: { lat: number; lng: number },
  destination?: { lat: number; lng: number }
) {
  const encodedAddress = encodeURIComponent(address)
  
  // Se temos coordenadas do destino, usamos elas
  const destParam = destination 
    ? `${destination.lat},${destination.lng}`
    : encodedAddress

  const originParam = origin 
    ? `${origin.lat},${origin.lng}`
    : ''

  return {
    google: origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`,
    
    waze: `https://waze.com/ul?ll=${destination?.lat || ''},${destination?.lng || ''}&navigate=yes&q=${encodedAddress}`,
    
    apple: `maps://maps.apple.com/?daddr=${destParam}&dirflg=d`,
    
    // Link simples para abrir no maps (fallback)
    simple: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  }
}

/**
 * Componente para escolher app de navegação
 */
export function NavigationChooser({ 
  address, 
  originLat, 
  originLng,
  destLat,
  destLng,
  className = ''
}: NavigationChooserProps) {
  const [showOptions, setShowOptions] = useState(false)

  const origin = originLat && originLng ? { lat: originLat, lng: originLng } : undefined
  const destination = destLat && destLng ? { lat: destLat, lng: destLng } : undefined
  
  const links = getNavigationLinks(address, origin, destination)

  const openNavigation = (app: NavigationApp) => {
    const url = links[app]
    window.open(url, '_blank')
    setShowOptions(false)
  }

  if (!showOptions) {
    return (
      <Button
        onClick={() => setShowOptions(true)}
        size="sm"
        variant="outline"
        className={className}
      >
        <Navigation className="w-4 h-4 mr-1" />
        Navegar
      </Button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-slate-800">Escolha o app</span>
        <button 
          onClick={() => setShowOptions(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <button
        onClick={() => openNavigation('google')}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-slate-800">Google Maps</p>
          <p className="text-xs text-slate-500">Navegação com trânsito</p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </button>

      <button
        onClick={() => openNavigation('waze')}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors"
      >
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <path fill="#00CFF8" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <circle fill="#FFF" cx="8.5" cy="10" r="1.5"/>
            <circle fill="#FFF" cx="15.5" cy="10" r="1.5"/>
            <path fill="#FFF" d="M12 17c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-slate-800">Waze</p>
          <p className="text-xs text-slate-500">Alertas de trânsito ao vivo</p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </button>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          {address.length > 40 ? address.slice(0, 40) + '...' : address}
        </p>
      </div>
    </div>
  )
}

/**
 * Botão simples de navegação com dropdown
 */
export function NavigationButton({ 
  address,
  originLat,
  originLng,
  className = ''
}: { 
  address: string
  originLat?: number
  originLng?: number
  className?: string
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  const origin = originLat && originLng ? { lat: originLat, lng: originLng } : undefined
  const links = getNavigationLinks(address, origin)

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        size="sm"
        variant="outline"
        className={className}
      >
        <Navigation className="w-4 h-4" />
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[160px]">
            <a
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
              onClick={() => setShowMenu(false)}
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              Google Maps
            </a>
            <a
              href={links.waze}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
              onClick={() => setShowMenu(false)}
            >
              <Navigation className="w-4 h-4 text-cyan-500" />
              Waze
            </a>
          </div>
        </>
      )}
    </div>
  )
}
