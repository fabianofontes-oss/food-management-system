'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Home, DollarSign, History, Users, User } from 'lucide-react'

export default function MotoristaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const slug = params.slug as string
  const base = `/${slug}/motorista`

  const navItems = [
    { href: base, label: 'Início', icon: Home },
    { href: `${base}/ganhos`, label: 'Ganhos', icon: DollarSign },
    { href: `${base}/historico`, label: 'Histórico', icon: History },
    { href: `${base}/indicacoes`, label: 'Indicações', icon: Users },
    { href: `${base}/perfil`, label: 'Perfil', icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {children}
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-cyan-600 bg-cyan-50'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
