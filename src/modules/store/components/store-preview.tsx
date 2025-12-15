'use client'

import { useState } from 'react'
import { Smartphone, Monitor, MapPin, Instagram, Facebook, Search, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuTheme, StoreWithSettings } from '../types'

interface StorePreviewProps {
  theme: MenuTheme
  store: StoreWithSettings | null
}

type DeviceType = 'mobile' | 'desktop'

export function StorePreview({ theme, store }: StorePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('mobile')

  const storeName = store?.name || 'Sua Loja'
  const storeAddress = store?.address || 'Endereço da loja'
  const logoUrl = store?.logo_url

  return (
    <div className="flex flex-col h-full">
      {/* Device Selector */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Preview em Tempo Real</h3>
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={cn(
              'p-2 rounded-md transition-colors',
              device === 'mobile'
                ? 'bg-red-100 text-red-600'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            )}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={cn(
              'p-2 rounded-md transition-colors',
              device === 'desktop'
                ? 'bg-red-100 text-red-600'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            )}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-6 bg-slate-100 flex justify-center items-start">
        {/* Phone Frame */}
        <div 
          className={cn(
            'transition-all duration-300 shadow-2xl',
            device === 'mobile' 
              ? 'w-[375px] border-8 border-gray-800 rounded-[2.5rem]' 
              : 'w-full max-w-[900px] border-4 border-gray-800 rounded-xl'
          )}
        >
          {/* Screen Content */}
          <div 
            className={cn(
              'overflow-hidden',
              device === 'mobile' ? 'rounded-[2rem]' : 'rounded-lg'
            )}
            style={{ backgroundColor: theme.colors.background }}
          >
            {/* Banner */}
            {theme.display.showBanner && (
              <div 
                className="h-32 bg-gradient-to-r from-slate-300 to-slate-400 relative"
                style={{
                  backgroundImage: theme.bannerUrl ? `url(${theme.bannerUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!theme.bannerUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    <span className="text-sm">Banner da Loja</span>
                  </div>
                )}
              </div>
            )}

            {/* Header */}
            <div 
              className="px-4 py-4"
              style={{ backgroundColor: theme.colors.header }}
            >
              <div className="flex items-center gap-3">
                {/* Logo */}
                {theme.display.showLogo && (
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ 
                      backgroundColor: theme.colors.primary,
                      backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
                      backgroundSize: 'cover'
                    }}
                  >
                    {!logoUrl && (storeName.charAt(0).toUpperCase())}
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 
                    className="font-bold text-lg"
                    style={{ color: theme.colors.header === '#ffffff' ? '#1f2937' : '#ffffff' }}
                  >
                    {storeName}
                  </h1>
                  {theme.display.showAddress && (
                    <p 
                      className="text-xs flex items-center gap-1 mt-0.5"
                      style={{ color: theme.colors.header === '#ffffff' ? '#64748b' : 'rgba(255,255,255,0.7)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      {storeAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Search */}
              {theme.display.showSearch && (
                <div 
                  className="mt-3 rounded-lg px-3 py-2.5 flex items-center gap-2"
                  style={{ 
                    backgroundColor: theme.colors.header === '#ffffff' 
                      ? 'rgba(0,0,0,0.05)' 
                      : 'rgba(255,255,255,0.1)' 
                  }}
                >
                  <Search 
                    className="w-4 h-4" 
                    style={{ 
                      color: theme.colors.header === '#ffffff' 
                        ? '#94a3b8' 
                        : 'rgba(255,255,255,0.5)' 
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={{ 
                      color: theme.colors.header === '#ffffff' 
                        ? '#94a3b8' 
                        : 'rgba(255,255,255,0.5)' 
                    }}
                  >
                    Buscar no cardápio...
                  </span>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-slate-100">
              {['Destaques', 'Lanches', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                <button
                  key={cat}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    i === 0 ? 'text-white' : 'bg-slate-100 text-slate-600'
                  )}
                  style={i === 0 ? { backgroundColor: theme.colors.primary } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="p-4">
              <h2 className="font-semibold text-slate-800 mb-3">Destaques</h2>
              
              {theme.layout === 'modern' && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-3 flex gap-3 shadow-sm">
                      <div className="w-24 h-24 rounded-lg bg-slate-200" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">Produto {i}</p>
                        <p className="text-xs text-slate-500 mt-1">Descrição do produto aqui</p>
                        <p 
                          className="font-bold text-sm mt-2"
                          style={{ color: theme.colors.primary }}
                        >
                          R$ 29,90
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {theme.layout === 'classic' && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100">
                      <div className="w-16 h-16 rounded-lg bg-slate-200" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">Produto {i}</p>
                        <p 
                          className="font-bold text-sm"
                          style={{ color: theme.colors.primary }}
                        >
                          R$ 29,90
                        </p>
                      </div>
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {theme.layout === 'grid' && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-2 text-center shadow-sm">
                      <div className="w-full aspect-square rounded-lg bg-slate-200 mb-2" />
                      <p className="font-medium text-slate-800 text-xs truncate">Produto {i}</p>
                      <p 
                        className="font-bold text-sm"
                        style={{ color: theme.colors.primary }}
                      >
                        R$ 29,90
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {theme.layout === 'minimal' && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Produto {i}</p>
                        <p className="text-xs text-slate-500">Descrição do produto</p>
                      </div>
                      <p 
                        className="font-bold text-sm whitespace-nowrap"
                        style={{ color: theme.colors.primary }}
                      >
                        R$ 29,90
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            {theme.display.showSocial && (
              <div className="px-4 py-4 border-t border-slate-100 flex justify-center gap-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Facebook className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Spacer for mobile */}
            {device === 'mobile' && <div className="h-8" />}
          </div>
        </div>
      </div>
    </div>
  )
}
