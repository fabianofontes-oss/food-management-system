'use client'

import { useParams } from 'next/navigation'
import { DriverBottomNav } from '@/modules/driver/components/ui/DriverBottomNav'

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const storeSlug = params.slug as string

  return (
    <div className="min-h-screen bg-driver-background font-display text-white antialiased pb-24">
      {children}
      <DriverBottomNav storeSlug={storeSlug} />
    </div>
  )
}
