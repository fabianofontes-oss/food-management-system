import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface DriverCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'highlight'
}

export function DriverCard({ children, className, variant = 'default' }: DriverCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300',
        {
          'bg-driver-surface border-driver-surface-lighter': variant === 'default',
          'bg-gradient-to-br from-driver-surface to-[#2a1e15] border-driver-surface-lighter shadow-lg':
            variant === 'gradient',
          'bg-driver-surface border-l-4 border-l-driver-primary border-driver-surface-lighter shadow-lg':
            variant === 'highlight',
        },
        className
      )}
    >
      {children}
    </div>
  )
}

interface DriverCardHeaderProps {
  children: ReactNode
  className?: string
}

export function DriverCardHeader({ children, className }: DriverCardHeaderProps) {
  return <div className={cn('p-4 pb-2', className)}>{children}</div>
}

interface DriverCardContentProps {
  children: ReactNode
  className?: string
}

export function DriverCardContent({ children, className }: DriverCardContentProps) {
  return <div className={cn('p-4 pt-2', className)}>{children}</div>
}
