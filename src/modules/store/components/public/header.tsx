'use client'

import { MapPin, Phone, Clock, Instagram, Facebook, MessageCircle, Star } from 'lucide-react'
import type { MenuTheme, StoreWithSettings } from '../../types'
import { isLightColor } from '../../utils'

interface StoreHeaderProps {
  store: StoreWithSettings
  theme: MenuTheme
}

export function StoreHeader({ store, theme }: StoreHeaderProps) {
  const headerTextColor = isLightColor(theme.colors.header) ? '#1f2937' : '#ffffff'
  const headerMutedColor = isLightColor(theme.colors.header) ? '#64748b' : 'rgba(255,255,255,0.7)'

  const handleWhatsAppClick = () => {
    if (store.whatsapp) {
      const phone = store.whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/55${phone}`, '_blank')
    }
  }

  const handlePhoneClick = () => {
    if (store.phone) {
      window.open(`tel:${store.phone}`, '_blank')
    }
  }

  return (
    <div>
      {/* Banner */}
      {theme.display.showBanner && (
        <div 
          className="h-40 sm:h-56 bg-gradient-to-r from-slate-300 to-slate-400 relative"
          style={{
            backgroundImage: theme.bannerUrl || store.banner_url 
              ? `url(${theme.bannerUrl || store.banner_url})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!(theme.bannerUrl || store.banner_url) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-6xl font-bold opacity-20"
                style={{ color: theme.colors.primary }}
              >
                {store.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
          />
        </div>
      )}

      {/* Header Info */}
      <header 
        className="relative z-10"
        style={{ backgroundColor: theme.colors.header }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {theme.display.showLogo && (
              <div 
                className={`${theme.display.showBanner ? '-mt-12' : ''} w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0 border-4`}
                style={{ 
                  backgroundColor: theme.colors.primary,
                  backgroundImage: store.logo_url ? `url(${store.logo_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderColor: theme.colors.header
                }}
              >
                {!store.logo_url && store.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Store Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 
                className="font-bold text-xl sm:text-2xl truncate"
                style={{ color: headerTextColor }}
              >
                {store.name}
              </h1>

              {/* Rating placeholder */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: headerTextColor }}
                  >
                    4.8
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: headerMutedColor }}
                  >
                    (200+)
                  </span>
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: theme.colors.primary,
                    color: '#ffffff'
                  }}
                >
                  Aberto
                </span>
              </div>

              {/* Address */}
              {theme.display.showAddress && store.address && (
                <p 
                  className="text-sm mt-2 flex items-start gap-1"
                  style={{ color: headerMutedColor }}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{store.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Contact & Social Icons */}
          {theme.display.showSocial && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {store.whatsapp && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: '#25D366',
                    color: '#ffffff'
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}

              {store.phone && (
                <button
                  onClick={handlePhoneClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: isLightColor(theme.colors.header) 
                      ? 'rgba(0,0,0,0.08)' 
                      : 'rgba(255,255,255,0.15)',
                    color: headerTextColor
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Ligar</span>
                </button>
              )}

              {/* Instagram & Facebook - placeholders, would need store.instagram_url etc */}
              <button
                className="p-2 rounded-full transition-all hover:scale-105"
                style={{ 
                  backgroundColor: isLightColor(theme.colors.header) 
                    ? 'rgba(0,0,0,0.08)' 
                    : 'rgba(255,255,255,0.15)',
                  color: headerTextColor
                }}
              >
                <Instagram className="w-4 h-4" />
              </button>

              <button
                className="p-2 rounded-full transition-all hover:scale-105"
                style={{ 
                  backgroundColor: isLightColor(theme.colors.header) 
                    ? 'rgba(0,0,0,0.08)' 
                    : 'rgba(255,255,255,0.15)',
                  color: headerTextColor
                }}
              >
                <Facebook className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}
