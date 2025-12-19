'use client'

import { createContext, useContext } from 'react'
import {
  LayoutDashboard, ChefHat, Truck, ShoppingCart,
  Package, Settings, Users, ShoppingBag, UserCog, BarChart3, 
  Ticket, DollarSign, Warehouse, LayoutGrid, PieChart, Star, 
  Megaphone, CalendarDays, LogOut, Coffee, Sparkles, Store
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SidebarSection } from '@/components/layout/Sidebar'

const DashboardStoreIdContext = createContext<string | null>(null)

export function useDashboardStoreId() {
  return useContext(DashboardStoreIdContext)
}

// Mapeamento de rotas para módulos do plano
const ROUTE_TO_MODULE: Record<string, string> = {
  'orders': 'orders',
  'kitchen': 'kitchen',
  'pos': 'pos',
  'products': 'products',
  'addons': 'addons',
  'inventory': 'inventory',
  'financial': 'financial',
  'crm': 'crm',
  'delivery': 'delivery',
  'tables': 'tables',
  'reservations': 'reservations',
  'coupons': 'coupons',
  'analytics': 'analytics',
  'reports': 'reports',
    'marketing': 'marketing',
  'reviews': 'reviews',
  'team': 'team',
  'waiters': 'waiters',
  'kits': 'kits',
  'custom-orders': 'custom_orders',
}

export default function DashboardClient({
  children,
  slug,
  storeId,
  availableModules = [],
}: {
  children: React.ReactNode
  slug: string
  storeId?: string | null
  availableModules?: string[]
}) {
  const base = `/${slug}/dashboard`
  
  // Função para verificar se um módulo está disponível
  const hasModule = (moduleId: string) => {
    // Core modules sempre disponíveis
    const coreModules = ['dashboard', 'products', 'orders', 'settings']
    if (coreModules.includes(moduleId)) return true
    return availableModules.includes(moduleId)
  }

  // SIDEBAR REORGANIZADO - Com grupos Collapsible
  // Filtra itens baseado nos módulos disponíveis
  const menuSections: SidebarSection[] = [
    {
      title: 'Principal',
      items: [
        { href: base, label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-purple-600' },
        { href: `${base}/orders`, label: 'Pedidos', icon: ShoppingBag, gradient: 'from-blue-500 to-cyan-600' },
        hasModule('pos') && { href: `${base}/pos`, label: 'PDV', icon: ShoppingCart, gradient: 'from-emerald-500 to-teal-600' },
        hasModule('kitchen') && { href: `${base}/kitchen`, label: 'Cozinha (KDS)', icon: ChefHat, gradient: 'from-red-500 to-rose-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
    {
      title: 'Cardápio',
      items: [
        { href: `${base}/products`, label: 'Produtos', icon: Package, gradient: 'from-orange-500 to-amber-600' },
        hasModule('addons') && { href: `${base}/addons`, label: 'Adicionais', icon: Coffee, gradient: 'from-pink-500 to-rose-600' },
        hasModule('kits') && { href: `${base}/kits`, label: 'Kits/Combos', icon: Package, gradient: 'from-violet-500 to-purple-600' },
        hasModule('inventory') && { href: `${base}/inventory`, label: 'Estoque', icon: Warehouse, gradient: 'from-amber-500 to-yellow-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
    {
      title: 'Gestão',
      collapsible: true,
      defaultOpen: false,
      items: [
        hasModule('financial') && { href: `${base}/financial`, label: 'Financeiro', icon: DollarSign, gradient: 'from-green-500 to-emerald-600' },
        hasModule('crm') && { href: `${base}/crm`, label: 'Clientes', icon: Users, gradient: 'from-purple-500 to-violet-600' },
        hasModule('delivery') && { href: `${base}/delivery`, label: 'Entregadores', icon: Truck, gradient: 'from-indigo-500 to-blue-600' },
        hasModule('tables') && { href: `${base}/tables`, label: 'Mesas', icon: LayoutGrid, gradient: 'from-fuchsia-500 to-pink-600' },
        hasModule('waiters') && { href: `${base}/waiters`, label: 'Garçons', icon: UserCog, gradient: 'from-amber-500 to-orange-600' },
        hasModule('reservations') && { href: `${base}/reservations`, label: 'Reservas', icon: CalendarDays, gradient: 'from-teal-500 to-cyan-600' },
        hasModule('team') && { href: `${base}/team`, label: 'Equipe', icon: Users, gradient: 'from-slate-500 to-gray-600' },
        hasModule('custom_orders') && { href: `${base}/custom-orders`, label: 'Encomendas', icon: Package, gradient: 'from-rose-500 to-pink-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
    {
      title: 'Marketing',
      collapsible: true,
      defaultOpen: false,
      items: [
        hasModule('coupons') && { href: `${base}/coupons`, label: 'Cupons', icon: Ticket, gradient: 'from-fuchsia-500 to-pink-600' },
        hasModule('marketing') && { href: `${base}/marketing`, label: 'Campanhas', icon: Megaphone, gradient: 'from-orange-500 to-red-600' },
        hasModule('reviews') && { href: `${base}/reviews`, label: 'Avaliações', icon: Star, gradient: 'from-yellow-500 to-amber-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
    {
      title: 'Relatórios',
      collapsible: true,
      defaultOpen: false,
      items: [
        hasModule('analytics') && { href: `${base}/analytics`, label: 'Analytics', icon: BarChart3, gradient: 'from-sky-500 to-blue-600' },
        hasModule('reports') && { href: `${base}/reports`, label: 'Relatórios', icon: PieChart, gradient: 'from-indigo-500 to-purple-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
    {
      title: 'Configurações',
      collapsible: true,
      defaultOpen: false,
      items: [
        { href: `${base}/settings/store`, label: 'Dados da Loja', icon: Store, gradient: 'from-emerald-500 to-green-600' },
        hasModule('onboarding') && { href: `${base}/onboarding`, label: 'Onboarding', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
        { href: `${base}/settings`, label: 'Avançado', icon: Settings, gradient: 'from-slate-500 to-slate-600' },
      ].filter(Boolean) as SidebarSection['items']
    },
  ].filter(section => section.items.length > 0)

  return (
    <DashboardStoreIdContext.Provider value={storeId ?? null}>
      <AppShell slug={slug} sections={menuSections} basePath={base}>
        {children}
      </AppShell>
    </DashboardStoreIdContext.Provider>
  )
}
