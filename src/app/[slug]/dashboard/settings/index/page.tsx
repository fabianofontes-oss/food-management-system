'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Settings, Store, Puzzle, Link2, CreditCard, Bell,
  ChevronRight, Sparkles
} from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    id: 'store',
    name: 'Dados da Loja',
    description: 'Nome, endereço, horários, visual e redes sociais',
    icon: <Store className="w-7 h-7" />,
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    href: '/settings/store'
  },
  {
    id: 'modules',
    name: 'Módulos e Funcionalidades',
    description: 'Ative e configure cada recurso do sistema',
    icon: <Puzzle className="w-7 h-7" />,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    href: '/settings/modules',
    badge: 'Novo'
  },
  {
    id: 'platforms',
    name: 'Plataformas e Integrações',
    description: 'iFood, Rappi, Loggi, Google Reviews e mais',
    icon: <Link2 className="w-7 h-7" />,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    href: '/settings/platforms',
    badge: 'Novo'
  },
  {
    id: 'payments',
    name: 'Formas de Pagamento',
    description: 'PIX, cartões, dinheiro e taxas',
    icon: <CreditCard className="w-7 h-7" />,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    href: '/settings'
  },
  {
    id: 'notifications',
    name: 'Notificações',
    description: 'WhatsApp, e-mail, push e alertas sonoros',
    icon: <Bell className="w-7 h-7" />,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    href: '/settings'
  }
]

export default function SettingsHubPage() {
  const params = useParams()
  const slug = params.slug as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/25 mb-4">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
            Configurações
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Personalize e configure sua loja
          </p>
        </div>

        {/* Grid de Seções */}
        <div className="grid gap-4">
          {SETTINGS_SECTIONS.map(section => (
            <Link 
              key={section.id}
              href={`/${slug}/dashboard${section.href}`}
              className="group"
            >
              <div className={`bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border-2 border-slate-100 
                hover:border-violet-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 ${section.bgColor} rounded-2xl ${section.textColor} 
                      group-hover:scale-110 transition-transform duration-300`}>
                      {section.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                          {section.name}
                        </h2>
                        {section.badge && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-1">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dica */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-violet-800 mb-1">Dica</h3>
              <p className="text-violet-700 text-sm">
                Comece pelos <strong>Dados da Loja</strong> para configurar informações básicas, 
                depois vá em <strong>Módulos</strong> para ativar apenas as funcionalidades que você precisa.
                As <strong>Plataformas</strong> permitem integrar com iFood, Rappi e outros serviços.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
