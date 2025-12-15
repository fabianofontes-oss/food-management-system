'use client'

import { useState } from 'react'
import { Smartphone, Monitor, Tablet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuTheme, StoreWithSettings } from '../../types'

interface LivePreviewProps {
  theme: MenuTheme
  store: StoreWithSettings | null
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'

const deviceWidths: Record<DeviceType, string> = {
  mobile: 'w-[375px]',
  tablet: 'w-[768px]',
  desktop: 'w-full max-w-[1024px]'
}

export function LivePreview({ theme, store }: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('mobile')

  const mockProducts = [
    { id: 1, name: 'X-Burger Especial', price: 32.90, description: 'Hambúrguer 180g, queijo, bacon, salada', image: '/placeholder-burger.jpg' },
    { id: 2, name: 'X-Salada', price: 28.90, description: 'Hambúrguer 150g, queijo, salada completa', image: '/placeholder-burger.jpg' },
    { id: 3, name: 'Batata Frita', price: 18.90, description: 'Porção 300g com cheddar e bacon', image: '/placeholder-fries.jpg' },
    { id: 4, name: 'Refrigerante', price: 8.00, description: 'Lata 350ml', image: '/placeholder-drink.jpg' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Preview ao Vivo</h3>
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
          {[
            { type: 'mobile' as DeviceType, icon: Smartphone },
            { type: 'tablet' as DeviceType, icon: Tablet },
            { type: 'desktop' as DeviceType, icon: Monitor },
          ].map(({ type, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setDevice(type)}
              className={cn(
                'p-2 rounded-md transition-colors',
                device === type
                  ? 'bg-violet-100 text-violet-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-100 flex justify-center">
        <div 
          className={cn(
            'bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300',
            deviceWidths[device],
            device === 'mobile' && 'h-[667px]',
            device === 'tablet' && 'h-[600px]',
            device === 'desktop' && 'min-h-[500px]'
          )}
          style={{ backgroundColor: theme.colors.background }}
        >
          {theme.display.showBanner && (
            <div 
              className="h-32 bg-gradient-to-r from-slate-200 to-slate-300"
              style={{ 
                backgroundImage: theme.bannerUrl ? `url(${theme.bannerUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}

          <div 
            className="px-4 py-4"
            style={{ backgroundColor: theme.colors.header }}
          >
            <div className="flex items-center gap-3">
              {theme.display.showLogo && (
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {store?.name?.charAt(0) || 'L'}
                </div>
              )}
              <div>
                <h1 className="text-white font-bold text-lg">{store?.name || 'Sua Loja'}</h1>
                {theme.display.showAddress && (
                  <p className="text-white/70 text-xs">{store?.address || 'Endereço da loja'}</p>
                )}
              </div>
            </div>

            {theme.display.showSearch && (
              <div className="mt-3">
                <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white/30" />
                  <span className="text-white/50 text-sm">Buscar produtos...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Destaques</h2>
            
            {theme.layout === 'modern' && (
              <div className="space-y-3">
                {mockProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="bg-slate-50 rounded-xl p-3 flex gap-3">
                    <div className="w-20 h-20 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                      <p 
                        className="font-bold text-sm mt-1"
                        style={{ color: theme.colors.primary }}
                      >
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {theme.layout === 'classic' && (
              <div className="space-y-2">
                {mockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 py-2 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                      <p 
                        className="font-bold text-sm"
                        style={{ color: theme.colors.primary }}
                      >
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {theme.layout === 'grid' && (
              <div className="grid grid-cols-2 gap-2">
                {mockProducts.map((product) => (
                  <div key={product.id} className="bg-slate-50 rounded-xl p-2 text-center">
                    <div className="w-full aspect-square rounded-lg bg-slate-200 mb-2" />
                    <p className="font-medium text-slate-800 text-xs truncate">{product.name}</p>
                    <p 
                      className="font-bold text-sm"
                      style={{ color: theme.colors.primary }}
                    >
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {theme.layout === 'minimal' && (
              <div className="space-y-2">
                {mockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.description}</p>
                    </div>
                    <p 
                      className="font-bold text-sm whitespace-nowrap"
                      style={{ color: theme.colors.primary }}
                    >
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {theme.display.showSocial && (
            <div className="px-4 py-3 border-t border-slate-100 flex justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="w-8 h-8 rounded-full bg-slate-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
