import { ReactNode } from 'react'
import { ModuleNav } from './ModuleNav'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pt-16">
      <ModuleNav />
      {children}
    </div>
  )
}
