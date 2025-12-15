'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarSection {
  title: string
  items: SidebarItem[]
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

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {sections.map((section) => (
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
        </div>
      ))}
    </nav>
  )
}
