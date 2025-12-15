'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Store, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar, SidebarSection } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: ReactNode
  slug: string
  sections: SidebarSection[]
  basePath: string
  breadcrumb?: string
}

export function AppShell({ children, slug, sections, basePath, breadcrumb }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-out',
          'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950',
          isCollapsed ? 'w-[72px]' : 'w-72'
        )}
      >
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
                'flex items-center justify-center w-8 h-8 rounded-lg',
                'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white',
                'transition-all duration-200'
              )}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <Sidebar 
          sections={sections} 
          basePath={basePath} 
          isCollapsed={isCollapsed}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-800">
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-800/50">
            <Link href={`/${slug}`} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-white text-lg truncate">{slug}</h1>
                <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Pro Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <Sidebar 
            sections={sections} 
            basePath={basePath}
            onItemClick={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          slug={slug} 
          onMenuClick={() => setIsMobileOpen(true)}
          breadcrumb={breadcrumb}
        />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
