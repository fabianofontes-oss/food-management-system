'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, ShoppingCart, ChefHat, Truck, 
  Package, Settings, ChevronLeft, ChevronRight, Menu,
  Users, ShoppingBag, ClipboardList, ChevronDown, UserCog, BarChart3, Ticket,
  DollarSign, Warehouse, LayoutGrid, PieChart, Star, Megaphone, CalendarDays, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'

export default function DashboardClient({
  children,
  slug,
}: {
  children: React.ReactNode
  slug: string
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ 'operacoes': true })
  const pathname = usePathname()
  const { t } = useLanguage()
  const base = `/${slug}/dashboard`
  
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }))
  }

  const menuItems = [
    { 
      href: base, 
      label: t('menu.dashboard'),
      icon: LayoutDashboard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      activeColor: 'bg-red-100'
    },
    { 
      href: `${base}/products`, 
      label: t('menu.products'),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      activeColor: 'bg-blue-100'
    },
    { 
      href: `${base}/orders`, 
      label: 'Pedidos',
      icon: ShoppingBag,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      activeColor: 'bg-teal-100'
    },
    { 
      href: `${base}/delivery`, 
      label: 'Delivery',
      icon: Truck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      activeColor: 'bg-indigo-100'
    },
    { 
      href: `${base}/crm`, 
      label: 'CRM',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      activeColor: 'bg-purple-100'
    },
    { 
      href: `${base}/pos`, 
      label: 'PDV',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      activeColor: 'bg-green-100'
    },
    { 
      href: `${base}/kitchen`, 
      label: t('menu.kitchen'),
      icon: ChefHat,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      activeColor: 'bg-orange-100'
    },
    { 
      href: `${base}/reports`, 
      label: 'Relatórios',
      icon: BarChart3,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      activeColor: 'bg-pink-100'
    },
    { 
      href: `${base}/coupons`, 
      label: 'Cupons',
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      activeColor: 'bg-purple-100'
    },
    { 
      href: `${base}/team`, 
      label: 'Equipe',
      icon: UserCog,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      activeColor: 'bg-cyan-100'
    },
    { 
      href: `${base}/financial`, 
      label: 'Financeiro',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      activeColor: 'bg-green-100'
    },
    { 
      href: `${base}/inventory`, 
      label: 'Estoque',
      icon: Warehouse,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      activeColor: 'bg-amber-100'
    },
    { 
      href: `${base}/tables`, 
      label: 'Mesas',
      icon: LayoutGrid,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      activeColor: 'bg-orange-100'
    },
    { 
      href: `${base}/analytics`, 
      label: 'Analytics',
      icon: PieChart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      activeColor: 'bg-indigo-100'
    },
    { 
      href: `${base}/reviews`, 
      label: 'Avaliações',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      activeColor: 'bg-yellow-100'
    },
    { 
      href: `${base}/marketing`, 
      label: 'Marketing',
      icon: Megaphone,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      activeColor: 'bg-pink-100'
    },
    { 
      href: `${base}/reservations`, 
      label: 'Reservas',
      icon: CalendarDays,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      activeColor: 'bg-teal-100'
    },
    { 
      href: `${base}/settings`, 
      label: t('menu.settings'),
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      activeColor: 'bg-gray-100'
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Painel da Loja</h2>
                  <p className="text-xs text-gray-500">Gestão Completa</p>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto pb-24">
            {menuItems.map((item: any) => {
              const Icon = item.icon
              
              if (item.submenu) {
                const isExpanded = expandedMenus[item.id]
                const isAnySubmenuActive = item.submenu.some((sub: any) => 
                  pathname === sub.href || pathname.startsWith(sub.href + '/')
                )
                
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                        isAnySubmenuActive
                          ? `${item.activeColor} ${item.color} shadow-sm`
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg transition-colors',
                        isAnySubmenuActive ? item.bgColor : 'bg-gray-50 group-hover:bg-gray-100'
                      )}>
                        <Icon className={cn('w-5 h-5', isAnySubmenuActive ? item.color : 'text-gray-600')} />
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          <ChevronDown className={cn(
                            'w-4 h-4 transition-transform',
                            isExpanded ? 'rotate-180' : ''
                          )} />
                        </>
                      )}
                    </button>
                    
                    {isExpanded && !isCollapsed && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem: any) => {
                          const SubIcon = subItem.icon
                          const isActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                          
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-4 py-2 rounded-lg transition-all',
                                isActive
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span className="text-sm">{subItem.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                    isActive
                      ? `${item.activeColor} ${item.color} shadow-sm`
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg transition-colors',
                    isActive ? item.bgColor : 'bg-gray-50 group-hover:bg-gray-100'
                  )}>
                    <Icon className={cn('w-5 h-5', isActive ? item.color : 'text-gray-600')} />
                  </div>
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span className="font-medium">Sair</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
