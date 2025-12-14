'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, ShoppingCart, ChefHat, Truck, 
  Package, Settings, ChevronLeft, ChevronRight, Menu, X,
  Users, ShoppingBag, UserCog, BarChart3, Ticket, Store,
  DollarSign, Warehouse, LayoutGrid, PieChart, Star, Megaphone, CalendarDays, LogOut,
  Sparkles, TrendingUp, Bell, Search, ExternalLink, Coffee
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardClient({
  children,
  slug,
}: {
  children: React.ReactNode
  slug: string
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const base = `/${slug}/dashboard`

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { href: base, label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-purple-600' },
        { href: `${base}/pdv-novo`, label: 'PDV', icon: ShoppingCart, gradient: 'from-emerald-500 to-teal-600' },
        { href: `${base}/orders`, label: 'Pedidos', icon: ShoppingBag, gradient: 'from-blue-500 to-cyan-600' },
      ]
    },
    {
      title: 'Operações',
      items: [
        { href: `${base}/products`, label: 'Produtos', icon: Package, gradient: 'from-orange-500 to-amber-600' },
        { href: `${base}/addons`, label: 'Adicionais', icon: Coffee, gradient: 'from-pink-500 to-rose-600' },
        { href: `${base}/kitchen`, label: 'Cozinha', icon: ChefHat, gradient: 'from-red-500 to-rose-600' },
        { href: `${base}/delivery`, label: 'Delivery', icon: Truck, gradient: 'from-indigo-500 to-blue-600' },
        { href: `${base}/tables`, label: 'Mesas', icon: LayoutGrid, gradient: 'from-fuchsia-500 to-pink-600' },
        { href: `${base}/inventory`, label: 'Estoque', icon: Warehouse, gradient: 'from-amber-500 to-yellow-600' },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { href: `${base}/financial`, label: 'Financeiro', icon: DollarSign, gradient: 'from-green-500 to-emerald-600' },
        { href: `${base}/crm`, label: 'Clientes', icon: Users, gradient: 'from-purple-500 to-violet-600' },
        { href: `${base}/team`, label: 'Equipe', icon: UserCog, gradient: 'from-cyan-500 to-blue-600' },
        { href: `${base}/coupons`, label: 'Cupons', icon: Ticket, gradient: 'from-fuchsia-500 to-pink-600' },
        { href: `${base}/reservations`, label: 'Reservas', icon: CalendarDays, gradient: 'from-teal-500 to-cyan-600' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { href: `${base}/analytics`, label: 'Analytics', icon: PieChart, gradient: 'from-violet-500 to-indigo-600' },
        { href: `${base}/reports`, label: 'Relatórios', icon: BarChart3, gradient: 'from-sky-500 to-blue-600' },
        { href: `${base}/reviews`, label: 'Avaliações', icon: Star, gradient: 'from-yellow-500 to-orange-600' },
        { href: `${base}/marketing`, label: 'Marketing', icon: Megaphone, gradient: 'from-rose-500 to-pink-600' },
      ]
    },
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 hover:shadow-xl transition-all duration-300"
      >
        {isMobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 h-screen transition-all duration-300 ease-out z-50',
          'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950',
          isCollapsed ? 'w-[72px]' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className={cn(
            'p-4 border-b border-slate-800/50',
            isCollapsed ? 'px-3' : 'px-5'
          )}>
            <div className="flex items-center justify-between">
              <Link href={`/${slug}`} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <h1 className="font-bold text-white text-lg truncate">{slug}</h1>
                    <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Pro Dashboard</p>
                  </div>
                )}
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  'hidden lg:flex items-center justify-center w-8 h-8 rounded-lg',
                  'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white',
                  'transition-all duration-200'
                )}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="px-4 py-3 border-b border-slate-800/50">
              <div className="flex gap-2">
                <Link
                  href={`/${slug}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white text-xs font-medium transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Cardápio
                </Link>
                <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {menuSections.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || 
                      (item.href !== base && pathname.startsWith(item.href + '/'))
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg'
                            : 'hover:bg-slate-800/50'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-white/20'
                            : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                        )}>
                          <Icon className={cn(
                            'w-[18px] h-[18px] transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )} />
                        </div>
                        {!isCollapsed && (
                          <span className={cn(
                            'font-medium text-sm transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )}>
                            {item.label}
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80"></div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Settings & Logout */}
          <div className="p-3 border-t border-slate-800/50 space-y-1">
            <Link
              href={`${base}/settings`}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                pathname.includes('/settings')
                  ? 'bg-slate-800 text-white'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-all',
                pathname.includes('/settings') ? 'bg-slate-700' : 'bg-slate-800/50 group-hover:bg-slate-700/50'
              )}>
                <Settings className="w-[18px] h-[18px]" />
              </div>
              {!isCollapsed && <span className="font-medium text-sm">Configurações</span>}
            </Link>
            
            <Link
              href="/logout"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 group-hover:bg-rose-500/10 transition-all">
                <LogOut className="w-[18px] h-[18px]" />
              </div>
              {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
            </Link>
          </div>

          {/* Pro Badge */}
          {!isCollapsed && (
            <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Plano Pro</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Acesso completo a todos os recursos premium do sistema.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
