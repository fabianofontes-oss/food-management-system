'use client'

import { MapPin, Phone } from 'lucide-react'
import type { Store, PublicProfile } from '@/types/menu'

interface PublicHeaderProps {
  store: Store
  publicProfile?: PublicProfile | null
}

export function PublicHeader({ store, publicProfile }: PublicHeaderProps) {
  const displayName = publicProfile?.displayName || store.name
  const slogan = publicProfile?.slogan
  const address = publicProfile?.fullAddress || store.address
  const phone = publicProfile?.phone || store.phone

  return (
    <header 
      className="text-white sticky top-0 z-30 shadow-lg"
      style={{ background: `linear-gradient(to right, var(--theme-primary, #10B981), var(--theme-accent, #F59E0B))` }}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold drop-shadow-md">{displayName}</h1>
            {slogan && (
              <p className="text-white/90 mt-1 text-sm font-medium">{slogan}</p>
            )}
          </div>
        </div>
        
        {(address || phone) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {address && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{address}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-white/90">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
