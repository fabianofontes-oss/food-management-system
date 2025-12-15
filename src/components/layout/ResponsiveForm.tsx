import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveFormProps {
  children: ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export function ResponsiveForm({ children, onSubmit, className }: ResponsiveFormProps) {
  return (
    <form 
      onSubmit={onSubmit}
      className={cn('space-y-4 sm:space-y-6', className)}
    >
      {children}
    </form>
  )
}

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function FormField({ 
  label, 
  error, 
  required, 
  children, 
  className,
  fullWidth = true 
}: FormFieldProps) {
  return (
    <div className={cn(
      fullWidth ? 'w-full' : 'w-auto',
      className
    )}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="w-full">
        {children}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormRowProps {
  children: ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  className?: string
}

export function FormRow({ 
  children, 
  cols = { default: 1, sm: 2 },
  className 
}: FormRowProps) {
  return (
    <div className={cn(
      'grid gap-4',
      cols.default === 1 && 'grid-cols-1',
      cols.default === 2 && 'grid-cols-2',
      cols.sm === 1 && 'sm:grid-cols-1',
      cols.sm === 2 && 'sm:grid-cols-2',
      cols.sm === 3 && 'sm:grid-cols-3',
      cols.md === 1 && 'md:grid-cols-1',
      cols.md === 2 && 'md:grid-cols-2',
      cols.md === 3 && 'md:grid-cols-3',
      cols.lg === 1 && 'lg:grid-cols-1',
      cols.lg === 2 && 'lg:grid-cols-2',
      cols.lg === 3 && 'lg:grid-cols-3',
      cols.lg === 4 && 'lg:grid-cols-4',
      className
    )}>
      {children}
    </div>
  )
}
