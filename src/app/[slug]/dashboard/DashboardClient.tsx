'use client'

import { createContext, useContext } from 'react'
import {
  LayoutDashboard, ShoppingCart, ChefHat, Truck, 
  Package, Settings, Users, ShoppingBag, UserCog, BarChart3, 
  Ticket, DollarSign, Warehouse, LayoutGrid, PieChart, Star, 
  Megaphone, CalendarDays, LogOut, Coffee, Palette, Sparkles, Store
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SidebarSection } from '@/components/layout/Sidebar'

const DashboardStoreIdContext = createContext<string | null>(null)

export function useDashboardStoreId() {
  return useContext(DashboardStoreIdContext)
}

export default function DashboardClient({
  children,
  slug,
  storeId,
}: {
  children: React.ReactNode
  slug: string
  storeId?: string | null
}) {
  const base = `/${slug}/dashboard`

  // SIDEBAR REORGANIZADO - Com grupos Collapsible
  const menuSections: SidebarSection[] = [
    {
      title: 'Principal',
      items: [
        { href: base, label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-purple-600' },
        { href: `${base}/orders`, label: 'Pedidos', icon: ShoppingBag, gradient: 'from-blue-500 to-cyan-600' },
        { href: `${base}/kitchen`, label: 'Cozinha (KDS)', icon: ChefHat, gradient: 'from-red-500 to-rose-600' },
        { href: `${base}/pos`, label: 'PDV', icon: ShoppingCart, gradient: 'from-emerald-500 to-teal-600' },
      ]
    },
    {
      title: 'Cardápio',
      items: [
        { href: `${base}/products`, label: 'Produtos', icon: Package, gradient: 'from-orange-500 to-amber-600' },
        { href: `${base}/addons`, label: 'Adicionais', icon: Coffee, gradient: 'from-pink-500 to-rose-600' },
        { href: `${base}/inventory`, label: 'Estoque', icon: Warehouse, gradient: 'from-amber-500 to-yellow-600' },
      ]
    },
    {
      title: 'Gestão',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: `${base}/financial`, label: 'Financeiro', icon: DollarSign, gradient: 'from-green-500 to-emerald-600' },
        { href: `${base}/crm`, label: 'Clientes', icon: Users, gradient: 'from-purple-500 to-violet-600' },
        { href: `${base}/delivery`, label: 'Entregadores', icon: Truck, gradient: 'from-indigo-500 to-blue-600' },
        { href: `${base}/tables`, label: 'Mesas', icon: LayoutGrid, gradient: 'from-fuchsia-500 to-pink-600' },
        { href: `${base}/reservations`, label: 'Reservas', icon: CalendarDays, gradient: 'from-teal-500 to-cyan-600' },
        { href: `${base}/coupons`, label: 'Cupons', icon: Ticket, gradient: 'from-fuchsia-500 to-pink-600' },
        { href: `${base}/analytics`, label: 'Relatórios', icon: BarChart3, gradient: 'from-sky-500 to-blue-600' },
      ]
    },
    {
      title: 'Configurações',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: `${base}/settings/store`, label: 'Dados da Loja', icon: Store, gradient: 'from-emerald-500 to-green-600' },
        { href: `${base}/appearance`, label: 'Aparência', icon: Palette, gradient: 'from-purple-500 to-fuchsia-600' },
        { href: `${base}/settings/niche`, label: 'Kit Inicial', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
        { href: `${base}/settings`, label: 'Avançado', icon: Settings, gradient: 'from-slate-500 to-slate-600' },
      ]
    },
  ]

  return (
    <DashboardStoreIdContext.Provider value={storeId ?? null}>
      <AppShell slug={slug} sections={menuSections} basePath={base}>
        {children}
      </AppShell>
    </DashboardStoreIdContext.Provider>
  )
}
