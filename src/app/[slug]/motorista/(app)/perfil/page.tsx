'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  User, Edit3, CreditCard, Bike, FileText, Bell, HelpCircle, Globe, 
  LogOut, ChevronRight, Star, Shield, Camera, LucideIcon
} from 'lucide-react'
import { DriverCard, DriverCardContent } from '@/modules/driver/components/ui/DriverCard'

interface MenuItem {
  icon: LucideIcon
  label: string
  sublabel?: string
  sublabelColor?: string
  href?: string
  action?: string
  toggle?: boolean
  checked?: boolean
  onToggle?: () => void
}
import { DriverButton } from '@/modules/driver/components/ui/DriverButton'
import Link from 'next/link'

interface DriverProfile {
  id: string
  name: string
  phone: string
  email?: string
  photo_url?: string
  rating: number
  since: string
  vehicle: {
    model: string
    plate: string
  }
  documents: {
    status: 'ok' | 'pending' | 'expired'
  }
}

export default function PerfilPage() {
  const params = useParams()
  const router = useRouter()
  const storeSlug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Simulated profile data
  const [profile] = useState<DriverProfile>({
    id: '1',
    name: 'Carlos Silva',
    phone: '(11) 99999-9999',
    email: 'carlos@email.com',
    rating: 4.9,
    since: '2021',
    vehicle: {
      model: 'Honda CG 160',
      plate: 'ABC-1234',
    },
    documents: {
      status: 'ok',
    },
  })

  useEffect(() => {
    const driverData = localStorage.getItem(`driver_${storeSlug}`)
    if (!driverData) {
      router.push(`/${storeSlug}/motorista`)
      return
    }
    setLoading(false)
  }, [storeSlug, router])

  const handleLogout = () => {
    localStorage.removeItem(`driver_${storeSlug}`)
    router.push(`/${storeSlug}/motorista`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-driver-background flex items-center justify-center">
        <User className="w-12 h-12 text-driver-primary animate-pulse" />
      </div>
    )
  }

  const menuSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'MINHA CONTA',
      items: [
        { icon: User, label: 'Editar Perfil', sublabel: 'Nome, e-mail e telefone', href: '#' },
        { icon: CreditCard, label: 'Dados Bancários', sublabel: 'Gerenciar chaves Pix e contas', href: '#' },
      ],
    },
    {
      title: 'MEU VEÍCULO',
      items: [
        { 
          icon: Bike, 
          label: profile.vehicle.model, 
          sublabel: profile.vehicle.plate,
          action: 'Alterar',
          href: '#' 
        },
        { 
          icon: FileText, 
          label: 'Documentação', 
          sublabel: profile.documents.status === 'ok' ? 'Regularizada' : 'Pendente',
          sublabelColor: profile.documents.status === 'ok' ? 'text-green-400' : 'text-yellow-400',
          href: '#' 
        },
      ],
    },
    {
      title: 'APP',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações Push', 
          toggle: true,
          checked: notificationsEnabled,
          onToggle: () => setNotificationsEnabled(!notificationsEnabled)
        },
        { icon: HelpCircle, label: 'Ajuda e Suporte', href: '#' },
        { icon: Globe, label: 'Idioma', sublabel: 'Português (BR)', href: '#' },
      ],
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-driver-background/95 backdrop-blur-md border-b border-driver-surface">
        <div className="flex items-center justify-center p-4">
          <h1 className="text-white text-xl font-bold">Perfil</h1>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4">
        {/* Profile Card */}
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-4">
            <div
              className="size-24 rounded-full bg-driver-surface border-4 border-driver-primary bg-cover bg-center"
              style={{
                backgroundImage: profile.photo_url
                  ? `url("${profile.photo_url}")`
                  : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c9a992'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E")`,
              }}
            />
            <button className="absolute bottom-0 right-0 size-8 rounded-full bg-driver-primary flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <h2 className="text-white text-xl font-bold">{profile.name}</h2>
          <div className="flex items-center gap-2 text-driver-text-secondary text-sm mt-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-medium">{profile.rating}</span>
            <span>•</span>
            <span>Entregador desde {profile.since}</span>
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <section key={section.title}>
            <p className="text-driver-text-secondary text-xs font-medium tracking-wider mb-3">
              {section.title}
            </p>
            <DriverCard>
              <div className="divide-y divide-driver-surface-lighter">
                {section.items.map((item, index) => {
                  const Icon = item.icon

                  if (item.toggle) {
                    return (
                      <div key={index} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-driver-surface-lighter flex items-center justify-center">
                            <Icon className="w-5 h-5 text-driver-primary" />
                          </div>
                          <span className="text-white font-medium">{item.label}</span>
                        </div>
                        <button
                          onClick={item.onToggle}
                          className="relative w-12 h-6 rounded-full transition-colors"
                          style={{ backgroundColor: item.checked ? '#ee7c2b' : '#483323' }}
                        >
                          <div
                            className="absolute top-1 h-4 w-4 bg-white rounded-full transition-transform"
                            style={{ left: item.checked ? '26px' : '4px' }}
                          />
                        </button>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={index}
                      href={item.href || '#'}
                      className="flex items-center justify-between p-4 hover:bg-driver-surface-lighter/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-driver-surface-lighter flex items-center justify-center">
                          <Icon className="w-5 h-5 text-driver-primary" />
                        </div>
                        <div>
                          <span className="text-white font-medium">{item.label}</span>
                          {item.sublabel && (
                            <p className={`text-xs ${item.sublabelColor || 'text-driver-text-secondary'}`}>
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.action ? (
                        <span className="text-driver-primary text-sm font-medium">{item.action}</span>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-driver-text-secondary" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </DriverCard>
          </section>
        ))}

        {/* Logout Button */}
        <DriverButton
          variant="outline"
          size="lg"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" /> Sair da Conta
        </DriverButton>

        {/* Version */}
        <p className="text-center text-driver-text-muted text-xs">
          Versão 2.4.0 (Build 1082)
        </p>
      </main>
    </div>
  )
}
