import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface DriverButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const DriverButton = forwardRef<HTMLButtonElement, DriverButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-colors',
          // Variants
          {
            'bg-driver-primary hover:bg-driver-primary-hover text-white shadow-lg shadow-driver-primary/20':
              variant === 'primary',
            'bg-driver-surface-lighter hover:bg-[#5a402d] text-white': variant === 'secondary',
            'border border-driver-surface-lighter text-driver-text-secondary hover:bg-driver-surface-lighter hover:text-white':
              variant === 'outline',
            'text-driver-text-secondary hover:text-white hover:bg-driver-surface': variant === 'ghost',
          },
          // Sizes
          {
            'py-2 px-3 text-sm': size === 'sm',
            'py-3 px-4 text-sm': size === 'md',
            'py-4 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

DriverButton.displayName = 'DriverButton'
