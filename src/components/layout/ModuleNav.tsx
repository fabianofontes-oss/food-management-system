'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, ShoppingCart, ChefHat, Truck, BarChart3 } from 'lucide-react'

export function ModuleNav() {
  const pathname = usePathname()

  const modules = [
    { name: 'Início', href: '/', icon: Home, color: 'text-gray-600' },
    { name: 'Cardápio', href: '/acai-sabor-real', icon: Store, color: 'text-green-600' },
    { name: 'PDV', href: '/pos', icon: ShoppingCart, color: 'text-blue-600' },
    { name: 'Cozinha', href: '/kitchen', icon: ChefHat, color: 'text-orange-600' },
    { name: 'Delivery', href: '/delivery', icon: Truck, color: 'text-purple-600' },
    { name: 'Admin', href: '/dashboard', icon: BarChart3, color: 'text-red-600' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 lg:top-0 lg:bottom-auto">
      <div className="container mx-auto">
        <div className="flex items-center justify-around lg:justify-center lg:gap-2 py-2">
          {modules.map((module) => {
            const Icon = module.icon
            const active = isActive(module.href)
            
            return (
              <Link
                key={module.href}
                href={module.href}
                className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-2 px-3 py-2 rounded-xl transition-all ${
                  active
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-green-600' : module.color}`} />
                <span className={`text-xs lg:text-sm font-semibold ${active ? 'text-green-700' : ''}`}>
                  {module.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
