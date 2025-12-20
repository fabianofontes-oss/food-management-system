'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DriverHeaderProps {
  driverName: string
  photoUrl?: string
  isOnline?: boolean
  onToggleOnline?: (online: boolean) => void
  notificationCount?: number
}

export function DriverHeader({
  driverName,
  photoUrl,
  isOnline = true,
  onToggleOnline,
  notificationCount = 0,
}: DriverHeaderProps) {
  const [online, setOnline] = useState(isOnline)

  const handleToggle = () => {
    const newStatus = !online
    setOnline(newStatus)
    onToggleOnline?.(newStatus)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <header className="sticky top-0 z-50 bg-driver-background/95 backdrop-blur-md border-b border-driver-surface">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-driver-primary"
              style={{
                backgroundImage: photoUrl
                  ? `url("${photoUrl}")`
                  : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c9a992'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E")`,
              }}
            />
            <div
              className={cn(
                'absolute bottom-0 right-0 size-3 border-2 border-driver-background rounded-full',
                online ? 'bg-green-500' : 'bg-gray-500'
              )}
            />
          </div>
          <div>
            <p className="text-xs text-driver-text-secondary font-medium">{getGreeting()},</p>
            <h2 className="text-white text-lg font-bold leading-none">{driverName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Toggle */}
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 bg-driver-surface px-3 py-1.5 rounded-full border border-driver-surface-lighter"
          >
            <span className={cn('text-xs font-bold', online ? 'text-driver-primary' : 'text-gray-400')}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
            <div className="relative w-9 h-5">
              <div
                className={cn(
                  'absolute inset-0 rounded-full transition-colors',
                  online ? 'bg-driver-primary' : 'bg-driver-surface-lighter'
                )}
              />
              <div
                className={cn(
                  'absolute top-0.5 h-4 w-4 bg-white rounded-full transition-transform',
                  online ? 'translate-x-[18px]' : 'translate-x-0.5'
                )}
              />
            </div>
          </button>

          {/* Bell Icon */}
          <button className="relative flex items-center justify-center size-10 rounded-full bg-driver-surface text-white hover:bg-driver-surface-lighter transition-colors">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-driver-surface" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
