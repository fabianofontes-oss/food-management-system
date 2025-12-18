'use client'

import { useParams, useRouter } from 'next/navigation'
import { 
  Settings, Store, Puzzle, Link2, Gift, Calendar, Monitor, Sparkles,
  ChevronRight, Palette
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const SETTINGS_SECTIONS = [
  {
    id: 'niche',
    name: 'Kit Inicial',
    description: 'Configure sua loja em 1 clique com templates prontos',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    href: '/settings/niche'
  },
  {
    id: 'store',
    name: 'Dados da Loja',
    description: 'Nome, endereço, telefone, horários e redes sociais',
    icon: Store,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    href: '/settings/store'
  },
  {
    id: 'appearance',
    name: 'Aparência',
    description: 'Cores, layout e visual do cardápio público',
    icon: Palette,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    href: '/appearance'
  },
  {
    id: 'modules',
    name: 'Módulos',
    description: 'Ative funcionalidades: delivery, mesas, fidelidade',
    icon: Puzzle,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    href: '/settings/modules'
  },
  {
    id: 'platforms',
    name: 'Integrações',
    description: 'iFood, Rappi, Loggi, Google Reviews',
    icon: Link2,
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    href: '/settings/platforms'
  },
  {
    id: 'loyalty',
    name: 'Fidelidade',
    description: 'Programa de pontos e benefícios para clientes',
    icon: Gift,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    href: '/settings/loyalty'
  },
  {
    id: 'scheduling',
    name: 'Agendamento',
    description: 'Permita pedidos agendados para data futura',
    icon: Calendar,
    color: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
    href: '/settings/scheduling'
  },
]

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const base = `/${slug}/dashboard`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-lg shadow-slate-500/25">
            <Settings className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          Configurações
        </h1>
        <p className="text-slate-500 mt-2 ml-14">
          Central de configurações da sua loja
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Card 
              key={section.id}
              className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-slate-200"
              onClick={() => router.push(`${base}${section.href}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 ${section.bgColor} rounded-xl ${section.textColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 group-hover:text-slate-900">
                        {section.name}
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
