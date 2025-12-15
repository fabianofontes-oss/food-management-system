'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export interface SidebarSection {
  title: string
  items: SidebarItem[]
  collapsible?: boolean // Se true, o grupo pode ser expandido/colapsado
  defaultOpen?: boolean // Estado inicial (default: false para collapsible)
}

export interface SidebarItem {
  href: string
  label: string
  icon: LucideIcon
  gradient?: string
}

interface SidebarProps {
  sections: SidebarSection[]
  basePath: string
  isCollapsed?: boolean
  onItemClick?: () => void
}

export function Sidebar({ sections, basePath, isCollapsed = false, onItemClick }: SidebarProps) {
  const pathname = usePathname()
  
  // Estado para controlar quais seções collapsible estão abertas
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach(section => {
      if (section.collapsible) {
        // Abre automático se algum item está ativo
        const hasActiveItem = section.items.some(item => 
          pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href + '/'))
        )
        initial[section.title] = hasActiveItem || (section.defaultOpen ?? false)
      }
    })
    return initial
  })

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const renderItems = (items: SidebarItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || 
          (item.href !== basePath && pathname.startsWith(item.href + '/'))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r ' + (item.gradient || 'from-emerald-500 to-teal-600') + ' shadow-lg'
                : 'hover:bg-slate-800/50'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-white/20'
                : 'bg-slate-800/30 group-hover:bg-slate-700/50'
            )}>
              <Icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              )} />
            </div>
            {!isCollapsed && (
              <span className={cn(
                'font-medium text-sm transition-colors',
                isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
              )}>
                {item.label}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {sections.map((section) => {
        const isOpen = openSections[section.title] ?? true
        
        // Seção Collapsible
        if (section.collapsible && !isCollapsed) {
          return (
            <Collapsible 
              key={section.title} 
              open={isOpen} 
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer">
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-slate-500 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                {renderItems(section.items)}
              </CollapsibleContent>
            </Collapsible>
          )
        }
        
        // Seção Normal (sempre visível)
        return (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            {renderItems(section.items)}
          </div>
        )
      })}
    </nav>
  )
}
