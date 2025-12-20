'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, History, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DriverBottomNavProps {
  storeSlug: string
}

const navItems = [
  { id: 'inicio', label: 'Início', icon: Home, href: '' },
  { id: 'ganhos', label: 'Carteira', icon: Wallet, href: '/ganhos' },
  { id: 'historico', label: 'Histórico', icon: History, href: '/historico' },
  { id: 'perfil', label: 'Perfil', icon: User, href: '/perfil' },
]

export function DriverBottomNav({ storeSlug }: DriverBottomNavProps) {
  const pathname = usePathname()
  const basePath = `/${storeSlug}/motorista`

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`
    if (href === '') {
      return pathname === basePath || pathname === `${basePath}/`
    }
    return pathname.startsWith(fullPath)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-driver-background border-t border-driver-surface z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.id}
              href={`${basePath}${item.href}`}
              className={cn(
                'flex flex-col items-center gap-1 w-16 transition-colors',
                active ? 'text-driver-primary' : 'text-driver-text-secondary hover:text-white'
              )}
            >
              <Icon className={cn('w-6 h-6', active && 'fill-current')} />
              <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
