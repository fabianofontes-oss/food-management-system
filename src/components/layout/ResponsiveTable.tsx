'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: tabela normal */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
      
      {/* Mobile: renderizado pelos componentes filhos como cards */}
      <div className="md:hidden space-y-3">
        {children}
      </div>
    </div>
  )
}

interface ResponsiveTableRowProps {
  children: ReactNode
  mobileCard?: ReactNode
  className?: string
}

export function ResponsiveTableRow({ children, mobileCard, className }: ResponsiveTableRowProps) {
  return (
    <>
      {/* Desktop: linha de tabela */}
      <tr className={cn('hidden md:table-row', className)}>
        {children}
      </tr>
      
      {/* Mobile: card customizado */}
      {mobileCard && (
        <div className="md:hidden">
          {mobileCard}
        </div>
      )}
    </>
  )
}
