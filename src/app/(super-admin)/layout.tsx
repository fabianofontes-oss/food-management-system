'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Store, ChevronLeft, ChevronRight, Menu, LayoutDashboard, Users, Settings, CreditCard, BarChart3, FileText, Ticket, Flag, Zap, FileSpreadsheet, LogOut, Gauge, ToggleRight, Activity, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageProvider } from '@/lib/LanguageContext'

const menuItems = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Centro de Comando'
  },
  { 
    href: '/admin/tenants', 
    label: 'Tenants', 
    icon: Building2,
    description: 'Gerenciar Redes'
  },
  { 
    href: '/admin/stores', 
    label: 'Lojas', 
    icon: Store,
    description: 'Gerenciar Lojas'
  },
  { 
    href: '/admin/plans', 
    label: 'Planos', 
    icon: CreditCard,
    description: 'Gestão de Planos'
  },
  { 
    href: '/admin/billing', 
    label: 'Billing', 
    icon: CreditCard,
    description: 'Faturas e Pagamentos'
  },
  { 
    href: '/admin/affiliates', 
    label: 'Afiliados', 
    icon: Link2,
    description: 'Programa de Afiliados'
  },
  { 
    href: '/admin/users', 
    label: 'Usuários', 
    icon: Users,
    description: 'Gerenciar Usuários'
  },
  { 
    href: '/admin/analytics', 
    label: 'Analytics', 
    icon: BarChart3,
    description: 'Métricas e Relatórios'
  },
  { 
    href: '/admin/logs', 
    label: 'Logs', 
    icon: FileText,
    description: 'Auditoria'
  },
  { 
    href: '/admin/tickets', 
    label: 'Tickets', 
    icon: Ticket,
    description: 'Suporte'
  },
  { 
    href: '/admin/features', 
    label: 'Feature Flags', 
    icon: Flag,
    description: 'Controle de Features'
  },
  { 
    href: '/admin/automations', 
    label: 'Automações', 
    icon: Zap,
    description: 'Automações'
  },
  { 
    href: '/admin/reports', 
    label: 'Relatórios', 
    icon: FileSpreadsheet,
    description: 'Relatórios'
  },
  { 
    href: '/admin/health', 
    label: 'Saúde do Sistema', 
    icon: Gauge,
    description: 'Monitoramento'
  },
  { 
    href: '/admin/audit', 
    label: 'Raio-X do Código', 
    icon: Activity,
    description: 'Auditoria Funcional'
  },
  { 
    href: '/admin/demanda', 
    label: 'Controle de Demanda', 
    icon: ToggleRight,
    description: 'APIs e Features'
  },
  { 
    href: '/admin/settings', 
    label: 'Configurações', 
    icon: Settings,
    description: 'Configurações Sistema'
  },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <LanguageProvider
      locale="pt-BR"
      country="BR"
      currency="BRL"
      timezone="America/Sao_Paulo"
    >
      <div className="flex min-h-screen bg-gray-900">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-lg text-white"
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
          'fixed lg:sticky top-0 h-screen bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div>
                  <h2 className="text-xl font-bold text-white">Super Admin</h2>
                  <p className="text-xs text-gray-400">Painel do Sistema</p>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
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
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-white')} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-xs opacity-75 truncate">{item.description}</div>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer com Logout */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <Link
              href="/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Sair</span>}
            </Link>
            {!isCollapsed && (
              <div className="text-xs text-gray-400 text-center">
                Sistema Multi-Tenant
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 transition-all duration-300',
        isCollapsed ? 'lg:ml-0' : 'lg:ml-0'
      )}>
        {children}
      </main>
    </div>
    </LanguageProvider>
  )
}
