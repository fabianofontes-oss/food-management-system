'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Truck, 
  Store, 
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import { useStores } from '@/hooks/useStores'

const getMenuItems = (settings: any) => [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    activeColor: 'bg-red-100',
    show: true
  },
  { 
    href: '/pos', 
    label: 'PDV', 
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    activeColor: 'bg-blue-100',
    show: settings?.enable_pos !== false
  },
  { 
    href: '/kitchen', 
    label: 'Cozinha', 
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    activeColor: 'bg-orange-100',
    show: settings?.enable_kitchen !== false
  },
  { 
    href: '/delivery', 
    label: 'Delivery', 
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    activeColor: 'bg-purple-100',
    show: settings?.enable_delivery !== false
  },
  { 
    href: '/stores', 
    label: 'Lojas', 
    icon: Store,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    activeColor: 'bg-green-100',
    show: true
  },
  { 
    href: '/tenants', 
    label: 'Tenants', 
    icon: Building2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    activeColor: 'bg-indigo-100',
    show: true
  },
].filter(item => item.show)

const settingsItem = {
  href: '/settings',
  label: 'Configurações',
  icon: Settings,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50',
  activeColor: 'bg-gray-100'
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { stores } = useStores()
  const currentStore = stores[0]
  const { settings } = useSettings(currentStore?.id)
  
  const menuItems = getMenuItems(settings)

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 flex flex-col',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
              Food System
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  'hover:shadow-md',
                  isActive
                    ? `${item.activeColor} ${item.color} font-semibold shadow-sm`
                    : `${item.bgColor} hover:${item.activeColor}`,
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', item.color)} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <Link
            href={settingsItem.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
              'hover:shadow-md',
              pathname === settingsItem.href
                ? `${settingsItem.activeColor} ${settingsItem.color} font-semibold shadow-sm`
                : `${settingsItem.bgColor} hover:${settingsItem.activeColor}`,
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? settingsItem.label : undefined}
          >
            <settingsItem.icon className={cn('w-5 h-5 flex-shrink-0', settingsItem.color)} />
            {!isCollapsed && (
              <span className="text-sm font-medium">{settingsItem.label}</span>
            )}
          </Link>
          
          {!isCollapsed && (
            <div className="text-xs text-gray-500 text-center mt-3">
              v1.0.0 • Multi-tenant
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
