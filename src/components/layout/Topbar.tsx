'use client'

import { Menu, Bell, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TopbarProps {
  slug: string
  onMenuClick?: () => void
  breadcrumb?: string
  className?: string
}

export function Topbar({ slug, onMenuClick, breadcrumb, className }: TopbarProps) {
  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const normalizedBase = (baseUrl || origin).replace(/\/$/, '')
  const publicMenuUrl = normalizedBase ? `${normalizedBase}/${slug}` : `/${slug}`

  return (
    <header className={cn(
      'sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Mobile Menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden min-w-[48px] min-h-[48px] p-3 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
          )}
          {breadcrumb && (
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-slate-700">{breadcrumb}</h2>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={publicMenuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Cardápio
          </a>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  )
}
